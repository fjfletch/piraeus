'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { FlowNode } from '@/types/mcp';
import { useMCPStore } from '@/store/mcpStore';
import { useToast } from '@/components/ui/use-toast';

interface QueryNodePropertiesProps {
  node: FlowNode;
}

export default function QueryNodeProperties({ node }: QueryNodePropertiesProps) {
  const { updateFlowNode, getConnectedNodes } = useMCPStore();
  const { toast } = useToast();
  
  const [label, setLabel] = useState(node.data.label || 'User Query');
  const [queryText, setQueryText] = useState(node.data.queryText || '');
  const [queryType, setQueryType] = useState(node.data.queryType || 'general');
  const [variables, setVariables] = useState(node.data.variables || []);
  const [minLength, setMinLength] = useState(node.data.validation?.minLength?.toString() || '');
  const [maxLength, setMaxLength] = useState(node.data.validation?.maxLength?.toString() || '');
  const [keywords, setKeywords] = useState(node.data.validation?.requiredKeywords?.join(', ') || '');

  const connectedNodes = getConnectedNodes(node.id);
  const hasConnections = connectedNodes.outgoing.length > 0;

  const handleSave = () => {
    updateFlowNode(node.id, {
      data: {
        ...node.data,
        label,
        queryText,
        queryType,
        variables: variables.length > 0 ? variables : undefined,
        validation: (minLength || maxLength || keywords) ? {
          minLength: minLength ? parseInt(minLength) : undefined,
          maxLength: maxLength ? parseInt(maxLength) : undefined,
          requiredKeywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
        } : undefined,
      },
    });
    toast({ title: 'Saved', description: 'Query properties updated' });
  };

  const handleAddVariable = () => {
    setVariables([...variables, { name: '', defaultValue: '', description: '' }]);
  };

  const handleUpdateVariable = (index: number, field: string, value: string) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const handleDeleteVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const charCount = queryText.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🎤 User Query Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-3">
          <div>
            <Label>Query Name/Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="User Query"
            />
          </div>

          <div>
            <Label>Query Text *</Label>
            <Textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Enter the user's question or request..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This text will be sent to connected LLM nodes when testing • {charCount} characters
            </p>
          </div>

          <div>
            <Label>Query Type</Label>
            <Select value={queryType} onValueChange={setQueryType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Query</SelectItem>
                <SelectItem value="command">Command/Instruction</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="data">Data Request</SelectItem>
                <SelectItem value="creative">Creative Request</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Helps categorize the type of user input
            </p>
          </div>
        </div>

        <Separator />

        {/* Variables */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Variables/Placeholders</Label>
            <Button size="sm" variant="outline" onClick={handleAddVariable}>
              <Plus className="h-3 w-3 mr-1" />
              Add Variable
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Define variables that will be replaced when query is executed (e.g., {'{userName}'}, {'{date}'})
          </p>
          {variables.map((variable, index) => (
            <div key={index} className="border rounded p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Input
                    value={variable.name}
                    onChange={(e) => handleUpdateVariable(index, 'name', e.target.value)}
                    placeholder="variableName"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="col-span-6">
                  <Input
                    value={variable.defaultValue}
                    onChange={(e) => handleUpdateVariable(index, 'defaultValue', e.target.value)}
                    placeholder="Default value"
                    className="text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteVariable(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input
                value={variable.description}
                onChange={(e) => handleUpdateVariable(index, 'description', e.target.value)}
                placeholder="Description"
                className="text-sm"
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Validation Rules */}
        <div className="space-y-3">
          <Label>Validation Rules</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Min Length</Label>
              <Input
                type="number"
                value={minLength}
                onChange={(e) => setMinLength(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="text-xs">Max Length</Label>
              <Input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Required Keywords (comma-separated)</Label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="keyword1, keyword2"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Validate query before sending to LLM
          </p>
        </div>

        <Separator />

        {/* Connection Info */}
        <div className="space-y-2">
          <Label>Connection Info</Label>
          <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span>Connected To:</span>
              <Badge>{connectedNodes.outgoing.length} LLMs</Badge>
            </div>
            {connectedNodes.outgoing.length > 0 && (
              <div className="space-y-1">
                {connectedNodes.outgoing.map((llmNode) => (
                  <div key={llmNode.id} className="text-xs flex items-center gap-2">
                    <span>🤖</span>
                    <span>{llmNode.data.label}</span>
                  </div>
                ))}
              </div>
            )}
            {!hasConnections && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">This query must connect to at least one LLM node</span>
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
