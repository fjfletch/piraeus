"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { MCPTool } from "@/types/mcp";
import { useToast } from "@/hooks/use-toast";
import { useMCPStore } from "@/store/mcpStore";

interface ToolConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tool: MCPTool) => void;
  existingTool?: MCPTool;
}

export function ToolConfigModal({ open, onOpenChange, onSave, existingTool }: ToolConfigModalProps) {
  const { toast } = useToast();
  const { currentMCP } = useMCPStore();
  
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [apiId, setApiId] = useState("");
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("");
  const [parameters, setParameters] = useState<Array<{ name: string; type: string; description: string; required: boolean }>>([]);
  const [schemaMode, setSchemaMode] = useState<"visual" | "json">("visual");
  const [jsonSchema, setJsonSchema] = useState("");

  useEffect(() => {
    if (existingTool) {
      setName(existingTool.name);
      setDisplayName(existingTool.displayName);
      setDescription(existingTool.description);
      setApiId(existingTool.apiId);
      setMethod(existingTool.method);
      setEndpoint(existingTool.endpoint);
      
      // Convert schema to parameters
      if (existingTool.inputSchema && existingTool.inputSchema.properties) {
        const props = existingTool.inputSchema.properties;
        const required = existingTool.inputSchema.required || [];
        const params = Object.entries(props).map(([key, value]: [string, any]) => ({
          name: key,
          type: value.type || "string",
          description: value.description || "",
          required: required.includes(key)
        }));
        setParameters(params);
      }
    } else {
      resetForm();
    }
  }, [existingTool, open]);

  const resetForm = () => {
    setName("");
    setDisplayName("");
    setDescription("");
    setApiId("");
    setMethod("GET");
    setEndpoint("");
    setParameters([]);
    setJsonSchema("");
  };

  const addParameter = () => {
    setParameters([...parameters, { name: "", type: "string", description: "", required: false }]);
  };

  const updateParameter = (index: number, field: string, value: any) => {
    const newParams = [...parameters];
    newParams[index] = { ...newParams[index], [field]: value };
    setParameters(newParams);
  };

  const deleteParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const parametersToSchema = () => {
    const properties: any = {};
    const required: string[] = [];

    parameters.forEach(param => {
      if (param.name) {
        properties[param.name] = {
          type: param.type,
          description: param.description
        };
        if (param.required) {
          required.push(param.name);
        }
      }
    });

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined
    };
  };

  const handleSave = () => {
    if (!name || !displayName || !description || !apiId || !endpoint) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const tool: MCPTool = {
      id: existingTool?.id || `tool-${Date.now()}`,
      name,
      displayName,
      description,
      apiId,
      method,
      endpoint,
      inputSchema: schemaMode === "visual" ? parametersToSchema() : JSON.parse(jsonSchema)
    };

    onSave(tool);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingTool ? "Edit Tool" : "Create Tool"}</DialogTitle>
          <DialogDescription>Define a function that the LLM can call</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="toolName">Tool Name (function name) *</Label>
              <Input
                id="toolName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="get_weather"
              />
            </div>
            <div>
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Get Weather"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Get current weather for a location"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="api">API *</Label>
              <Select value={apiId} onValueChange={setApiId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an API" />
                </SelectTrigger>
                <SelectContent>
                  {currentMCP?.apis.map(api => (
                    <SelectItem key={api.id} value={api.id}>{api.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Method *</Label>
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
              <div>
                <Label htmlFor="endpoint">Endpoint *</Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/weather"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schema" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={schemaMode === "visual" ? "default" : "outline"}
                size="sm"
                onClick={() => setSchemaMode("visual")}
              >
                Visual
              </Button>
              <Button
                variant={schemaMode === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setSchemaMode("json")}
              >
                JSON
              </Button>
            </div>

            {schemaMode === "visual" ? (
              <>
                <div className="flex justify-between items-center">
                  <Label>Parameters</Label>
                  <Button size="sm" onClick={addParameter}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Parameter
                  </Button>
                </div>

                {parameters.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    No parameters defined yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parameters.map((param, index) => (
                      <div key={index} className="border rounded-md p-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Parameter name"
                            value={param.name}
                            onChange={(e) => updateParameter(index, "name", e.target.value)}
                          />
                          <Select
                            value={param.type}
                            onValueChange={(value) => updateParameter(index, "type", value)}
                          >
                            <SelectTrigger className="w-32">
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteParameter(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Description"
                          value={param.description}
                          onChange={(e) => updateParameter(index, "description", e.target.value)}
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => updateParameter(index, "required", e.target.checked)}
                          />
                          Required
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <Label>JSON Schema</Label>
                <Textarea
                  rows={12}
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  placeholder={`{\n  \"type\": \"object\",\n  \"properties\": {\n    \"city\": {\n      \"type\": \"string\",\n      \"description\": \"City name\"\n    }\n  },\n  \"required\": [\"city\"]\n}`}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            <div>
              <Label htmlFor="successPath">Success Path (JSONPath)</Label>
              <Input
                id="successPath"
                placeholder="$"
                defaultValue="$"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Path to extract data from successful responses
              </p>
            </div>
            <div>
              <Label htmlFor="errorGuidance">Error Handling Guidance</Label>
              <Textarea
                id="errorGuidance"
                placeholder="Instructions for the LLM on how to handle errors..."
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
