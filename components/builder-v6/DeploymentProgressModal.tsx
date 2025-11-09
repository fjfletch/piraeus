"use client";

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Rocket } from 'lucide-react';

interface DeploymentProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpName: string;
  onComplete: () => void;
}

interface DeploymentStep {
  label: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
}

export function DeploymentProgressModal({
  open,
  onOpenChange,
  mcpName,
  onComplete,
}: DeploymentProgressModalProps) {
  const [overallProgress, setOverallProgress] = useState(0);
  const [steps, setSteps] = useState<DeploymentStep[]>([
    { label: 'Validating configuration', status: 'pending', progress: 0 },
    { label: 'Building API endpoints', status: 'pending', progress: 0 },
    { label: 'Deploying to server', status: 'pending', progress: 0 },
    { label: 'Starting services', status: 'pending', progress: 0 },
    { label: 'Finalizing deployment', status: 'pending', progress: 0 },
  ]);
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setOverallProgress(0);
      setIsComplete(false);
      setDeploymentUrl('');
      setSteps([
        { label: 'Validating configuration', status: 'pending', progress: 0 },
        { label: 'Building API endpoints', status: 'pending', progress: 0 },
        { label: 'Deploying to server', status: 'pending', progress: 0 },
        { label: 'Starting services', status: 'pending', progress: 0 },
        { label: 'Finalizing deployment', status: 'pending', progress: 0 },
      ]);
      return;
    }

    // Start deployment simulation
    let stepIndex = 0;
    const stepDurations = [1500, 2000, 2500, 1800, 1200]; // milliseconds

    const processSteps = () => {
      if (stepIndex >= steps.length) {
        // All steps complete
        setOverallProgress(100);
        setIsComplete(true);
        setDeploymentUrl(`https://mcp-server.example.com/mcp/${Date.now()}`);
        
        setTimeout(() => {
          onComplete();
        }, 500);
        return;
      }

      // Mark current step as in-progress
      setSteps((prev) =>
        prev.map((step, idx) =>
          idx === stepIndex
            ? { ...step, status: 'in-progress' as const }
            : step
        )
      );

      // Update overall progress
      setOverallProgress(((stepIndex + 0.5) / steps.length) * 100);

      // Complete after duration
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, idx) =>
            idx === stepIndex
              ? { ...step, status: 'completed' as const, progress: 100 }
              : step
          )
        );

        setOverallProgress(((stepIndex + 1) / steps.length) * 100);
        stepIndex++;
        processSteps();
      }, stepDurations[stepIndex]);
    };

    // Start after small delay
    setTimeout(processSteps, 300);
  }, [open, onComplete, steps.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Rocket className="h-6 w-6 text-primary" />
            <DialogTitle>Deploying MCP to Server</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{mcpName}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Step List */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-3">
                  {step.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                  {step.status === 'in-progress' && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                  )}
                  {step.status === 'pending' && (
                    <div className="h-5 w-5 border-2 border-border rounded-full flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      step.status === 'completed'
                        ? 'text-foreground'
                        : step.status === 'in-progress'
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {step.status === 'in-progress' && (
                  <div className="ml-8 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse w-full" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Success Message */}
          {isComplete && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-green-600 dark:text-green-400 mb-1">
                    Deployment successful!
                  </p>
                  <p className="text-xs text-muted-foreground break-all">
                    {deploymentUrl}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
