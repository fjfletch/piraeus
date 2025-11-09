// Builder V6 Zustand Store
import { create } from 'zustand';
import {
  Tool,
  SavedPrompt,
  SavedMCPConfig,
  SavedResponseConfig,
  WorkflowStep,
  TabType,
  WorkflowStepType,
  SelectedItem,
  DeploymentStatus
} from '@/types/builder';
import backendAPI from '@/lib/api/backend';
import {
  transformToolsFromBackend,
  transformToolToBackend,
  transformPromptsFromBackend,
  transformPromptToBackend,
  transformMCPConfigsFromBackend,
  transformMCPConfigToBackend,
  transformResponseConfigsFromBackend,
  transformResponseConfigToBackend,
  transformFlowFromBackend,
  transformFlowToBackend,
} from '@/lib/api/transformers';
import { BackendTool, BackendPrompt, BackendMCPConfig, BackendResponseConfig, BackendFlow } from '@/lib/api/types';

// ID Counters (outside store to persist across renders)
let toolIdCounter = 4; // Starts after default tools
let promptIdCounter = 1;
let mcpConfigIdCounter = 1;
let responseConfigIdCounter = 1;

interface MCPBuilderStore {
  // ═══ STATE ═══
  tools: Tool[];
  savedPrompts: SavedPrompt[];
  savedMCPConfigs: SavedMCPConfig[];
  savedResponseConfigs: SavedResponseConfig[];
  workflowSteps: WorkflowStep[];
  currentTab: TabType;
  selectedItem: SelectedItem | null;
  
  // Backend integration state
  projectId: string;
  isLoading: boolean;
  isSyncing: boolean;
  lastError: string | null;
  currentFlowId: string | null; // UUID of current workflow in backend
  
  // Backend ID mappings (numeric_id -> UUID)
  toolIdMap: Map<number, string>;
  promptIdMap: Map<number, string>;
  mcpConfigIdMap: Map<number, string>;
  responseConfigIdMap: Map<number, string>;

  // ═══ TAB ACTIONS ═══
  setCurrentTab: (tab: TabType) => void;
  setSelectedItem: (item: SelectedItem | null) => void;

  // ═══ TOOL ACTIONS ═══
  addTool: (tool: Omit<Tool, 'id'>) => number;
  updateTool: (id: number, updates: Partial<Tool>) => void;
  deleteTool: (id: number) => void;
  importTools: (tools: Omit<Tool, 'id'>[]) => void;
  addToolHeader: (id: number) => void;
  updateToolHeader: (id: number, index: number, field: 'key' | 'value', value: string) => void;
  removeToolHeader: (id: number, index: number) => void;
  addToolQueryParam: (id: number) => void;
  updateToolQueryParam: (id: number, index: number, field: 'key' | 'value', value: string) => void;
  removeToolQueryParam: (id: number, index: number) => void;

  // ═══ PROMPT ACTIONS ═══
  addPrompt: (prompt: Omit<SavedPrompt, 'id'>) => number;
  updatePrompt: (id: number, updates: Partial<SavedPrompt>) => void;
  deletePrompt: (id: number) => void;

  // ═══ MCP CONFIG ACTIONS ═══
  addMCPConfig: (config: Omit<SavedMCPConfig, 'id'>) => number;
  updateMCPConfig: (id: number, updates: Partial<SavedMCPConfig>) => void;
  deleteMCPConfig: (id: number) => void;
  importMCPConfigs: (configs: Omit<SavedMCPConfig, 'id'>[]) => void;
  updateMCPDeploymentStatus: (id: number, status: DeploymentStatus, url?: string) => void;

  // ═══ RESPONSE CONFIG ACTIONS ═══
  addResponseConfig: (config: Omit<SavedResponseConfig, 'id'>) => number;
  updateResponseConfig: (id: number, updates: Partial<SavedResponseConfig>) => void;
  deleteResponseConfig: (id: number) => void;

  // ═══ WORKFLOW STEP ACTIONS ═══
  addWorkflowStep: (type: WorkflowStepType, afterStepId?: string) => string | undefined;
  updateWorkflowStep: (stepId: string, updates: Partial<WorkflowStep>) => void;
  deleteWorkflowStep: (stepId: string) => void;
  moveWorkflowStep: (stepId: string, newIndex: number) => void;
  canAddStepType: (type: WorkflowStepType, afterStepId?: string) => boolean;

