import { create } from 'zustand';
import { MCPIntegration, APIConfig, MCPTool, FlowNode, FlowEdge } from '@/types/mcp';

interface MCPStoreState {
  currentMCP: MCPIntegration | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: FlowNode | null;
  llmNodes: Record<string, any>; // Store individual LLM node configs
  setCurrentMCP: (mcp: MCPIntegration | null) => void;
  updateMCP: (updates: Partial<MCPIntegration>) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  addAPI: (api: APIConfig) => void;
  updateAPI: (apiId: string, updates: Partial<APIConfig>) => void;
  removeAPI: (apiId: string) => void;
  addTool: (tool: MCPTool) => void;
  updateTool: (toolId: string, updates: Partial<MCPTool>) => void;
  removeTool: (toolId: string) => void;
  selectNode: (node: FlowNode | null) => void;
  updateLLMNode: (nodeId: string, config: any) => void;
  getLLMNode: (nodeId: string) => any;
}

export const useMCPStore = create<MCPStoreState>((set, get) => ({
  currentMCP: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  llmNodes: {},

  setCurrentMCP: (mcp) => set({ currentMCP: mcp }),

  updateMCP: (updates) =>
    set((state) => ({
      currentMCP: state.currentMCP
        ? { ...state.currentMCP, ...updates, updatedAt: new Date().toISOString() }
        : null,
    })),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  addAPI: (api) =>
    set((state) => ({
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            apis: [...state.currentMCP.apis, api],
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  updateAPI: (apiId, updates) =>
    set((state) => ({
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            apis: state.currentMCP.apis.map((api) =>
              api.id === apiId ? { ...api, ...updates } : api
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  removeAPI: (apiId) =>
    set((state) => ({
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            apis: state.currentMCP.apis.filter((api) => api.id !== apiId),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  addTool: (tool) =>
    set((state) => ({
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            tools: [...state.currentMCP.tools, tool],
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  updateTool: (toolId, updates) =>
    set((state) => ({
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            tools: state.currentMCP.tools.map((tool) =>
              tool.id === toolId ? { ...tool, ...updates } : tool
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  removeTool: (toolId) =>
    set((state) => ({
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            tools: state.currentMCP.tools.filter((tool) => tool.id !== toolId),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  selectNode: (node) => set({ selectedNode: node }),
}));
