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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { FlowNode } from '@/types/mcp';
import { useMCPStore } from '@/store/mcpStore';
import { useToast } from '@/components/ui/use-toast';

interface ResponseNodePropertiesProps {
  node: FlowNode;
}

export default function ResponseNodeProperties({ node }: ResponseNodePropertiesProps) {
  const { updateFlowNode, getConnectedNodes } = useMCPStore();
  const { toast } = useToast();
  
  const [label, setLabel] = useState(node.data.label || 'Response to User');
  const [responseText, setResponseText] = useState(node.data.responseText || '');
  const [responseType, setResponseType] = useState(node.data.responseType || 'dynamic');
  const [formatStyle, setFormatStyle] = useState(node.data.formatting?.style || 'plain');
  const [includeMetadata, setIncludeMetadata] = useState(node.data.formatting?.includeMetadata || false);
  const [variableMapping, setVariableMapping] = useState(node.data.variableMapping || []);
  const [errorTemplate, setErrorTemplate] = useState(node.data.errorHandling?.errorTemplate || '');
  const [fallback, setFallback] = useState(node.data.errorHandling?.fallback || '');

  const connectedNodes = getConnectedNodes(node.id);
  const hasConnections = connectedNodes.incoming.length > 0;

  const handleSave = () => {
    updateFlowNode(node.id, {
      data: {
        ...node.data,
        label,
        responseText: responseText || undefined,
        responseType,
        formatting: (responseType === 'template' || responseType === 'fixed') ? {
          style: formatStyle,
          includeMetadata,
        } : undefined,
        variableMapping: (responseType === 'template' && variableMapping.length > 0) ? variableMapping : undefined,
        errorHandling: (errorTemplate || fallback) ? {
          errorTemplate: errorTemplate || undefined,
          fallback: fallback || undefined,
        } : undefined,
      },
    });
    toast({ title: 'Saved', description: 'Response properties updated' });
  };

  const handleAddMapping = () => {
    setVariableMapping([...variableMapping, { templateVar: '', source: 'llm', path: '' }]);
  };

  const handleUpdateMapping = (index: number, field: string, value: string) => {
    const updated = [...variableMapping];
    updated[index] = { ...updated[index], [field]: value };
    setVariableMapping(updated);
  };

  const handleDeleteMapping = (index: number) => {
    setVariableMapping(variableMapping.filter((_, i) => i !== index));
  };

  const llmCount = connectedNodes.incoming.filter(n => n.type === 'llm').length;
  const toolCount = connectedNodes.incoming.filter(n => n.type === 'tool').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          💬 Response Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-3">
          <div>
            <Label>Response Name/Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Response to User"
            />
          </div>

          <div>
            <Label>Response Type</Label>
            <Select value={responseType} onValueChange={(v: any) => setResponseType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dynamic">Dynamic - Generated from LLM/Tool output</SelectItem>
                <SelectItem value="template">Template - Uses template with variables</SelectItem>
                <SelectItem value="fixed">Fixed - Always returns same text</SelectItem>
                <SelectItem value="json">JSON - Returns structured JSON</SelectItem>
                <SelectItem value="error">Error Response - For error cases</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(responseType === 'template' || responseType === 'fixed') && (
            <div>
              <Label>Response Template/Text</Label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={responseType === 'template' ? 'Enter template with variables like {llmResponse}, {toolResult}...' : 'Enter fixed response text...'}
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {responseType === 'template' 
                  ? 'Use {variableName} for variable substitution'
                  : 'This text will always be returned'
                }
              </p>
            </div>
          )}
        </div>

        {(responseType === 'template' || responseType === 'fixed') && (
          <>
            <Separator />

            {/* Response Formatting */}
            <div className="space-y-3">
              <Label>Response Formatting</Label>
              <div>
                <Label className="text-xs">Format Style</Label>
                <Select value={formatStyle} onValueChange={(v: any) => setFormatStyle(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plain">Plain Text</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                />
                <Label className="text-sm">Include metadata (execution time, tokens used)</Label>
              </div>
            </div>
          </>
        )}

        {responseType === 'template' && (
          <>
            <Separator />

            {/* Variable Mapping */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variable Mapping</Label>
                <Button size="sm" variant="outline" onClick={handleAddMapping}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Mapping
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Map data from connected nodes to template variables
              </p>
              {variableMapping.map((mapping, index) => (
                <div key={index} className="border rounded p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <Input
                        value={mapping.templateVar}
                        onChange={(e) => handleUpdateMapping(index, 'templateVar', e.target.value)}
                        placeholder="{variableName}"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={mapping.source}
                        onValueChange={(v) => handleUpdateMapping(index, 'source', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llm">LLM Response</SelectItem>
                          <SelectItem value="tool">Tool Output</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input
                        value={mapping.path || ''}
                        onChange={(e) => handleUpdateMapping(index, 'path', e.target.value)}
                        placeholder="JSONPath"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteMapping(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />

        {/* Error Handling */}
        <div className="space-y-3">
          <Label>Error Handling</Label>
          <div>
            <Label className="text-xs">Error Response Template</Label>
            <Textarea
              value={errorTemplate}
              onChange={(e) => setErrorTemplate(e.target.value)}
              placeholder="Template used when connected nodes fail..."
              rows={3}
            />
          </div>
          <div>
            <Label className="text-xs">Fallback Response</Label>
            <Input
              value={fallback}
              onChange={(e) => setFallback(e.target.value)}
              placeholder="Default message if all sources fail"
            />
          </div>
        </div>

        <Separator />

        {/* Connection Info */}
        <div className="space-y-2">
          <Label>Connection Info</Label>
          <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span>Connected From:</span>
              <Badge>{connectedNodes.incoming.length} nodes</Badge>
            </div>
            {connectedNodes.incoming.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs">
                  {llmCount} LLM node{llmCount !== 1 ? 's' : ''}, {toolCount} Tool node{toolCount !== 1 ? 's' : ''}
                </p>
                {connectedNodes.incoming.map((inNode) => (
                  <div key={inNode.id} className="text-xs flex items-center gap-2">
                    <span>{inNode.type === 'llm' ? '🤖' : '🔧'}</span>
                    <span>{inNode.data.label}</span>
                  </div>
                ))}
              </div>
            )}
            {!hasConnections && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">This response must have at least one incoming connection</span>
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
