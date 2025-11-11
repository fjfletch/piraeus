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
  
  // ═══ BACKEND INTEGRATION ═══
  setProjectId: (projectId: string) => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Load all data from backend
  loadAllFromBackend: () => Promise<void>;
  
  // Batch setters (for loading from backend)
  setTools: (tools: Tool[], idMap: Map<number, string>) => void;
  setPrompts: (prompts: SavedPrompt[], idMap: Map<number, string>) => void;
  setMCPConfigs: (configs: SavedMCPConfig[], idMap: Map<number, string>) => void;
  setResponseConfigs: (configs: SavedResponseConfig[], idMap: Map<number, string>) => void;
  setWorkflowSteps: (steps: WorkflowStep[], flowId: string | null) => void;
  
  // Backend sync methods (async versions)
  syncAddTool: (tool: Omit<Tool, 'id'>) => Promise<number | null>;
  syncUpdateTool: (id: number, updates: Partial<Tool>) => Promise<void>;
  syncDeleteTool: (id: number) => Promise<void>;
  
  syncAddPrompt: (prompt: Omit<SavedPrompt, 'id'>) => Promise<number | null>;
  syncUpdatePrompt: (id: number, updates: Partial<SavedPrompt>) => Promise<void>;
  syncDeletePrompt: (id: number) => Promise<void>;
  
  syncAddMCPConfig: (config: Omit<SavedMCPConfig, 'id'>) => Promise<number | null>;
  syncUpdateMCPConfig: (id: number, updates: Partial<SavedMCPConfig>) => Promise<void>;
  syncDeleteMCPConfig: (id: number) => Promise<void>;
  
  syncAddResponseConfig: (config: Omit<SavedResponseConfig, 'id'>) => Promise<number | null>;
  syncUpdateResponseConfig: (id: number, updates: Partial<SavedResponseConfig>) => Promise<void>;
  syncDeleteResponseConfig: (id: number) => Promise<void>;
  
  syncSaveWorkflow: (name: string) => Promise<void>;
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
  
  // Backend integration state
  projectId: process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || '00000000-0000-0000-0000-000000000001',
  isLoading: false,
  isSyncing: false,
  lastError: null,
  currentFlowId: null,
  toolIdMap: new Map(),
  promptIdMap: new Map(),
  mcpConfigIdMap: new Map(),
  responseConfigIdMap: new Map(),

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
  },
  
  // ═══ BACKEND INTEGRATION METHODS ═══
  
  setProjectId: (projectId: string) => set({ projectId }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setSyncing: (syncing: boolean) => set({ isSyncing: syncing }),
  setError: (error: string | null) => set({ lastError: error }),
  
  setTools: (tools: Tool[], idMap: Map<number, string>) => {
    set({ tools, toolIdMap: idMap });
    // Update ID counter
    const maxId = Math.max(0, ...tools.map(t => t.id));
    toolIdCounter = maxId + 1;
  },
  
  setPrompts: (prompts: SavedPrompt[], idMap: Map<number, string>) => {
    set({ savedPrompts: prompts, promptIdMap: idMap });
    const maxId = Math.max(0, ...prompts.map(p => p.id));
    promptIdCounter = maxId + 1;
  },
  
  setMCPConfigs: (configs: SavedMCPConfig[], idMap: Map<number, string>) => {
    set({ savedMCPConfigs: configs, mcpConfigIdMap: idMap });
    const maxId = Math.max(0, ...configs.map(c => c.id));
    mcpConfigIdCounter = maxId + 1;
  },
  
  setResponseConfigs: (configs: SavedResponseConfig[], idMap: Map<number, string>) => {
    set({ savedResponseConfigs: configs, responseConfigIdMap: idMap });
    const maxId = Math.max(0, ...configs.map(c => c.id));
    responseConfigIdCounter = maxId + 1;
  },
  
  setWorkflowSteps: (steps: WorkflowStep[], flowId: string | null) => {
    set({ workflowSteps: steps, currentFlowId: flowId });
  },
  
  // Load all data from backend
  loadAllFromBackend: async () => {
    const { projectId, setLoading, setError, setTools, setPrompts, setMCPConfigs, setResponseConfigs, setWorkflowSteps } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      // Load all entities in parallel
      const [toolsData, promptsData, mcpConfigsData, responseConfigsData, flowsData] = await Promise.all([
        backendAPI.tools.getAll(projectId),
        backendAPI.prompts.getAll(projectId),
        backendAPI.mcpConfigs.getAll(projectId),
        backendAPI.responseConfigs.getAll(projectId),
        backendAPI.flows.getAll(projectId)
      ]);
      
      // Transform and set tools
      const toolIdMap = new Map<number, string>();
      const tools = transformToolsFromBackend(toolsData);
      toolsData.forEach(t => toolIdMap.set(t.numeric_id, t.id));
      setTools(tools, toolIdMap);
      
      // Transform and set prompts
      const promptIdMap = new Map<number, string>();
      const prompts = transformPromptsFromBackend(promptsData);
      promptsData.forEach(p => promptIdMap.set(p.numeric_id, p.id));
      setPrompts(prompts, promptIdMap);
      
      // Transform and set MCP configs
      const mcpConfigIdMap = new Map<number, string>();
      const mcpConfigs = transformMCPConfigsFromBackend(mcpConfigsData);
      mcpConfigsData.forEach(c => mcpConfigIdMap.set(c.numeric_id, c.id));
      setMCPConfigs(mcpConfigs, mcpConfigIdMap);
      
      // Transform and set response configs
      const responseConfigIdMap = new Map<number, string>();
      const responseConfigs = transformResponseConfigsFromBackend(responseConfigsData);
      responseConfigsData.forEach(c => responseConfigIdMap.set(c.numeric_id, c.id));
      setResponseConfigs(responseConfigs, responseConfigIdMap);
      
      // Load workflow (get first flow if exists)
      if (flowsData.length > 0) {
        const firstFlow = flowsData[0];
        const workflowSteps = transformFlowFromBackend(firstFlow);
        setWorkflowSteps(workflowSteps, firstFlow.id);
      } else {
        setWorkflowSteps([], null);
      }
      
      console.log('✅ Loaded all data from backend');
    } catch (error: any) {
      console.warn('⚠️ Backend unavailable:', error);
      setError(error.message || 'Backend unavailable');
      // Don't throw - let the app continue with local/default data
    } finally {
      setLoading(false);
    }
  },
  
  // ═══ SYNC TOOLS ═══
  
  syncAddTool: async (tool: Omit<Tool, 'id'>) => {
    const { projectId, setSyncing, setError, toolIdMap, addTool } = get();
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformToolToBackend(tool);
      const created = await backendAPI.tools.create(projectId, backendData);
      
      // Update local state
      toolIdMap.set(created.numeric_id, created.id);
      const localId = addTool(tool);
      
      console.log(`✅ Tool synced to backend: ${created.name} (ID: ${created.numeric_id})`);
      console.log(`🔄 Tool is immediately available in workflows (no restart needed)`);
      
      return created.numeric_id;
    } catch (error: any) {
      console.error('❌ Error syncing tool:', error);
      setError(error.message || 'Failed to create tool');
      return null;
    } finally {
      setSyncing(false);
    }
  },
  
  syncUpdateTool: async (id: number, updates: Partial<Tool>) => {
    const { toolIdMap, setSyncing, setError, updateTool } = get();
    const uuid = toolIdMap.get(id);
    
    if (!uuid) {
      console.warn(`No UUID found for tool ID ${id}, updating locally only`);
      updateTool(id, updates);
      return;
    }
    
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformToolToBackend({ ...get().getToolById(id)!, ...updates });
      await backendAPI.tools.update(uuid, backendData);
      updateTool(id, updates);
      console.log(`✅ Tool updated in backend: ${id}`);
    } catch (error: any) {
      console.error('❌ Error updating tool:', error);
      setError(error.message || 'Failed to update tool');
    } finally {
      setSyncing(false);
    }
  },
  
  syncDeleteTool: async (id: number) => {
    const { toolIdMap, setSyncing, setError, deleteTool } = get();
    const uuid = toolIdMap.get(id);
    
    if (!uuid) {
      console.warn(`No UUID found for tool ID ${id}, deleting locally only`);
      deleteTool(id);
      return;
    }
    
    setSyncing(true);
    setError(null);
    
    try {
      await backendAPI.tools.delete(uuid);
      toolIdMap.delete(id);
      deleteTool(id);
      console.log(`✅ Tool deleted from backend: ${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting tool:', error);
      setError(error.message || 'Failed to delete tool');
    } finally {
      setSyncing(false);
    }
  },
  
  // ═══ SYNC PROMPTS ═══
  
  syncAddPrompt: async (prompt: Omit<SavedPrompt, 'id'>) => {
    const { projectId, setSyncing, setError, promptIdMap, addPrompt } = get();
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformPromptToBackend(prompt);
      const created = await backendAPI.prompts.create(projectId, backendData);
      
      promptIdMap.set(created.numeric_id, created.id);
      const localId = addPrompt(prompt);
      
      console.log(`✅ Prompt synced to backend: ${created.name} (ID: ${created.numeric_id})`);
      return created.numeric_id;
    } catch (error: any) {
      console.error('❌ Error syncing prompt:', error);
      setError(error.message || 'Failed to create prompt');
      return null;
    } finally {
      setSyncing(false);
    }
  },
  
  syncUpdatePrompt: async (id: number, updates: Partial<SavedPrompt>) => {
    const { promptIdMap, setSyncing, setError, updatePrompt } = get();
    const uuid = promptIdMap.get(id);
    
    if (!uuid) {
      console.warn(`No UUID found for prompt ID ${id}, updating locally only`);
      updatePrompt(id, updates);
      return;
    }
    
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformPromptToBackend({ ...get().getPromptById(id)!, ...updates });
      await backendAPI.prompts.update(uuid, backendData);
      updatePrompt(id, updates);
      console.log(`✅ Prompt updated in backend: ${id}`);
    } catch (error: any) {
      console.error('❌ Error updating prompt:', error);
      setError(error.message || 'Failed to update prompt');
    } finally {
      setSyncing(false);
    }
  },
  
  syncDeletePrompt: async (id: number) => {
    const { promptIdMap, setSyncing, setError, deletePrompt } = get();
    const uuid = promptIdMap.get(id);
    
    if (!uuid) {
      console.warn(`No UUID found for prompt ID ${id}, deleting locally only`);
      deletePrompt(id);
      return;
    }
    
    setSyncing(true);
    setError(null);
    
    try {
      await backendAPI.prompts.delete(uuid);
      promptIdMap.delete(id);
      deletePrompt(id);
      console.log(`✅ Prompt deleted from backend: ${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting prompt:', error);
      setError(error.message || 'Failed to delete prompt');
    } finally {
      setSyncing(false);
    }
  },
  
  // ═══ SYNC MCP CONFIGS ═══
  
  syncAddMCPConfig: async (config: Omit<SavedMCPConfig, 'id'>) => {
    const { projectId, setSyncing, setError, mcpConfigIdMap, addMCPConfig } = get();
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformMCPConfigToBackend(config);
      const created = await backendAPI.mcpConfigs.create(projectId, backendData);
      
      mcpConfigIdMap.set(created.numeric_id, created.id);
      const localId = addMCPConfig(config);
      
      console.log(`✅ MCP Config synced to backend: ${created.name} (ID: ${created.numeric_id})`);
      return created.numeric_id;
    } catch (error: any) {
      console.error('❌ Error syncing MCP config:', error);
      setError(error.message || 'Failed to create MCP config');
      return null;
    } finally {
      setSyncing(false);
    }
  },
  
  syncUpdateMCPConfig: async (id: number, updates: Partial<SavedMCPConfig>) => {
    const { mcpConfigIdMap, setSyncing, setError, updateMCPConfig } = get();
    const uuid = mcpConfigIdMap.get(id);
    
    if (!uuid) {
      console.warn(`No UUID found for MCP config ID ${id}, updating locally only`);
      updateMCPConfig(id, updates);
      return;
    }
    
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformMCPConfigToBackend({ ...get().getMCPConfigById(id)!, ...updates });
      await backendAPI.mcpConfigs.update(uuid, backendData);
      updateMCPConfig(id, updates);
      console.log(`✅ MCP Config updated in backend: ${id}`);
    } catch (error: any) {
      console.error('❌ Error updating MCP config:', error);
      setError(error.message || 'Failed to update MCP config');
    } finally {
      setSyncing(false);
    }
  },
  
  syncDeleteMCPConfig: async (id: number) => {
    const { mcpConfigIdMap, setSyncing, setError, deleteMCPConfig } = get();
    const uuid = mcpConfigIdMap.get(id);
    
    if (!uuid) {
      console.warn(`No UUID found for MCP config ID ${id}, deleting locally only`);
      deleteMCPConfig(id);
      return;
    }
    
    setSyncing(true);
    setError(null);
    
    try {
      await backendAPI.mcpConfigs.delete(uuid);
      mcpConfigIdMap.delete(id);
      deleteMCPConfig(id);
      console.log(`✅ MCP Config deleted from backend: ${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting MCP config:', error);
      setError(error.message || 'Failed to delete MCP config');
    } finally {
      setSyncing(false);
    }
  },
  
  // ═══ SYNC RESPONSE CONFIGS ═══
  
  syncAddResponseConfig: async (config: Omit<SavedResponseConfig, 'id'>) => {
    const { projectId, setSyncing, setError, responseConfigIdMap, addResponseConfig } = get();
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformResponseConfigToBackend(config);
      const created = await backendAPI.responseConfigs.create(projectId, backendData);
      
      responseConfigIdMap.set(created.numeric_id, created.id);
      const localId = addResponseConfig(config);
      
      console.log(`✅ Response Config synced to backend: ${created.name} (ID: ${created.numeric_id})`);
      return created.numeric_id;
    } catch (error: any) {
      console.error('❌ Error syncing response config:', error);
      setError(error.message || 'Failed to create response config');
      return null;
    } finally {
      setSyncing(false);
    }
  },
  
  syncUpdateResponseConfig: async (id: number, updates: Partial<SavedResponseConfig>) => {
    const { responseConfigIdMap, setSyncing, setError, updateResponseConfig } = get();
    const uuid = responseConfigIdMap.get(id);
    
    if (!uuid) {
      console.warn(`No UUID found for response config ID ${id}, updating locally only`);
      updateResponseConfig(id, updates);
      return;
    }
    
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformResponseConfigToBackend({ ...get().getResponseConfigById(id)!, ...updates });
      await backendAPI.responseConfigs.update(uuid, backendData);
      updateResponseConfig(id, updates);
      console.log(`✅ Response Config updated in backend: ${id}`);
    } catch (error: any) {
      console.error('❌ Error updating response config:', error);
      setError(error.message || 'Failed to update response config');
    } finally {
      setSyncing(false);
    }
  },
  
  syncDeleteResponseConfig: async (id: number) => {
    const { responseConfigIdMap, setSyncing, setError, deleteResponseConfig } = get();
    const uuid = responseConfigIdMap.get(id);
    
    if (!uuid) {
      console.warn(`No UUID found for response config ID ${id}, deleting locally only`);
      deleteResponseConfig(id);
      return;
    }
    
    setSyncing(true);
    setError(null);
    
    try {
      await backendAPI.responseConfigs.delete(uuid);
      responseConfigIdMap.delete(id);
      deleteResponseConfig(id);
      console.log(`✅ Response Config deleted from backend: ${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting response config:', error);
      setError(error.message || 'Failed to delete response config');
    } finally {
      setSyncing(false);
    }
  },
  
  // ═══ SYNC WORKFLOW ═══
  
  syncSaveWorkflow: async (name: string) => {
    const { projectId, workflowSteps, currentFlowId, setSyncing, setError, setWorkflowSteps } = get();
    setSyncing(true);
    setError(null);
    
    try {
      const backendData = transformFlowToBackend(name, workflowSteps);
      
      if (currentFlowId) {
        // Update existing flow
        await backendAPI.flows.update(currentFlowId, backendData);
        console.log(`✅ Workflow updated in backend: ${name}`);
      } else {
        // Create new flow
        const created = await backendAPI.flows.create(projectId, backendData);
        setWorkflowSteps(workflowSteps, created.id);
        console.log(`✅ Workflow created in backend: ${name} (ID: ${created.id})`);
      }
    } catch (error: any) {
      console.error('❌ Error saving workflow:', error);
      setError(error.message || 'Failed to save workflow');
    } finally {
      setSyncing(false);
    }
  }
}));
