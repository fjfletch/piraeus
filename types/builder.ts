// Builder V6 Type Definitions

export type TabType = 'tools' | 'prompts' | 'mcps' | 'responses' | 'workflow';

export type DeploymentStatus = 'not-deployed' | 'deploying' | 'deployed' | 'failed';

export type WorkflowStepType = 'mcp' | 'response';

// Tool Definition
export interface Tool {
  id: number;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers: Array<{ key: string; value: string }>;
  queryParams: Array<{ key: string; value: string }>;
  body: string;
}

// Saved Prompt
export interface SavedPrompt {
  id: number;
  name: string;
  content: string;
}

// MCP Configuration
export interface SavedMCPConfig {
  id: number;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  instruction: string;
  selectedTools: number[];
  deploymentStatus?: DeploymentStatus;
  deployedAt?: string; // ISO timestamp
  deploymentUrl?: string;
}

// Response Configuration
export interface SavedResponseConfig {
  id: number;
  name: string;
  type: 'raw-output' | 'llm-reprocess';
  reprocessInstructions?: string;
  errorHandling?: 'pass-through' | 'retry' | 'fallback';
}

// Workflow Step
export interface WorkflowStep {
  id: string; // UUID-like: `step-${Date.now()}`
  type: WorkflowStepType;

  // MCP fields (when type === 'mcp')
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  instruction?: string;
  selectedTools?: number[];
  mcpConfigId?: number; // Reference to saved config

  // Response fields (when type === 'response')
  responseType?: 'raw-output' | 'llm-reprocess';
  reprocessInstructions?: string;
  errorHandling?: 'pass-through' | 'retry' | 'fallback';
  responseConfigId?: number; // Reference to saved config
}

// Selected Item (for Inspector)
export type SelectedItem =
  | { type: 'tool'; id: number }
  | { type: 'mcp'; stepId: string }
  | { type: 'response'; stepId: string }
  | { type: 'prompt'; id: number }
  | { type: 'testing' };

// Marketplace MCP
export interface MarketplaceMCP {
  id: string;
  name: string;
  description: string;
  author: string;
  rating: number;
  reviews: number;
  uses: number;
  category?: string;
}
