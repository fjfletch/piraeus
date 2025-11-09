import { create } from 'zustand';
import { MCPIntegration, APIConfig, MCPTool, FlowNode, FlowEdge } from '@/types/mcp';
import { canConnect } from '@/lib/flowValidation';

interface MCPStoreState {
  currentMCP: MCPIntegration | null;
  nodes: FlowNode[]; // Legacy - for React Flow backward compatibility
  edges: FlowEdge[]; // Legacy - for React Flow backward compatibility
  flowNodes: FlowNode[]; // Manually created flow nodes
  flowEdges: FlowEdge[]; // Manually created flow edges
  selectedNode: FlowNode | null;
  selectedEdge: FlowEdge | null;
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
  selectEdge: (edge: FlowEdge | null) => void;
  updateEdge: (edgeId: string, updates: Partial<FlowEdge>) => void;
  updateLLMNode: (nodeId: string, config: any) => void;
  getLLMNode: (nodeId: string) => any;
  // New flow management actions
  addFlowNode: (node: FlowNode) => void;
  updateFlowNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  removeFlowNode: (nodeId: string) => void;
  addFlowEdge: (edge: FlowEdge) => void;
  removeFlowEdge: (edgeId: string) => void;
  validateFlowConnection: (sourceId: string, targetId: string) => boolean;
  getNodeById: (nodeId: string) => FlowNode | null;
  getConnectedNodes: (nodeId: string) => { incoming: FlowNode[]; outgoing: FlowNode[] };
  setFlowNodes: (nodes: FlowNode[]) => void;
  setFlowEdges: (edges: FlowEdge[]) => void;
}

export const useMCPStore = create<MCPStoreState>((set, get) => ({
  currentMCP: null,
  nodes: [],
  edges: [],
  flowNodes: [],
  flowEdges: [],
  selectedNode: null,
  selectedEdge: null,
  llmNodes: {},

  setCurrentMCP: (mcp) => {
    set({ currentMCP: mcp });
    if (mcp?.flow) {
      set({ flowNodes: mcp.flow.nodes, flowEdges: mcp.flow.edges });
    }
  },

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

  selectNode: (node) => set({ selectedNode: node, selectedEdge: null }),

  selectEdge: (edge) => set({ selectedEdge: edge, selectedNode: null }),

  updateEdge: (edgeId, updates) =>
    set((state) => {
      const updatedEdges = state.flowEdges.map((edge) =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      );
      return {
        flowEdges: updatedEdges,
        currentMCP: state.currentMCP
          ? {
              ...state.currentMCP,
              flow: {
                nodes: state.flowNodes,
                edges: updatedEdges,
              },
              updatedAt: new Date().toISOString(),
            }
          : null,
      };
    }),

  updateLLMNode: (nodeId, config) =>
    set((state) => ({
      llmNodes: {
        ...state.llmNodes,
        [nodeId]: config,
      },
    })),

  getLLMNode: (nodeId) => {
    const state = get();
    return state.llmNodes[nodeId] || {
      mode: 'normal',
      model: state.currentMCP?.configuration.model || 'gpt-3.5-turbo',
      temperature: state.currentMCP?.configuration.temperature || 0.7,
      maxTokens: state.currentMCP?.configuration.maxTokens || 2000,
      systemPrompt: state.currentMCP?.configuration.globalPrompt || '',
    };
  },

  // Flow management actions
  addFlowNode: (node) =>
    set((state) => ({
      flowNodes: [...state.flowNodes, node],
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            flow: {
              nodes: [...state.flowNodes, node],
              edges: state.flowEdges,
            },
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  updateFlowNode: (nodeId, updates) =>
    set((state) => {
      const updatedNodes = state.flowNodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      );
      return {
        flowNodes: updatedNodes,
        currentMCP: state.currentMCP
          ? {
              ...state.currentMCP,
              flow: {
                nodes: updatedNodes,
                edges: state.flowEdges,
              },
              updatedAt: new Date().toISOString(),
            }
          : null,
      };
    }),

  removeFlowNode: (nodeId) =>
    set((state) => {
      const filteredNodes = state.flowNodes.filter((node) => node.id !== nodeId);
      const filteredEdges = state.flowEdges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      return {
        flowNodes: filteredNodes,
        flowEdges: filteredEdges,
        selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
        currentMCP: state.currentMCP
          ? {
              ...state.currentMCP,
              flow: {
                nodes: filteredNodes,
                edges: filteredEdges,
              },
              updatedAt: new Date().toISOString(),
            }
          : null,
      };
    }),

  addFlowEdge: (edge) =>
    set((state) => ({
      flowEdges: [...state.flowEdges, edge],
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            flow: {
              nodes: state.flowNodes,
              edges: [...state.flowEdges, edge],
            },
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  removeFlowEdge: (edgeId) =>
    set((state) => {
      const filteredEdges = state.flowEdges.filter((edge) => edge.id !== edgeId);
      return {
        flowEdges: filteredEdges,
        currentMCP: state.currentMCP
          ? {
              ...state.currentMCP,
              flow: {
                nodes: state.flowNodes,
                edges: filteredEdges,
              },
              updatedAt: new Date().toISOString(),
            }
          : null,
      };
    }),

  validateFlowConnection: (sourceId, targetId) => {
    const state = get();
    const sourceNode = state.flowNodes.find((n) => n.id === sourceId);
    const targetNode = state.flowNodes.find((n) => n.id === targetId);

    if (!sourceNode || !targetNode) return false;

    return canConnect(sourceNode.type, targetNode.type);
  },

  getNodeById: (nodeId) => {
    const state = get();
    return state.flowNodes.find((n) => n.id === nodeId) || null;
  },

  getConnectedNodes: (nodeId) => {
    const state = get();
    const incoming: FlowNode[] = [];
    const outgoing: FlowNode[] = [];

    state.flowEdges.forEach((edge) => {
      if (edge.target === nodeId) {
        const sourceNode = state.flowNodes.find((n) => n.id === edge.source);
        if (sourceNode) incoming.push(sourceNode);
      }
      if (edge.source === nodeId) {
        const targetNode = state.flowNodes.find((n) => n.id === edge.target);
        if (targetNode) outgoing.push(targetNode);
      }
    });

    return { incoming, outgoing };
  },

  setFlowNodes: (nodes) =>
    set((state) => ({
      flowNodes: nodes,
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            flow: {
              nodes,
              edges: state.flowEdges,
            },
          }
        : null,
    })),

  setFlowEdges: (edges) =>
    set((state) => ({
      flowEdges: edges,
      currentMCP: state.currentMCP
        ? {
            ...state.currentMCP,
            flow: {
              nodes: state.flowNodes,
              edges,
            },
          }
        : null,
    })),
}));
