// Type Definitions for MCP Builder

export interface MCPIntegration {
  id: string;
  name: string;
  description: string;
  version: string;
  format: 'gpt-4' | 'claude' | 'generic';
  author: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  apis: APIConfig[];
  tools: MCPTool[];
  prompts: MCPPrompt[];
  resources: MCPResource[];
  configuration: MCPConfiguration;
  flow: FlowConfiguration;
}

export interface APIConfig {
  id: string;
  name: string;
  baseUrl: string;
  authentication: AuthConfig;
  headers: Record<string, string>;
  timeout: number;
  routes: APIRoute[];
  status: 'connected' | 'disconnected' | 'error';
}

export interface AuthConfig {
  type: 'none' | 'api-key' | 'bearer' | 'oauth2' | 'basic' | 'custom';
  config?: Record<string, any>;
}

export interface APIRoute {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  body?: string; // JSON body for POST, PUT, PATCH, DELETE requests
}

export interface MCPTool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  apiId: string;
  method: string;
  endpoint: string;
  inputSchema: JSONSchema;
  responseHandling: ResponseHandling;
  errorGuidance: string;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface ResponseHandling {
  successPath: string;
  errorHandling: Record<number, string>;
}

export interface MCPPrompt {
  id: string;
  type: 'system' | 'contextual';
  trigger?: string;
  content: string;
}

export interface MCPResource {
  id: string;
  name: string;
  type: 'documentation' | 'database' | 'file';
  uri: string;
  description: string;
}

export interface MCPConfiguration {
  globalPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface FlowNode {
  id: string;
  type: 'query' | 'llm' | 'tool' | 'response' | 'condition';
  position: { x: number; y: number };
  data: {
    label: string;
    // For query nodes
    queryText?: string;
    // For LLM nodes
    llmId?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    availableToolIds?: string[];
    // For tool nodes
    toolId?: string;
    // For response nodes
    responseText?: string;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface FlowConfiguration {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
