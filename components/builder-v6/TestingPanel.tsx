"use client";

import { useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Loader2, PlayCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  stepId: string;
  stepType: 'mcp' | 'response';
  stepName: string;
  status: 'success' | 'error' | 'running';
  output?: string;
  error?: string;
  timestamp: number;
}

export function TestingPanel() {
  const { toast } = useToast();
  const { workflowSteps, getMCPConfigById, getResponseConfigById } = useMCPBuilderStore();
  
  const [testInput, setTestInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  // Validate workflow before testing
  const validateWorkflow = (): { valid: boolean; message: string } => {
    if (workflowSteps.length === 0) {
      return { valid: false, message: 'Workflow is empty. Add steps to test.' };
    }

    // Check if first step is MCP
    if (workflowSteps[0].type !== 'mcp') {
      return { valid: false, message: 'First step must be an MCP.' };
    }

    // Check for undeployed MCPs
    for (const step of workflowSteps) {
      if (step.type === 'mcp' && step.mcpConfigId) {
        const config = getMCPConfigById(step.mcpConfigId);
        if (config?.deploymentStatus !== 'deployed') {
          return {
            valid: false,
            message: `MCP "${config?.name}" must be deployed before testing.`,
          };
        }
      }
    }

    // Check alternating pattern
    for (let i = 0; i < workflowSteps.length - 1; i++) {
      const current = workflowSteps[i];
      const next = workflowSteps[i + 1];
      
      if (current.type === 'mcp' && next.type !== 'response') {
        return { valid: false, message: 'MCP must be followed by a Response step.' };
      }
      if (current.type === 'response' && next.type !== 'mcp') {
        return { valid: false, message: 'Response must be followed by an MCP step.' };
      }
    }

    return { valid: true, message: '' };
  };

  // Simulate step execution
  const simulateStepExecution = async (step: any, stepIndex: number, input: string): Promise<TestResult> => {
    return new Promise((resolve) => {
      // Simulate processing time (1-2 seconds)
      const processingTime = 1000 + Math.random() * 1000;
      
      setTimeout(() => {
        if (step.type === 'mcp') {
          const config = step.mcpConfigId ? getMCPConfigById(step.mcpConfigId) : null;
          const stepName = config?.name || 'MCP Step';
          
          // Simulate MCP execution
          const mockOutput = {
            model: step.model || config?.model || 'gpt-4',
            input: input,
            response: `Processed by ${stepName} using ${step.selectedTools?.length || 0} tool(s). Result: ${input.toUpperCase()}`,
            tools_used: step.selectedTools?.length || 0,
            timestamp: new Date().toISOString(),
          };

          resolve({
            stepId: step.id,
            stepType: 'mcp',
            stepName: stepName,
            status: 'success',
            output: JSON.stringify(mockOutput, null, 2),
            timestamp: Date.now(),
          });
        } else {
          // Response step
          const config = step.responseConfigId ? getResponseConfigById(step.responseConfigId) : null;
          const stepName = config?.name || 'Response Handler';
          
          let processedOutput = input;
          
          if (step.responseType === 'llm-reprocess') {
            processedOutput = `Reprocessed: ${input}\n\nReprocess Instructions: ${step.reprocessInstructions || 'None'}`;
          }

          const mockOutput = {
            type: step.responseType,
            error_handling: step.errorHandling,
            output: processedOutput,
            timestamp: new Date().toISOString(),
          };

          resolve({
            stepId: step.id,
            stepType: 'response',
            stepName: stepName,
            status: 'success',
            output: JSON.stringify(mockOutput, null, 2),
            timestamp: Date.now(),
          });
        }
      }, processingTime);
    });
  };

  // Run workflow test
  const handleRunTest = async () => {
    // Validate workflow
    const validation = validateWorkflow();
    if (!validation.valid) {
      toast({
        title: 'Workflow Validation Failed',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    // Check for test input
    if (!testInput.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter test input data',
        variant: 'destructive',
      });
      return;
    }

    // Start test
    setIsRunning(true);
    setTestResults([]);
    setCurrentStepIndex(0);

    let currentInput = testInput;

    // Execute each step
    for (let i = 0; i < workflowSteps.length; i++) {
      setCurrentStepIndex(i);
      const step = workflowSteps[i];
      
      try {
        const result = await simulateStepExecution(step, i, currentInput);
        setTestResults((prev) => [...prev, result]);
        
        // Use output as input for next step
        if (result.output) {
          currentInput = result.output;
        }
      } catch (error) {
        const errorResult: TestResult = {
          stepId: step.id,
          stepType: step.type,
          stepName: step.type === 'mcp' ? 'MCP Step' : 'Response Step',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        };
        setTestResults((prev) => [...prev, errorResult]);
        break;
      }
    }

    setIsRunning(false);
    setCurrentStepIndex(-1);

    toast({
      title: 'Test Complete',
      description: `Executed ${workflowSteps.length} step(s) successfully`,
    });
  };

  // Clear test results
  const handleClear = () => {
    setTestResults([]);
    setCurrentStepIndex(-1);
  };

  const validation = validateWorkflow();

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Test Workflow</h3>
        <p className="text-sm text-muted-foreground">
          Test your workflow with sample input data
        </p>
      </div>

      <Separator />

      {/* Workflow Validation Status */}
      {!validation.valid && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Workflow Not Ready
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {validation.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {validation.valid && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Workflow Ready
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {workflowSteps.length} step(s) configured and validated
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Input */}
      <div className="space-y-2">
        <Label htmlFor="test-input">Test Input</Label>
        <Textarea
          id="test-input"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Enter your test data here... (e.g., 'Search for React tutorials')"
          className="min-h-[100px]"
          disabled={isRunning}
        />
        <p className="text-xs text-muted-foreground">
          This input will be passed to the first MCP in your workflow
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleRunTest}
          disabled={!validation.valid || isRunning || !testInput.trim()}
          className="flex-1"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Test...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-2" />
              Run Test
            </>
          )}
        </Button>
        {testResults.length > 0 && (
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={isRunning}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Test Results</h4>
            {testResults.map((result, index) => (
              <Card key={result.stepId} className={
                result.status === 'error'
                  ? 'border-red-500'
                  : result.status === 'success'
                  ? 'border-green-500'
                  : ''
              }>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">
                        Step {index + 1}: {result.stepName}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {result.stepType.toUpperCase()}
                      </Badge>
                    </div>
                    {result.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {result.status === 'success' && result.output && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Output:</Label>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
                        {result.output}
                      </pre>
                    </div>
                  )}
                  {result.status === 'error' && result.error && (
                    <div className="space-y-2">
                      <Label className="text-xs text-red-600 dark:text-red-400">Error:</Label>
                      <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                        {result.error}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Completed at {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Running Status */}
      {isRunning && currentStepIndex >= 0 && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Executing Step {currentStepIndex + 1} of {workflowSteps.length}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {workflowSteps[currentStepIndex]?.type === 'mcp' ? 'Running MCP...' : 'Processing response...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
