'use client';

import { useEffect, useCallback, useRef } from 'react';
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

  if (!currentMCP) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Create an MCP to see the flow diagram</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick}
        onConnect={onConnect}
        fitView
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
        <Panel position="top-left" className="bg-background/90 p-3 rounded-lg border shadow-lg">
          <div className="text-sm">
            <p className="font-semibold mb-2">💡 Interactive Flow Canvas</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Click nodes to edit in Properties panel</p>
              <p>• Drag nodes to reposition</p>
              <p>• Click and drag between nodes to connect</p>
              <p>• Select connections and press Delete to remove</p>
              <p>• Add APIs & Tools in sidebar</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