  // ═══ UTILITY GETTERS ═══
  getToolById: (id: number) => Tool | undefined;
  getPromptById: (id: number) => SavedPrompt | undefined;
  getMCPConfigById: (id: number) => SavedMCPConfig | undefined;
  getResponseConfigById: (id: number) => SavedResponseConfig | undefined;
  getWorkflowStepById: (stepId: string) => WorkflowStep | undefined;
}

// Default tools
const defaultTools: Tool[] = [
  {
    id: 1,
    name: 'Search GitHub Repos',
    description: 'Search for GitHub repositories by keyword',
    method: 'GET',
    url: 'https://api.github.com/search/repositories',
    headers: [{ key: 'Accept', value: 'application/vnd.github.v3+json' }],
    queryParams: [
      { key: 'q', value: '{query}' },
      { key: 'sort', value: 'stars' },
      { key: 'per_page', value: '10' }
    ],
    body: ''
  },
  {
    id: 2,
    name: 'Get Weather Data',
    description: 'Fetch weather information for a specific location',
    method: 'GET',
    url: 'https://api.openweathermap.org/data/2.5/weather',
    headers: [],
    queryParams: [
      { key: 'q', value: '{city}' },
      { key: 'appid', value: '{api_key}' }
    ],
    body: ''
  },
  {
    id: 3,
    name: 'Create Stripe Charge',
    description: 'Create a payment charge via Stripe API',
    method: 'POST',
    url: 'https://api.stripe.com/v1/charges',
    headers: [
      { key: 'Authorization', value: 'Bearer {api_key}' },
      { key: 'Content-Type', value: 'application/x-www-form-urlencoded' }
    ],
    queryParams: [],
    body: 'amount={amount}&currency=usd&source={token}'
  }
];

