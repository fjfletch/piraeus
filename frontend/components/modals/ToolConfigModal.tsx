'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { MCPTool, JSONSchema } from '@/types/mcp';
import { useMCPStore } from '@/store/mcpStore';

interface ToolConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: MCPTool) => void;
  existingTool?: MCPTool | null;
}

interface Parameter {
  tempId: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export default function ToolConfigModal({
  open,
  onOpenChange,
  onSave,
  existingTool,
}: ToolConfigModalProps) {
  const { toast } = useToast();
  const { currentMCP } = useMCPStore();
  
  const [toolName, setToolName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [apiId, setApiId] = useState('');
  const [method, setMethod] = useState('POST');
  const [endpoint, setEndpoint] = useState('');
  const [successPath, setSuccessPath] = useState('$');
  const [errorGuidance, setErrorGuidance] = useState('');
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [jsonSchema, setJsonSchema] = useState('');
  const [schemaMode, setSchemaMode] = useState<'visual' | 'json'>('visual');

  useEffect(() => {
    if (existingTool && open) {
      setToolName(existingTool.name);
      setDisplayName(existingTool.displayName);
      setDescription(existingTool.description);
      setApiId(existingTool.apiId);
      setMethod(existingTool.method);
      setEndpoint(existingTool.endpoint);
      setSuccessPath(existingTool.responseHandling.successPath);
      setErrorGuidance(existingTool.errorGuidance);
      
      // Parse existing schema into parameters
      const schema = existingTool.inputSchema;
      if (schema.properties) {
        const params = Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
          tempId: Math.random().toString(),
          name,
          type: prop.type || 'string',
          description: prop.description || '',
          required: schema.required?.includes(name) || false,
        }));
        setParameters(params);
      }
      
      setJsonSchema(JSON.stringify(existingTool.inputSchema, null, 2));
    } else if (open) {
      // Reset form
      setToolName('');
      setDisplayName('');
      setDescription('');
      setApiId('');
      setMethod('POST');
      setEndpoint('');
      setSuccessPath('$');
      setErrorGuidance('');
      setParameters([]);
      setJsonSchema(JSON.stringify({ type: 'object', properties: {}, required: [] }, null, 2));
      setSchemaMode('visual');
    }
  }, [existingTool, open]);

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        tempId: Math.random().toString(),
        name: '',
        type: 'string',
        description: '',
        required: false,
      },
    ]);
  };

  const handleUpdateParameter = (
    tempId: string,
    field: keyof Parameter,
    value: any
  ) => {
    setParameters(
      parameters.map((param) =>
        param.tempId === tempId ? { ...param, [field]: value } : param
      )
    );
  };

  const handleDeleteParameter = (tempId: string) => {
    setParameters(parameters.filter((param) => param.tempId !== tempId));
  };

  const parametersToSchema = (): JSONSchema => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    parameters.forEach((param) => {
      if (param.name) {
        properties[param.name] = {
          type: param.type,
          description: param.description,
        };
        if (param.required) {
          required.push(param.name);
        }
      }
    });

    return {
      type: 'object',
      properties,
      required,
    };
  };

  const handleSave = () => {
    // Validation
    if (!toolName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Tool name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Description is required',
        variant: 'destructive',
      });
      return;
    }

    if (!apiId) {
      toast({
        title: 'Validation Error',
        description: 'Please select an API',
        variant: 'destructive',
      });
      return;
    }

    let finalSchema: JSONSchema;
    if (schemaMode === 'json') {
      try {
        finalSchema = JSON.parse(jsonSchema);
      } catch (error) {
        toast({
          title: 'Validation Error',
          description: 'Invalid JSON Schema',
          variant: 'destructive',
        });
        return;
      }
    } else {
      finalSchema = parametersToSchema();
    }

    const config: MCPTool = {
      id: existingTool?.id || Date.now().toString(),
      name: toolName,
      displayName: displayName || toolName,
      description,
      apiId,
      method,
      endpoint,
      inputSchema: finalSchema,
      responseHandling: {
        successPath,
        errorHandling: {},
      },
      errorGuidance,
    };

    onSave(config);
  };

  // Sync from visual to JSON
  useEffect(() => {
    if (schemaMode === 'visual') {
      const schema = parametersToSchema();
      setJsonSchema(JSON.stringify(schema, null, 2));
    }
  }, [parameters, schemaMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingTool ? 'Edit Tool' : 'Create Tool'}</DialogTitle>
          <DialogDescription>
            Configure tool for LLM to call
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tool Name * (for LLM)</Label>
              <Input
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="create_event"
                className="font-mono"
              />
            </div>
            <div>
              <Label>Display Name (optional)</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Create Tournament Event"
              />
            </div>
          </div>

          <div>
            <Label>Description * (tells LLM when to use)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Creates a new tournament event with the given details"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Connected API *</Label>
              <Select value={apiId} onValueChange={setApiId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select API" />
                </SelectTrigger>
                <SelectContent>
                  {currentMCP?.apis.map((api) => (
                    <SelectItem key={api.id} value={api.id}>
                      {api.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>HTTP Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Endpoint</Label>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/events"
              className="font-mono"
            />
          </div>

          <div>
            <Label>Input Schema</Label>
            <Tabs value={schemaMode} onValueChange={(v: any) => setSchemaMode(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visual">Visual Builder</TabsTrigger>
                <TabsTrigger value="json">JSON Editor</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Parameters</Label>
                  <Button size="sm" variant="outline" onClick={handleAddParameter}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Parameter
                  </Button>
                </div>

                {parameters.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded">
                    No parameters yet. Click &apos;Add Parameter&apos; to add one.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {parameters.map((param) => (
                      <div key={param.tempId} className="border rounded p-3 space-y-2">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4">
                            <Input
                              value={param.name}
                              onChange={(e) =>
                                handleUpdateParameter(param.tempId, 'name', e.target.value)
                              }
                              placeholder="param_name"
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="col-span-3">
                            <Select
                              value={param.type}
                              onValueChange={(v) =>
                                handleUpdateParameter(param.tempId, 'type', v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">string</SelectItem>
                                <SelectItem value="number">number</SelectItem>
                                <SelectItem value="boolean">boolean</SelectItem>
                                <SelectItem value="array">array</SelectItem>
                                <SelectItem value="object">object</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-4 flex items-center gap-2">
                            <Checkbox
                              checked={param.required}
                              onCheckedChange={(checked) =>
                                handleUpdateParameter(param.tempId, 'required', checked)
                              }
                            />
                            <Label className="text-sm">Required</Label>
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteParameter(param.tempId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Input
                          value={param.description}
                          onChange={(e) =>
                            handleUpdateParameter(param.tempId, 'description', e.target.value)
                          }
                          placeholder="Description"
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="json">
                <Textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                  placeholder={'{\n  \"type\": \"object\",\n  \"properties\": {},\n  \"required\": []\n}'}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Label>Success Response Path</Label>
            <Input
              value={successPath}
              onChange={(e) => setSuccessPath(e.target.value)}
              placeholder="$.data"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              JSONPath to extract from API response (default: $)
            </p>
          </div>

          <div>
            <Label>LLM Guidance on Error</Label>
            <Textarea
              value={errorGuidance}
              onChange={(e) => setErrorGuidance(e.target.value)}
              placeholder="If the API returns an error, suggest the user check the input parameters..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {existingTool ? 'Update' : 'Create'} Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
