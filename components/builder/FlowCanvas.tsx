'use client';

import React, { useEffect, useCallback, useRef } from 'react';
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
import BlocksPalette from './BlocksPalette';

export default function FlowCanvas() {
  const { currentMCP, selectNode } = useMCPStore();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);

  useEffect(() => {
    if (!currentMCP) {
      setNodes([]);
      setEdges([]);
      return;
    }

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

    // LLM node
    newNodes.push({
      id: 'llm',
      position: { x: 220, y: 150 },
      data: {
        label: `🤖 LLM Decision\n${currentMCP.configuration.model || 'GPT-4'}`,
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

    // Edge from input to LLM
    newEdges.push({
      id: 'input-llm',
      source: 'input',
      target: 'llm',
      animated: true,
    });

    // API nodes
    currentMCP.apis.forEach((api, index) => {
      const apiNodeId = `api-${api.id}`;
      newNodes.push({
        id: apiNodeId,
        position: { x: 100 + index * 180, y: 280 },
        data: { label: `📡 ${api.name}\n${api.routes.length} routes`, apiId: api.id },
        style: { 
          backgroundColor: '#fef3c7', 
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px',
          fontWeight: 500,
          minWidth: '150px',
        },
        draggable: true,
      });
    });

    // Tool nodes
    currentMCP.tools.forEach((tool, index) => {
      const toolNodeId = `tool-${tool.id}`;
      newNodes.push({
        id: toolNodeId,
        position: { x: 50 + index * 180, y: 420 },
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
      });

      // Edge from LLM to tool
      newEdges.push({
        id: `llm-${toolNodeId}`,
        source: 'llm',
        target: toolNodeId,
        type: 'smoothstep',
        animated: false,
      });

      // Edge from tool to API (if connected)
      const connectedAPI = currentMCP.apis.find((api) => api.id === tool.apiId);
      if (connectedAPI) {
        newEdges.push({
          id: `${toolNodeId}-api-${connectedAPI.id}`,
          source: toolNodeId,
          target: `api-${connectedAPI.id}`,
          type: 'smoothstep',
          style: { strokeDasharray: '5 5', stroke: '#f59e0b' },
          label: 'calls',
        });
      }

      // Edge from tool to output
      newEdges.push({
        id: `${toolNodeId}-output`,
        source: toolNodeId,
        target: 'output',
        type: 'smoothstep',
      });
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

    // If no tools, connect LLM directly to output
    if (currentMCP.tools.length === 0) {
      newEdges.push({
        id: 'llm-output',
        source: 'llm',
        target: 'output',
        animated: true,
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [currentMCP, setNodes, setEdges]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    selectNode({
      id: node.id,
      type: node.id.startsWith('tool-')
        ? 'tool'
        : node.id.startsWith('api-')
        ? 'api'
        : node.id === 'llm'
        ? 'llm'
        : node.id === 'input'
        ? 'input'
        : 'output',
      position: node.position,
      data: node.data,
    });
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
      toast({
        title: 'Connection Added',
        description: 'You can delete connections by selecting them and pressing Delete',
      });
    },
    [setEdges, toast]
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
            label: `🤖 LLM Decision\n${currentMCP?.configuration.model || 'GPT-4'}`,
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
          <Panel position="top-right" className="bg-background/90 p-3 rounded-lg border shadow-lg">
            <div className="text-sm max-w-xs">
              <p className="font-semibold mb-2">💡 Interactive Canvas</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• <strong>Drag blocks</strong> from left palette to canvas</p>
                <p>• <strong>Click nodes</strong> to edit in Properties panel</p>
                <p>• <strong>Drag nodes</strong> to reposition</p>
                <p>• <strong>Connect nodes</strong> by dragging between them</p>
                <p>• <strong>Delete connections</strong> with Delete key</p>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