export const useMCPBuilderStore = create<MCPBuilderStore>((set, get) => ({
  // ═══ INITIAL STATE ═══
  tools: defaultTools,
  savedPrompts: [],
  savedMCPConfigs: [],
  savedResponseConfigs: [],
  workflowSteps: [],
  currentTab: 'tools',
  selectedItem: null,

  // ═══ TAB ACTIONS ═══
  setCurrentTab: (tab: TabType) => set({ currentTab: tab }),
  setSelectedItem: (item: SelectedItem | null) => set({ selectedItem: item }),

  // ═══ TOOL ACTIONS ═══
  addTool: (tool: Omit<Tool, 'id'>) => {
    const newId = toolIdCounter++;
    const newTool: Tool = { ...tool, id: newId };
    set((state) => ({
      tools: [...state.tools, newTool],
      selectedItem: { type: 'tool', id: newTool.id }
    }));
    return newId;
  },

  updateTool: (id: number, updates: Partial<Tool>) => {
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === id ? { ...tool, ...updates } : tool
      )
    }));
  },

  deleteTool: (id: number) => {
    set((state) => ({
      tools: state.tools.filter((tool) => tool.id !== id),
      // Remove from workflow steps
      workflowSteps: state.workflowSteps.map((step) => {
        if (step.type === 'mcp' && step.selectedTools) {
          return {
            ...step,
            selectedTools: step.selectedTools.filter((tid) => tid !== id)
          };
        }
        return step;
      }),
      // Remove from saved configs
      savedMCPConfigs: state.savedMCPConfigs.map((config) => ({
        ...config,
        selectedTools: config.selectedTools.filter((tid) => tid !== id)
      })),
      // Clear selection if deleted
      selectedItem: state.selectedItem?.type === 'tool' && state.selectedItem.id === id
        ? null
        : state.selectedItem
    }));
  },

  importTools: (tools: Omit<Tool, 'id'>[]) => {
    const newTools = tools.map((tool) => ({
      ...tool,
      id: toolIdCounter++
    }));
    set((state) => ({
      tools: [...state.tools, ...newTools]
    }));
  },

  addToolHeader: (id: number) => {
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === id
          ? { ...tool, headers: [...tool.headers, { key: '', value: '' }] }
          : tool
      )
    }));
  },

  updateToolHeader: (id: number, index: number, field: 'key' | 'value', value: string) => {
    set((state) => ({
      tools: state.tools.map((tool) => {
        if (tool.id === id) {
          const newHeaders = [...tool.headers];
          newHeaders[index] = { ...newHeaders[index], [field]: value };
          return { ...tool, headers: newHeaders };
        }
        return tool;
      })
    }));
  },

  removeToolHeader: (id: number, index: number) => {
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === id
          ? { ...tool, headers: tool.headers.filter((_, i) => i !== index) }
          : tool
      )
    }));
  },

  addToolQueryParam: (id: number) => {
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === id
          ? { ...tool, queryParams: [...tool.queryParams, { key: '', value: '' }] }
          : tool
      )
    }));
  },

  updateToolQueryParam: (id: number, index: number, field: 'key' | 'value', value: string) => {
    set((state) => ({
      tools: state.tools.map((tool) => {
        if (tool.id === id) {
          const newParams = [...tool.queryParams];
          newParams[index] = { ...newParams[index], [field]: value };
          return { ...tool, queryParams: newParams };
        }
        return tool;
      })
    }));
  },

  removeToolQueryParam: (id: number, index: number) => {
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === id
          ? { ...tool, queryParams: tool.queryParams.filter((_, i) => i !== index) }
          : tool
      )
    }));
  },

  // ═══ PROMPT ACTIONS ═══
  addPrompt: (prompt: Omit<SavedPrompt, 'id'>) => {
    const newId = promptIdCounter++;
    const newPrompt: SavedPrompt = { ...prompt, id: newId };
    set((state) => ({
      savedPrompts: [...state.savedPrompts, newPrompt],
      selectedItem: { type: 'prompt', id: newPrompt.id }
    }));
    return newId;
  },

  updatePrompt: (id: number, updates: Partial<SavedPrompt>) => {
    set((state) => ({
      savedPrompts: state.savedPrompts.map((prompt) =>
        prompt.id === id ? { ...prompt, ...updates } : prompt
      )
    }));
  },

  deletePrompt: (id: number) => {
    set((state) => ({
      savedPrompts: state.savedPrompts.filter((prompt) => prompt.id !== id),
      selectedItem: state.selectedItem?.type === 'prompt' && state.selectedItem.id === id
        ? null
        : state.selectedItem
    }));
  },

  // ═══ MCP CONFIG ACTIONS ═══
  addMCPConfig: (config: Omit<SavedMCPConfig, 'id'>) => {
    const newId = mcpConfigIdCounter++;
    const newConfig: SavedMCPConfig = { 
      ...config, 
      id: newId,
      deploymentStatus: 'not-deployed'
    };
    set((state) => ({
      savedMCPConfigs: [...state.savedMCPConfigs, newConfig]
    }));
    return newId;
  },

  updateMCPConfig: (id: number, updates: Partial<SavedMCPConfig>) => {
    set((state) => ({
      savedMCPConfigs: state.savedMCPConfigs.map((config) =>
        config.id === id ? { ...config, ...updates } : config
      )
    }));
  },

  deleteMCPConfig: (id: number) => {
    set((state) => ({
      savedMCPConfigs: state.savedMCPConfigs.filter((config) => config.id !== id),
      // Clear workflow step references
      workflowSteps: state.workflowSteps.map((step) => {
        if (step.type === 'mcp' && step.mcpConfigId === id) {
          return { ...step, mcpConfigId: undefined };
        }
        return step;
      })
    }));
  },

  importMCPConfigs: (configs: Omit<SavedMCPConfig, 'id'>[]) => {
    const newConfigs = configs.map((config) => ({
      ...config,
      id: mcpConfigIdCounter++,
      deploymentStatus: 'not-deployed' as DeploymentStatus
    }));
    set((state) => ({
      savedMCPConfigs: [...state.savedMCPConfigs, ...newConfigs]
    }));
  },

  updateMCPDeploymentStatus: (id: number, status: DeploymentStatus, url?: string) => {
    set((state) => ({
      savedMCPConfigs: state.savedMCPConfigs.map((config) =>
        config.id === id
          ? {
              ...config,
              deploymentStatus: status,
              deployedAt: status === 'deployed' ? new Date().toISOString() : config.deployedAt,
              deploymentUrl: url || config.deploymentUrl
            }
          : config
      )
    }));
  },

  // ═══ RESPONSE CONFIG ACTIONS ═══
  addResponseConfig: (config: Omit<SavedResponseConfig, 'id'>) => {
    const newId = responseConfigIdCounter++;
    const newConfig: SavedResponseConfig = { ...config, id: newId };
    set((state) => ({
      savedResponseConfigs: [...state.savedResponseConfigs, newConfig]
    }));
    return newId;
  },

  updateResponseConfig: (id: number, updates: Partial<SavedResponseConfig>) => {
    set((state) => ({
      savedResponseConfigs: state.savedResponseConfigs.map((config) =>
        config.id === id ? { ...config, ...updates } : config
      )
    }));
  },

  deleteResponseConfig: (id: number) => {
    set((state) => ({
      savedResponseConfigs: state.savedResponseConfigs.filter((config) => config.id !== id),
      // Clear workflow step references
      workflowSteps: state.workflowSteps.map((step) => {
        if (step.type === 'response' && step.responseConfigId === id) {
          return { ...step, responseConfigId: undefined };
        }
        return step;
      })
    }));
  },

  // ═══ WORKFLOW STEP ACTIONS ═══
  addWorkflowStep: (type: WorkflowStepType, afterStepId?: string) => {
    const { workflowSteps, canAddStepType } = get();

    // Validate workflow rules
    if (!canAddStepType(type, afterStepId)) {
      return undefined;
    }

    // Create step with defaults
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      ...(type === 'mcp' && {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500,
        systemPrompt: '',
        instruction: '',
        selectedTools: []
      }),
      ...(type === 'response' && {
        responseType: 'raw-output',
        errorHandling: 'pass-through'
      })
    };

    // Insert at correct position
    if (!afterStepId) {
      set((state) => ({
        workflowSteps: [newStep, ...state.workflowSteps]
      }));
    } else {
      const index = workflowSteps.findIndex((s) => s.id === afterStepId);
      if (index >= 0) {
        set((state) => {
          const newSteps = [...state.workflowSteps];
          newSteps.splice(index + 1, 0, newStep);
          return { workflowSteps: newSteps };
        });
      }
    }

    return newStep.id;
  },

  updateWorkflowStep: (stepId: string, updates: Partial<WorkflowStep>) => {
    set((state) => ({
      workflowSteps: state.workflowSteps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  },

  deleteWorkflowStep: (stepId: string) => {
    set((state) => ({
      workflowSteps: state.workflowSteps.filter((step) => step.id !== stepId),
      selectedItem: state.selectedItem && 
        ((state.selectedItem.type === 'mcp' || state.selectedItem.type === 'response') && 
         state.selectedItem.stepId === stepId)
        ? null
        : state.selectedItem
    }));
  },

  moveWorkflowStep: (stepId: string, newIndex: number) => {
    set((state) => {
      const steps = [...state.workflowSteps];
      const oldIndex = steps.findIndex((s) => s.id === stepId);
      if (oldIndex >= 0) {
        const [step] = steps.splice(oldIndex, 1);
        steps.splice(newIndex, 0, step);
      }
      return { workflowSteps: steps };
    });
  },

  canAddStepType: (type: WorkflowStepType, afterStepId?: string) => {
    const { workflowSteps } = get();

    if (!afterStepId) {
      // First step must be MCP
      return type === 'mcp';
    }

    const afterIndex = workflowSteps.findIndex((s) => s.id === afterStepId);
    if (afterIndex < 0) return false;

    const afterStep = workflowSteps[afterIndex];

    // Rules:
    // MCP → Response only
    // Response → MCP or end
    if (afterStep.type === 'mcp') {
      return type === 'response';
    } else if (afterStep.type === 'response') {
      return type === 'mcp';
    }

    return false;
  },

  // ═══ UTILITY GETTERS ═══
  getToolById: (id: number) => {
    return get().tools.find((tool) => tool.id === id);
  },

  getPromptById: (id: number) => {
    return get().savedPrompts.find((prompt) => prompt.id === id);
  },

  getMCPConfigById: (id: number) => {
    return get().savedMCPConfigs.find((config) => config.id === id);
  },

  getResponseConfigById: (id: number) => {
    return get().savedResponseConfigs.find((config) => config.id === id);
  },

  getWorkflowStepById: (stepId: string) => {
    return get().workflowSteps.find((step) => step.id === stepId);
  }
}));
