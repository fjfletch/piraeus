"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { APIConfig, APIRoute } from "@/types/mcp";
import { useToast } from "@/hooks/use-toast";

interface APIConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: APIConfig) => void;
  existingAPI?: APIConfig;
}

export function APIConfigModal({ open, onOpenChange, onSave, existingAPI }: APIConfigModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [timeout, setTimeoutValue] = useState(30);
  const [authType, setAuthType] = useState<string>("none");
  const [authConfig, setAuthConfig] = useState<any>({});
  const [routes, setRoutes] = useState<APIRoute[]>([]);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (existingAPI) {
      setName(existingAPI.name);
      setBaseUrl(existingAPI.baseUrl);
      setTimeout(existingAPI.timeout || 30);
      setAuthType(existingAPI.authentication.type);
      setAuthConfig(existingAPI.authentication.config || {});
      setRoutes(existingAPI.routes);
      setHeaders(Object.entries(existingAPI.headers || {}).map(([key, value]) => ({ key, value })));
    } else {
      resetForm();
    }
  }, [existingAPI, open]);

  const resetForm = () => {
    setName("");
    setBaseUrl("");
    setTimeout(30);
    setAuthType("none");
    setAuthConfig({});
    setRoutes([]);
    setHeaders([]);
    setTestResult(null);
  };

  const addRoute = () => {
    setRoutes([...routes, { id: `route-${Date.now()}`, method: "GET", path: "/", description: "" }]);
  };

  const updateRoute = (id: string, field: string, value: string) => {
    setRoutes(routes.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const deleteHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);

    // Mock test
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setTestResult({
        success,
        message: success ? "Connection successful!" : "Failed to connect. Please check your configuration."
      });
      setTestLoading(false);
      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: success ? "API is responding correctly" : "Unable to connect to the API",
        variant: success ? "default" : "destructive"
      });
    }, 1500);
  };

  const handleSave = () => {
    if (!name || !baseUrl) {
      toast({
        title: "Missing required fields",
        description: "Please enter API name and base URL",
        variant: "destructive"
      });
      return;
    }

    const headersObj = headers.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const config: APIConfig = {
      id: existingAPI?.id || `api-${Date.now()}`,
      name,
      baseUrl,
      authentication: {
        type: authType as any,
        config: authConfig
      },
      routes,
      headers: headersObj,
      timeout,
      status: "connected"
    };

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingAPI ? "Edit API" : "Configure API"}</DialogTitle>
          <DialogDescription>Configure an external API to connect with your MCP</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="apiName">API Name *</Label>
              <Input
                id="apiName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My API"
              />
            </div>
            <div>
              <Label htmlFor="baseUrl">Base URL *</Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
            <div>
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value))}
              />
            </div>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <div>
              <Label>Authentication Type</Label>
              <Select value={authType} onValueChange={setAuthType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {authType === "api-key" && (
              <div className="space-y-3">
                <div>
                  <Label>Key Name</Label>
                  <Input
                    value={authConfig.keyName || ""}
                    onChange={(e) => setAuthConfig({ ...authConfig, keyName: e.target.value })}
                    placeholder="X-API-Key"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Select
                    value={authConfig.location || "header"}
                    onValueChange={(value) => setAuthConfig({ ...authConfig, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="query">Query Parameter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Key Value</Label>
                  <Input
                    type="password"
                    value={authConfig.value || ""}
                    onChange={(e) => setAuthConfig({ ...authConfig, value: e.target.value })}
                    placeholder="your-api-key"
                  />
                </div>
              </div>
            )}

            {authType === "bearer" && (
              <div>
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  value={authConfig.token || ""}
                  onChange={(e) => setAuthConfig({ ...authConfig, token: e.target.value })}
                  placeholder="your-bearer-token"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>API Routes</Label>
              <Button size="sm" onClick={addRoute}>
                <Plus className="h-4 w-4 mr-1" />
                Add Route
              </Button>
            </div>

            {routes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No routes defined yet
              </div>
            ) : (
              <div className="space-y-3">
                {routes.map((route) => (
                  <div key={route.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex gap-2">
                      <Select
                        value={route.method}
                        onValueChange={(value) => updateRoute(route.id, "method", value)}
                      >
                        <SelectTrigger className="w-32">
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
                      <Input
                        placeholder="/endpoint"
                        value={route.path}
                        onChange={(e) => updateRoute(route.id, "path", e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteRoute(route.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Description"
                      value={route.description}
                      onChange={(e) => updateRoute(route.id, "description", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Custom Headers</Label>
              <Button size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-1" />
                Add Header
              </Button>
            </div>

            {headers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No custom headers
              </div>
            ) : (
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header Name"
                      value={header.key}
                      onChange={(e) => updateHeader(index, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Header Value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, "value", e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteHeader(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div>
              <Button onClick={handleTestConnection} disabled={testLoading}>
                {testLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Test Connection
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-md flex items-start gap-3 ${
                testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <div className="font-medium">
                    {testResult.success ? "Connection Successful" : "Connection Failed"}
                  </div>
                  <div className="text-sm mt-1">{testResult.message}</div>
                </div>
              </div>
            )}
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