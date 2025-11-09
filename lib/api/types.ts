/**
 * Backend API type definitions
 * These types match the Pydantic models in backend/src/dynamic_tools/models/database_models.py
 */

// ============================================================================
// Common Types
// ============================================================================

export interface KeyValuePair {
  key: string;
  value: string;
}

// ============================================================================
// Tool Types
// ============================================================================

export interface BackendTool {
  id: string; // UUID
  numeric_id: number;
  name: string;
  description?: string;
  method?: string;
  url?: string;
  headers?: KeyValuePair[];
  query_params?: KeyValuePair[];
  body_config?: any;
  tool_config?: any;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendToolCreate {
  name: string;
  description?: string;
  method?: string;
  url?: string;
  headers?: KeyValuePair[];
  query_params?: KeyValuePair[];
  body_config?: any;
  project_id?: string;
}

export interface BackendToolUpdate {
  name?: string;
  description?: string;
  method?: string;
  url?: string;
  headers?: KeyValuePair[];
  query_params?: KeyValuePair[];
  body_config?: any;
}

// ============================================================================
// Prompt Types
// ============================================================================

export interface BackendPrompt {
  id: string; // UUID
  numeric_id: number;
  name: string;
  description?: string;
  content?: string;
  prompt_template?: string;
  variables?: string[];
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendPromptCreate {
  name: string;
  description?: string;
  content?: string;
  prompt_template?: string;
  variables?: string[];
  project_id?: string;
}

export interface BackendPromptUpdate {
  name?: string;
  description?: string;
  content?: string;
  prompt_template?: string;
  variables?: string[];
}

// ============================================================================
// MCP Config Types
// ============================================================================

export interface BackendMCPConfig {
  id: string; // UUID
  numeric_id: number;
  name: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  instruction?: string;
  selected_tool_ids: string[]; // UUIDs
  deployment_status: 'not-deployed' | 'deploying' | 'deployed' | 'failed';
  deployment_url?: string;
  deployed_at?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendMCPConfigCreate {
  name: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  instruction?: string;
  selected_tool_ids?: string[];
  project_id?: string;
}

export interface BackendMCPConfigUpdate {
  name?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  instruction?: string;
  selected_tool_ids?: string[];
  deployment_status?: 'not-deployed' | 'deploying' | 'deployed' | 'failed';
  deployment_url?: string;
}

// ============================================================================
// Response Config Types
// ============================================================================

export interface BackendResponseConfig {
  id: string; // UUID
  numeric_id: number;
  name: string;
  type: 'raw-output' | 'llm-reprocess';
  reprocess_instructions?: string;
  error_handling: 'pass-through' | 'retry' | 'fallback';
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendResponseConfigCreate {
  name: string;
  type?: 'raw-output' | 'llm-reprocess';
  reprocess_instructions?: string;
  error_handling?: 'pass-through' | 'retry' | 'fallback';
  project_id?: string;
}

export interface BackendResponseConfigUpdate {
  name?: string;
  type?: 'raw-output' | 'llm-reprocess';
  reprocess_instructions?: string;
  error_handling?: 'pass-through' | 'retry' | 'fallback';
}

// ============================================================================
// Flow Types
// ============================================================================

export interface BackendFlow {
  id: string; // UUID
  numeric_id: number;
  name: string;
  description?: string;
  steps?: any; // Graph format (nodes/edges)
  steps_array?: any[]; // Linear array format for v6 builder
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendFlowCreate {
  name: string;
  description?: string;
  steps?: any;
  steps_array?: any[];
  project_id?: string;
}

export interface BackendFlowUpdate {
  name?: string;
  description?: string;
  steps?: any;
  steps_array?: any[];
}

// ============================================================================
// Project Types
// ============================================================================

export interface BackendProject {
  id: string; // UUID
  name: string;
  description?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendProjectCreate {
  name: string;
  description?: string;
  user_id?: string;
}

export interface BackendProjectUpdate {
  name?: string;
  description?: string;
  user_id?: string;
}

