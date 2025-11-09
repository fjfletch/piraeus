'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { APIConfig, APIRoute } from '@/types/mcp';
import { importOpenAPISpec, parseOpenAPISpec } from '@/lib/api-client';

interface APIConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: APIConfig) => void;
  existingAPI?: APIConfig | null;
}

export default function APIConfigModal({
  open,
  onOpenChange,
  onSave,
  existingAPI,
}: APIConfigModalProps) {
  const { toast } = useToast();
  const [apiName, setApiName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<'none' | 'api-key' | 'bearer' | 'oauth2' | 'basic' | 'custom'>('none');
  const [timeout, setTimeout] = useState(30);
  const [routes, setRoutes] = useState<Array<APIRoute & { tempId?: string }>>([]);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; tempId: string }>>([]);
  const [openApiUrl, setOpenApiUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (existingAPI && open) {
      setApiName(existingAPI.name);
      setBaseUrl(existingAPI.baseUrl);
      setAuthType(existingAPI.authentication.type);
      setTimeout(existingAPI.timeout);
      setRoutes(existingAPI.routes);
      setHeaders(
        Object.entries(existingAPI.headers).map(([key, value]) => ({
          key,
          value,
          tempId: Math.random().toString(),
        }))
      );
    } else if (open) {
      // Reset form for new API
      setApiName('');
      setBaseUrl('');
      setAuthType('none');
      setTimeout(30);
      setRoutes([]);
      setHeaders([]);
      setOpenApiUrl('');
    }
  }, [existingAPI, open]);

  const handleImportOpenAPI = async () => {
    if (!openApiUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an OpenAPI spec URL',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const spec = await importOpenAPISpec(openApiUrl);
      const { baseUrl: parsedBaseUrl, routes: parsedRoutes } = parseOpenAPISpec(spec);

      if (parsedBaseUrl) setBaseUrl(parsedBaseUrl);
      
      const newRoutes = parsedRoutes.map((route) => ({
        id: Date.now().toString() + Math.random(),
        method: route.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        path: route.path,
        description: route.description,
      }));

      setRoutes(newRoutes);
      toast({
        title: 'Success',
        description: `Imported ${newRoutes.length} routes from OpenAPI spec`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import OpenAPI spec',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddRoute = () => {
    setRoutes([
      ...routes,
      {
        id: Date.now().toString() + Math.random(),
        method: 'POST',
        path: '/api/',
        description: '',
        body: '',
      },
    ]);
  };

  const handleUpdateRoute = (id: string, field: string, value: string) => {
    setRoutes(
      routes.map((route) =>
        route.id === id ? { ...route, [field]: value } : route
      )
    );
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter((route) => route.id !== id));
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '', tempId: Math.random().toString() }]);
  };

  const handleUpdateHeader = (tempId: string, field: 'key' | 'value', value: string) => {
    setHeaders(
      headers.map((header) =>
        header.tempId === tempId ? { ...header, [field]: value } : header
      )
    );
  };

  const handleDeleteHeader = (tempId: string) => {
    setHeaders(headers.filter((header) => header.tempId !== tempId));
  };

  const handleSave = () => {
    // Validation
    if (!apiName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'API name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!baseUrl.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Base URL is required',
        variant: 'destructive',
      });
      return;
    }

    const config: APIConfig = {
      id: existingAPI?.id || Date.now().toString(),
      name: apiName,
      baseUrl: baseUrl,
      authentication: { type: authType, config: {} },
      headers: Object.fromEntries(
        headers.filter((h) => h.key).map((h) => [h.key, h.value])
      ),
      timeout: timeout,
      routes: routes.map((r) => ({
        id: r.id,
        method: r.method,
        path: r.path,
        description: r.description,
        body: r.body || undefined,
      })),
      status: 'disconnected',
    };

    onSave(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingAPI ? 'Edit API' : 'Add API'}</DialogTitle>
          <DialogDescription>
            Configure API connection and routes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>API Name *</Label>
            <Input
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              placeholder="My API"
            />
          </div>

          <div>
            <Label>Base URL *</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
            />
          </div>

          <div>
            <Label>Authentication Type</Label>
            <Select value={authType} onValueChange={(v: any) => setAuthType(v)}>
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

          <div>
            <Label>Timeout (seconds)</Label>
            <Input
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value) || 30)}
            />
          </div>

          <div>
            <Label>Import Configuration</Label>
            <Tabs defaultValue="manual" className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="openapi">OpenAPI</TabsTrigger>
                <TabsTrigger value="postman">Postman</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="openapi" className="space-y-2">
                <Input
                  placeholder="https://api.example.com/openapi.json"
                  value={openApiUrl}
                  onChange={(e) => setOpenApiUrl(e.target.value)}
                />
                <Button
                  onClick={handleImportOpenAPI}
                  disabled={isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Import from OpenAPI
                </Button>
              </TabsContent>

              <TabsContent value="postman">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Postman import coming soon
                </p>
              </TabsContent>

              <TabsContent value="manual">
                <p className="text-sm text-muted-foreground">
                  Add routes manually below
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Routes</Label>
              <Button size="sm" variant="outline" onClick={handleAddRoute}>
                <Plus className="h-3 w-3 mr-1" />
                Add Route
              </Button>
            </div>

            {routes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm border rounded">
                No routes yet. Click &apos;Add Route&apos; to add one.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {routes.map((route) => (
                  <div key={route.id} className="border rounded p-3 space-y-2 bg-muted/30">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <Select
                          value={route.method}
                          onValueChange={(v) => handleUpdateRoute(route.id, 'method', v)}
                        >
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
                      <div className="col-span-8">
                        <Input
                          value={route.path}
                          onChange={(e) =>
                            handleUpdateRoute(route.id, 'path', e.target.value)
                          }
                          placeholder="/api/resource"
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteRoute(route.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      value={route.description}
                      onChange={(e) =>
                        handleUpdateRoute(route.id, 'description', e.target.value)
                      }
                      placeholder="Description (optional)"
                    />
                    
                    {/* Show JSON Body field for methods that typically need it */}
                    {['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method) && (
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Request Body (JSON format)
                        </Label>
                        <Textarea
                          value={route.body || ''}
                          onChange={(e) =>
                            handleUpdateRoute(route.id, 'body', e.target.value)
                          }
                          placeholder={'{\n  "key": "value"\n}'}
                          rows={4}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional: Example JSON body structure for this endpoint
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Global Headers</Label>
              <Button size="sm" variant="outline" onClick={handleAddHeader}>
                <Plus className="h-3 w-3 mr-1" />
                Add Header
              </Button>
            </div>

            {headers.length > 0 && (
              <div className="space-y-2">
                {headers.map((header) => (
                  <div key={header.tempId} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input
                        value={header.key}
                        onChange={(e) =>
                          handleUpdateHeader(header.tempId, 'key', e.target.value)
                        }
                        placeholder="Header-Name"
                      />
                    </div>
                    <div className="col-span-6">
                      <Input
                        value={header.value}
                        onChange={(e) =>
                          handleUpdateHeader(header.tempId, 'value', e.target.value)
                        }
                        placeholder="Header Value"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteHeader(header.tempId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {existingAPI ? 'Update' : 'Add'} API
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
