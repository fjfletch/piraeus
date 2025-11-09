"use client";

import { useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Tool } from '@/types/builder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ToolsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToolsImportModal({ open, onOpenChange }: ToolsImportModalProps) {
  const { toast } = useToast();
  const { importTools } = useMCPBuilderStore();
  
  const [isImporting, setIsImporting] = useState(false);
  const [openApiUrl, setOpenApiUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Parse OpenAPI/Swagger specification
  const parseOpenAPITools = (spec: any): Omit<Tool, 'id'>[] => {
    const tools: Omit<Tool, 'id'>[] = [];
    
    try {
      const basePath = spec.basePath || '';
      const schemes = spec.schemes || ['https'];
      const host = spec.host || 'api.example.com';
      const baseUrl = `${schemes[0]}://${host}${basePath}`;

      Object.entries(spec.paths || {}).forEach(([path, pathItem]: [string, any]) => {
        Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
            const tool: Omit<Tool, 'id'> = {
              name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
              description: operation.description || operation.summary || '',
              method: method.toUpperCase() as any,
              url: `${baseUrl}${path}`,
              headers: [],
              queryParams: [],
              body: '',
            };

            // Extract parameters
            (operation.parameters || []).forEach((param: any) => {
              if (param.in === 'header') {
                tool.headers.push({
                  key: param.name,
                  value: `{${param.name}}`,
                });
              } else if (param.in === 'query') {
                tool.queryParams.push({
                  key: param.name,
                  value: `{${param.name}}`,
                });
              } else if (param.in === 'path') {
                // Path parameters are already in the URL
                tool.url = tool.url.replace(`{${param.name}}`, `{${param.name}}`);
              }
            });

            // Add request body for POST/PUT/PATCH
            if (['POST', 'PUT', 'PATCH'].includes(tool.method) && operation.requestBody) {
              tool.body = JSON.stringify(
                operation.requestBody.content?.['application/json']?.example || {},
                null,
                2
              );
            }

            tools.push(tool);
          }
        });
      });
    } catch (error) {
      console.error('Error parsing OpenAPI spec:', error);
    }

    return tools;
  };

  // Parse Postman collection
  const parsePostmanTools = (collection: any): Omit<Tool, 'id'>[] => {
    const tools: Omit<Tool, 'id'>[] = [];

    const processItem = (item: any) => {
      if (item.request) {
        const tool: Omit<Tool, 'id'> = {
          name: item.name || 'Untitled Request',
          description: item.request.description || '',
          method: (item.request.method || 'GET').toUpperCase() as any,
          url: typeof item.request.url === 'string' 
            ? item.request.url 
            : item.request.url?.raw || '',
          headers: [],
          queryParams: [],
          body: '',
        };

        // Extract headers
        if (item.request.header) {
          item.request.header.forEach((header: any) => {
            if (!header.disabled) {
              tool.headers.push({
                key: header.key,
                value: header.value || '',
              });
            }
          });
        }

        // Extract query parameters
        if (item.request.url?.query) {
          item.request.url.query.forEach((param: any) => {
            if (!param.disabled) {
              tool.queryParams.push({
                key: param.key,
                value: param.value || '',
              });
            }
          });
        }

        // Extract body
        if (item.request.body) {
          if (item.request.body.mode === 'raw') {
            tool.body = item.request.body.raw || '';
          } else if (item.request.body.mode === 'urlencoded') {
            tool.body = item.request.body.urlencoded
              ?.map((kv: any) => `${kv.key}=${kv.value}`)
              .join('&') || '';
          }
        }

        tools.push(tool);
      }

      // Recursively process nested items
      if (item.item && Array.isArray(item.item)) {
        item.item.forEach(processItem);
      }
    };

    if (collection.item && Array.isArray(collection.item)) {
      collection.item.forEach(processItem);
    }

    return tools;
  };

  // Handle OpenAPI import
  const handleOpenAPIImport = async () => {
    if (!openApiUrl) {
      toast({
        title: 'URL Required',
        description: 'Please enter an OpenAPI specification URL',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(openApiUrl);
      const spec = await response.json();
      const tools = parseOpenAPITools(spec);
      
      if (tools.length === 0) {
        toast({
          title: 'No Tools Found',
          description: 'No valid endpoints found in the specification',
          variant: 'destructive',
        });
      } else {
        importTools(tools);
        toast({
          title: 'Import Successful',
          description: `Imported ${tools.length} tool(s) from OpenAPI specification`,
        });
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to fetch or parse OpenAPI specification',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Postman import
  const handlePostmanImport = () => {
    if (!selectedFile) {
      toast({
        title: 'File Required',
        description: 'Please select a Postman collection file',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const collection = JSON.parse(e.target?.result as string);
        const tools = parsePostmanTools(collection);
        
        if (tools.length === 0) {
          toast({
            title: 'No Tools Found',
            description: 'No valid requests found in the collection',
            variant: 'destructive',
          });
        } else {
          importTools(tools);
          toast({
            title: 'Import Successful',
            description: `Imported ${tools.length} tool(s) from Postman collection`,
          });
          onOpenChange(false);
        }
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Failed to parse Postman collection file',
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: 'Import Failed',
        description: 'Failed to read file',
        variant: 'destructive',
      });
      setIsImporting(false);
    };

    reader.readAsText(selectedFile);
  };

  // Handle JSON file import
  const handleJSONImport = (file: File) => {
    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const tools = Array.isArray(data) ? data : [data];
        
        // Validate tool format
        const validTools = tools.filter((tool: any) => 
          tool.name && tool.method && tool.url
        );
        
        if (validTools.length === 0) {
          toast({
            title: 'Invalid Format',
            description: 'No valid tools found in the JSON file',
            variant: 'destructive',
          });
        } else {
          importTools(validTools);
          toast({
            title: 'Import Successful',
            description: `Imported ${validTools.length} tool(s) from JSON file`,
          });
          onOpenChange(false);
        }
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Failed to parse JSON file',
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: 'Import Failed',
        description: 'Failed to read file',
        variant: 'destructive',
      });
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Tools</DialogTitle>
          <DialogDescription>
            Import tools from OpenAPI/Swagger, Postman collections, or JSON files
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="openapi" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="openapi">OpenAPI/Swagger</TabsTrigger>
            <TabsTrigger value="postman">Postman</TabsTrigger>
            <TabsTrigger value="json">JSON File</TabsTrigger>
          </TabsList>

          {/* OpenAPI Tab */}
          <TabsContent value="openapi" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="openapi-url">OpenAPI Specification URL</Label>
              <Input
                id="openapi-url"
                value={openApiUrl}
                onChange={(e) => setOpenApiUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL to your OpenAPI 2.0 or 3.0 specification
              </p>
            </div>
            <Button
              onClick={handleOpenAPIImport}
              disabled={isImporting || !openApiUrl}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import from OpenAPI/Swagger
                </>
              )}
            </Button>
          </TabsContent>

          {/* Postman Tab */}
          <TabsContent value="postman" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="postman-file">Postman Collection File</Label>
              <Input
                id="postman-file"
                type="file"
                accept=".json"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Upload a Postman Collection v2.1 JSON file
              </p>
            </div>
            <Button
              onClick={handlePostmanImport}
              disabled={isImporting || !selectedFile}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import from Postman
                </>
              )}
            </Button>
          </TabsContent>

          {/* JSON Tab */}
          <TabsContent value="json" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="json-file">Tool Definition JSON</Label>
              <Input
                id="json-file"
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleJSONImport(file);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Upload a JSON file containing tool definitions (single object or array)
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-muted">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Expected Format:</p>
                  <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`{
  "name": "Tool Name",
  "description": "Description",
  "method": "GET",
  "url": "https://...",
  "headers": [],
  "queryParams": [],
  "body": ""
}`}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
