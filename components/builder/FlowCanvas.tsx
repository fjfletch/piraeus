"use client";

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMCPStore } from '@/store/mcpStore';
import { generateFlowFromMCP } from '@/lib/flow-utils';

export function FlowCanvas() {
  const { currentMCP, selectNode } = useMCPStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateFlowFromMCP(currentMCP);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [currentMCP, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    selectNode(node as any);
  }, [selectNode]);

  return (
    <div className="flex-1 relative bg-muted/10">
      {/* Info Panel */}
      <div className="absolute top-4 left-4 z-10 bg-card border rounded-lg p-3 shadow-sm max-w-xs">
        <div className="text-sm">
          <div className="font-semibold mb-2">Flow Diagram</div>
          <div className="text-xs text-muted-foreground">
            This diagram shows how your MCP processes queries.
            Click on nodes to see details.
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        }}
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.type === 'input') return '#fef3c7';
            if (node.data.type === 'llm') return '#e0f2fe';
            if (node.data.type === 'api') return '#fef3c7';
            if (node.data.type === 'tool') return '#ddd6fe';
            if (node.data.type === 'output') return '#d1fae5';
            return '#e2e8f0';
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
        />
      </ReactFlow>
    </div>
  );
}
