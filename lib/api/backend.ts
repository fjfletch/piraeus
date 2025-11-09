/**
 * Backend API Client
 * Handles all communication with the Python backend via the Next.js proxy
 */

import {
  BackendTool,
  BackendToolCreate,
  BackendToolUpdate,
  BackendPrompt,
  BackendPromptCreate,
  BackendPromptUpdate,
  BackendMCPConfig,
  BackendMCPConfigCreate,
  BackendMCPConfigUpdate,
  BackendResponseConfig,
  BackendResponseConfigCreate,
  BackendResponseConfigUpdate,
  BackendFlow,
  BackendFlowCreate,
  BackendFlowUpdate,
} from './types';

// Base URL for backend proxy
const API_BASE = '/api/backend-proxy/api';

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// Tool API
// ============================================================================

const toolsAPI = {
  getAll: (projectId: string): Promise<BackendTool[]> =>
    apiRequest<BackendTool[]>(`/projects/${projectId}/tools`),

  getById: (id: string): Promise<BackendTool> =>
    apiRequest<BackendTool>(`/tools/${id}`),

  create: (projectId: string, data: BackendToolCreate): Promise<BackendTool> =>
    apiRequest<BackendTool>(`/projects/${projectId}/tools`, {
      method: 'POST',
      body: JSON.stringify({ ...data, project_id: projectId }),
    }),

  update: (id: string, data: BackendToolUpdate): Promise<BackendTool> =>
    apiRequest<BackendTool>(`/tools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/tools/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// Prompt API
// ============================================================================

const promptsAPI = {
  getAll: (projectId: string): Promise<BackendPrompt[]> =>
    apiRequest<BackendPrompt[]>(`/projects/${projectId}/prompts`),

  getById: (id: string): Promise<BackendPrompt> =>
    apiRequest<BackendPrompt>(`/prompts/${id}`),

  create: (projectId: string, data: BackendPromptCreate): Promise<BackendPrompt> =>
    apiRequest<BackendPrompt>(`/projects/${projectId}/prompts`, {
      method: 'POST',
      body: JSON.stringify({ ...data, project_id: projectId }),
    }),

  update: (id: string, data: BackendPromptUpdate): Promise<BackendPrompt> =>
    apiRequest<BackendPrompt>(`/prompts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/prompts/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// MCP Config API
// ============================================================================

const mcpConfigsAPI = {
  getAll: (projectId: string): Promise<BackendMCPConfig[]> =>
    apiRequest<BackendMCPConfig[]>(`/projects/${projectId}/mcp-configs`),

  getById: (id: string): Promise<BackendMCPConfig> =>
    apiRequest<BackendMCPConfig>(`/mcp-configs/${id}`),

  create: (projectId: string, data: BackendMCPConfigCreate): Promise<BackendMCPConfig> =>
    apiRequest<BackendMCPConfig>(`/projects/${projectId}/mcp-configs`, {
      method: 'POST',
      body: JSON.stringify({ ...data, project_id: projectId }),
    }),

  update: (id: string, data: BackendMCPConfigUpdate): Promise<BackendMCPConfig> =>
    apiRequest<BackendMCPConfig>(`/mcp-configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/mcp-configs/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// Response Config API
// ============================================================================

const responseConfigsAPI = {
  getAll: (projectId: string): Promise<BackendResponseConfig[]> =>
    apiRequest<BackendResponseConfig[]>(`/projects/${projectId}/response-configs`),

  getById: (id: string): Promise<BackendResponseConfig> =>
    apiRequest<BackendResponseConfig>(`/response-configs/${id}`),

  create: (
    projectId: string,
    data: BackendResponseConfigCreate
  ): Promise<BackendResponseConfig> =>
    apiRequest<BackendResponseConfig>(`/projects/${projectId}/response-configs`, {
      method: 'POST',
      body: JSON.stringify({ ...data, project_id: projectId }),
    }),

  update: (id: string, data: BackendResponseConfigUpdate): Promise<BackendResponseConfig> =>
    apiRequest<BackendResponseConfig>(`/response-configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/response-configs/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// Flow API
// ============================================================================

const flowsAPI = {
  getAll: (projectId: string): Promise<BackendFlow[]> =>
    apiRequest<BackendFlow[]>(`/projects/${projectId}/flows`),

  getById: (id: string): Promise<BackendFlow> =>
    apiRequest<BackendFlow>(`/flows/${id}`),

  create: (projectId: string, data: BackendFlowCreate): Promise<BackendFlow> =>
    apiRequest<BackendFlow>(`/projects/${projectId}/flows`, {
      method: 'POST',
      body: JSON.stringify({ ...data, project_id: projectId }),
    }),

  update: (id: string, data: BackendFlowUpdate): Promise<BackendFlow> =>
    apiRequest<BackendFlow>(`/flows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/flows/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// Workflow Execution API
// ============================================================================

export interface WorkflowExecuteRequest {
  user_instructions: string;
  tool_ids: string[];
  format_response?: boolean;
  response_format_instructions?: string;
}

export interface WorkflowExecuteResponse {
  status: 'success' | 'error';
  selected_tool?: string;
  http_spec?: any;
  raw_response?: any;
  formatted_response?: string;
  error?: string;
  error_stage?: string;
}

const workflowAPI = {
  execute: (data: WorkflowExecuteRequest): Promise<WorkflowExecuteResponse> =>
    apiRequest<WorkflowExecuteResponse>(`/workflow`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// Export Default API Client
// ============================================================================

const backendAPI = {
  tools: toolsAPI,
  prompts: promptsAPI,
  mcpConfigs: mcpConfigsAPI,
  responseConfigs: responseConfigsAPI,
  flows: flowsAPI,
  workflow: workflowAPI,
};

export default backendAPI;

