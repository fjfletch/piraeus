'use client';

import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  Node,
  Edge,
  addEdge,
  Connection,
  EdgeChange,
  applyEdgeChanges,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMCPStore } from '@/store/mcpStore';
import { useToast } from '@/components/ui/use-toast';
import { canConnect, getConnectionErrorMessage, connectionExists, validateToolConnection } from '@/lib/flowValidation';
import BlocksPalette from './BlocksPalette';
import { LLMNode } from '@/components/flow/LLMNode';
import { ToolNode } from '@/components/flow/ToolNode';

export default function FlowCanvas() {
  const { currentMCP, selectNode, llmNodes } = useMCPStore();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);

  // Initialize flow only when currentMCP changes (not when llmNodes changes)
  useEffect(() => {
    if (!currentMCP) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Only initialize if nodes are empty (first load)
    if (nodes.length === 0) {
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Input node
      newNodes.push({
        id: 'input',
        type: 'input',
        position: { x: 250, y: 50 },
        data: { label: '🎤 User Query' },
        style: { 
          backgroundColor: '#f0f9ff', 
          border: '2px solid #0ea5e9',
          borderRadius: '8px',
          padding: '12px',
          fontWeight: 500,
        },
        draggable: true,
      });

      // LLM node - get config from store
      const llmConfig = llmNodes['llm'] || { mode: 'normal' };
      const llmModeLabel = llmConfig.mode === 'mcp' ? '🔧 MCP Tool Calling' : '💬 Normal Prompt';
      newNodes.push({
        id: 'llm',
        position: { x: 220, y: 150 },
        data: {
          label: `🤖 LLM Decision\n${llmModeLabel}`,
          mode: llmConfig.mode,
        },
        style: { 
          backgroundColor: '#e0f2fe', 
          border: '2px solid #0284c7',
          borderRadius: '8px',
          padding: '12px',
          fontWeight: 500,
        },
        draggable: true,
      });

      // Edge from input to LLM (SOLID LINE)
      newEdges.push({
        id: 'input-llm',
        source: 'input',
        target: 'llm',
        style: {
          stroke: '#3b82f6',
          strokeWidth: 2,
          // Solid line - no strokeDasharray
        },
        data: {
          condition: { type: 'always' as const },
        },
      });

      // Output node
      newNodes.push({
        id: 'output',
        type: 'output',
        position: { x: 250, y: 580 },
        data: { label: '💬 Response to User' },
        style: { 
          backgroundColor: '#f0fdf4', 
          border: '2px solid #22c55e',
          borderRadius: '8px',
          padding: '12px',
          fontWeight: 500,
        },
        draggable: true,
      });

      // Connect LLM directly to output (SOLID LINE)
      newEdges.push({
        id: 'llm-output',
        source: 'llm',
        target: 'output',
        style: {
          stroke: '#3b82f6',
          strokeWidth: 2,
          // Solid line - no strokeDasharray
        },
        data: {
          condition: { type: 'always' as const },
        },
      });

      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [currentMCP]);

  // Separate effect to update LLM node label when mode changes (without resetting the flow)
  useEffect(() => {
    if (nodes.length > 0) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === 'llm') {
            const llmConfig = llmNodes['llm'] || { mode: 'normal' };
            const llmModeLabel = llmConfig.mode === 'mcp' ? '🔧 MCP Tool Calling' : '💬 Normal Prompt';
            return {
              ...node,
              data: {
                ...node.data,
                label: `🤖 LLM Decision\n${llmModeLabel}`,
                mode: llmConfig.mode,
              },
            };
          }
          return node;
        })
      );
    }
  }, [llmNodes]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    selectNode({
      id: node.id,
      type: node.id.startsWith('tool-')
        ? 'tool'
        : node.id.startsWith('api-')
        ? 'tool' // API nodes are treated as tool type
        : node.id === 'llm'
        ? 'llm'
        : node.id === 'query'
        ? 'query'
        : 'response',
      position: node.position,
      data: node.data,
    });
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) {
        return;
      }

      // Get source and target nodes
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) {
        toast({
          title: "Error",
          description: "Could not find source or target node",
          variant: "destructive",
        });
        return;
      }

      // Determine node types based on ID patterns and type property
      const getNodeType = (node: Node) => {
        if (node.id.startsWith('tool-')) return 'tool';
        if (node.id === 'input' || node.id.startsWith('query-')) return 'query';
        if (node.id === 'output' || node.id.startsWith('response-')) return 'response';
        if (node.id === 'llm' || node.id.startsWith('llm-')) return 'llm';
        return node.type || 'default';
      };

      const sourceType = getNodeType(sourceNode);
      const targetType = getNodeType(targetNode);
      
      // Check for duplicate connection
      if (connectionExists(params.source, params.target, edges as any)) {
        toast({
          title: "Duplicate Connection",
          description: "A connection between these nodes already exists. Click the existing connection to edit it.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate connection type
      if (!canConnect(sourceType, targetType)) {
        const errorMsg = getConnectionErrorMessage(sourceType, targetType);
        toast({
          title: "Invalid Connection",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
      
      // Special validation for LLM → Tool connections
      if (sourceType === 'llm' && targetType === 'tool') {
        const toolValidation = validateToolConnection(
          sourceNode as any,
          targetNode as any,
          currentMCP?.tools || []
        );
        
        if (!toolValidation.valid) {
          toast({
            title: "Tool Not Available",
            description: toolValidation.error,
            variant: "destructive",
          });
          return;
        }
      }
      
      // Create edge with solid line (default)
      const newEdge = {
        ...params,
        type: 'smoothstep',
        style: {
          stroke: '#3b82f6',
          strokeWidth: 2,
          // Solid line - no strokeDasharray
        },
        data: {
          condition: { type: 'always' as const },
          priority: edges.filter(e => e.source === params.source).length,
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      toast({
        title: 'Nodes Connected',
        description: 'Connection created successfully. You can edit its properties by clicking on it.',
      });
    },
    [nodes, edges, currentMCP, setEdges, toast]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Get selected edges and nodes
        const selectedEdges = edges.filter((edge) => edge.selected);
        if (selectedEdges.length > 0) {
          setEdges((eds) => eds.filter((edge) => !edge.selected));
          toast({
            title: 'Connection Deleted',
            description: `Deleted ${selectedEdges.length} connection(s)`,
          });
        }
      }
    },
    [edges, setEdges, toast]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const blockDataStr = event.dataTransfer.getData('blockData');

      if (!type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let blockData = {};
      try {
        blockData = JSON.parse(blockDataStr);
      } catch (e) {
        console.error('Error parsing block data:', e);
      }

      let newNode: Node | null = null;
      const uniqueId = `${type}-${Date.now()}`;

      if (type === 'user-query') {
        newNode = {
          id: uniqueId,
          type: 'input',
          position,
          data: { label: '🎤 User Query' },
          style: {
            backgroundColor: '#f0f9ff',
            border: '2px solid #0ea5e9',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: 500,
          },
          draggable: true,
        };
      } else if (type === 'llm-decision') {
        newNode = {
          id: uniqueId,
          type: 'default',
          position,
          data: {
            label: `🤖 LLM Decision\nNormal Prompt`,
            mode: 'normal',
          },
          style: {
            backgroundColor: '#e0f2fe',
            border: '2px solid #0284c7',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: 500,
          },
          draggable: true,
        };
      } else if (type === 'response') {
        newNode = {
          id: uniqueId,
          type: 'output',
          position,
          data: { label: '💬 Response to User' },
          style: {
            backgroundColor: '#f0fdf4',
            border: '2px solid #22c55e',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: 500,
          },
          draggable: true,
        };
      } else if (type === 'tool') {
        const tool = blockData as any;
        newNode = {
          id: `${uniqueId}-${tool.id}`,
          type: 'default',
          position,
          data: {
            label: `🔧 ${tool.displayName}\n${tool.method} ${tool.endpoint}`,
            toolId: tool.id,
          },
          style: {
            backgroundColor: '#ddd6fe',
            border: '2px solid #8b5cf6',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: 500,
            minWidth: '160px',
          },
          draggable: true,
        };
      } else if (type === 'prompt') {
        const prompt = blockData as any;
        newNode = {
          id: `${uniqueId}-${prompt.id}`,
          type: 'default',
          position,
          data: {
            label: `${prompt.type === 'system' ? '⚙️' : '💬'} ${prompt.type}\n${prompt.content.substring(0, 30)}...`,
            promptId: prompt.id,
          },
          style: {
            backgroundColor: '#dbeafe',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: 500,
            minWidth: '160px',
          },
          draggable: true,
        };
      }

      if (newNode) {
        setNodes((nds) => nds.concat(newNode as Node));
        toast({
          title: 'Block Added',
          description: `${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} added to canvas`,
        });
      }
    },
    [reactFlowInstance, setNodes, toast, currentMCP]
  );

  if (!currentMCP) {
    return (
      <div className="flex h-full">
        <BlocksPalette />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Create an MCP to see the flow diagram</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <BlocksPalette />
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeClick={handleNodeClick}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} />
          <Panel position="top-right" className="bg-background/90 p-3 rounded-lg border shadow-lg max-w-xs">
            <div className="text-sm">
              <p className="font-semibold mb-2">💡 MCP Flow Builder</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Flow Logic:</strong></p>
                <p>• Query → LLM → Response</p>
                <p>• Tools attach to LLMs (not in main flow)</p>
                <p>• APIs define Tools (config only)</p>
                <p className="pt-2"><strong>Actions:</strong></p>
                <p>• Drag Core Blocks from palette</p>
                <p>• Connect by dragging between nodes</p>
                <p>• Click nodes to edit properties</p>
                <p>• Delete connections with Delete key</p>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
