/**
 * Data transformers for converting between frontend and backend formats
 */

import {
  Tool,
  SavedPrompt,
  SavedMCPConfig,
  SavedResponseConfig,
  WorkflowStep,
} from '@/types/builder';
import {
  BackendTool,
  BackendToolCreate,
  BackendPrompt,
  BackendPromptCreate,
  BackendMCPConfig,
  BackendMCPConfigCreate,
  BackendResponseConfig,
  BackendResponseConfigCreate,
  BackendFlow,
  BackendFlowCreate,
} from './types';

// ============================================================================
// Tool Transformers
// ============================================================================

export function transformToolsFromBackend(backendTools: BackendTool[]): Tool[] {
  return backendTools.map((tool) => ({
    id: tool.numeric_id,
    name: tool.name,
    description: tool.description || '',
    method: (tool.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: tool.url || '',
    headers: tool.headers || [],
    queryParams: tool.query_params || [],
    body: typeof tool.body_config === 'string' 
      ? tool.body_config 
      : tool.body_config 
        ? JSON.stringify(tool.body_config, null, 2) 
        : '',
  }));
}

export function transformToolToBackend(tool: Omit<Tool, 'id'> | Tool): BackendToolCreate {
  return {
    name: tool.name,
    description: tool.description,
    method: tool.method,
    url: tool.url,
    headers: tool.headers,
    query_params: tool.queryParams,
    body_config: tool.body || undefined,
  };
}

// ============================================================================
// Prompt Transformers
// ============================================================================

export function transformPromptsFromBackend(backendPrompts: BackendPrompt[]): SavedPrompt[] {
  return backendPrompts.map((prompt) => ({
    id: prompt.numeric_id,
    name: prompt.name,
    content: prompt.content || prompt.prompt_template || '',
  }));
}

export function transformPromptToBackend(
  prompt: Omit<SavedPrompt, 'id'> | SavedPrompt
): BackendPromptCreate {
  return {
    name: prompt.name,
    content: prompt.content,
  };
}

// ============================================================================
// MCP Config Transformers
// ============================================================================

export function transformMCPConfigsFromBackend(
  backendConfigs: BackendMCPConfig[]
): SavedMCPConfig[] {
  return backendConfigs.map((config) => ({
    id: config.numeric_id,
    name: config.name,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.max_tokens,
    systemPrompt: config.system_prompt || '',
    instruction: config.instruction || '',
    selectedTools: [], // Will need to map UUIDs to numeric IDs
    deploymentStatus: config.deployment_status,
    deploymentUrl: config.deployment_url,
    deployedAt: config.deployed_at,
  }));
}

export function transformMCPConfigToBackend(
  config: Omit<SavedMCPConfig, 'id'> | SavedMCPConfig
): BackendMCPConfigCreate {
  return {
    name: config.name,
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    system_prompt: config.systemPrompt,
    instruction: config.instruction,
    selected_tool_ids: [], // Will need to map numeric IDs to UUIDs
  };
}

// ============================================================================
// Response Config Transformers
// ============================================================================

export function transformResponseConfigsFromBackend(
  backendConfigs: BackendResponseConfig[]
): SavedResponseConfig[] {
  return backendConfigs.map((config) => ({
    id: config.numeric_id,
    name: config.name,
    type: config.type,
    reprocessInstructions: config.reprocess_instructions || '',
    errorHandling: config.error_handling,
  }));
}

export function transformResponseConfigToBackend(
  config: Omit<SavedResponseConfig, 'id'> | SavedResponseConfig
): BackendResponseConfigCreate {
  return {
    name: config.name,
    type: config.type,
    reprocess_instructions: config.reprocessInstructions,
    error_handling: config.errorHandling,
  };
}

// ============================================================================
// Flow/Workflow Transformers
// ============================================================================

export function transformFlowFromBackend(backendFlow: BackendFlow): WorkflowStep[] {
  // Use steps_array if available (v6 builder format)
  if (backendFlow.steps_array && Array.isArray(backendFlow.steps_array)) {
    return backendFlow.steps_array.map((step: any) => ({
      id: step.id,
      type: step.type,
      ...(step.type === 'mcp' && {
        model: step.model,
        temperature: step.temperature,
        maxTokens: step.maxTokens,
        systemPrompt: step.systemPrompt,
        instruction: step.instruction,
        selectedTools: step.selectedTools || [],
        mcpConfigId: step.mcpConfigId,
      }),
      ...(step.type === 'response' && {
        responseType: step.responseType,
        reprocessInstructions: step.reprocessInstructions,
        errorHandling: step.errorHandling,
        responseConfigId: step.responseConfigId,
      }),
    }));
  }

  // Otherwise return empty array
  return [];
}

export function transformFlowToBackend(
  name: string,
  workflowSteps: WorkflowStep[]
): BackendFlowCreate {
  return {
    name,
    description: `Workflow with ${workflowSteps.length} steps`,
    steps_array: workflowSteps.map((step) => ({
      id: step.id,
      type: step.type,
      ...(step.type === 'mcp' && {
        model: step.model,
        temperature: step.temperature,
        maxTokens: step.maxTokens,
        systemPrompt: step.systemPrompt,
        instruction: step.instruction,
        selectedTools: step.selectedTools || [],
        mcpConfigId: step.mcpConfigId,
      }),
      ...(step.type === 'response' && {
        responseType: step.responseType,
        reprocessInstructions: step.reprocessInstructions,
        errorHandling: step.errorHandling,
        responseConfigId: step.responseConfigId,
      }),
    })),
  };
}

