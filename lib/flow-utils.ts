import { Node, Edge } from 'reactflow';
import { MCPIntegration } from '@/types/mcp';

export function generateFlowFromMCP(mcp: MCPIntegration | null): { nodes: Node[], edges: Edge[] } {
  if (!mcp) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yPos = 50;
  const xCenter = 400;

  // Input node
  nodes.push({
    id: 'input',
    type: 'default',
    position: { x: xCenter, y: yPos },
    data: { 
      label: '🎤 User Query',
      type: 'input'
    },
    style: {
      background: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: '8px',
      padding: '10px',
      width: 180,
    },
  });
  yPos += 120;

  // LLM node
  nodes.push({
    id: 'llm',
    type: 'default',
    position: { x: xCenter, y: yPos },
    data: { 
      label: `🤖 LLM (${mcp.configuration.model})`,
      type: 'llm',
      details: mcp.configuration
    },
    style: {
      background: '#e0f2fe',
      border: '2px solid #0284c7',
      borderRadius: '8px',
      padding: '10px',
      width: 200,
    },
  });
  edges.push({
    id: 'input-llm',
    source: 'input',
    target: 'llm',
    type: 'smoothstep',
  });
  yPos += 140;

  // API nodes
  const apiYPos = yPos;
  const apiSpacing = 250;
  const totalWidth = mcp.apis.length * apiSpacing;
  const startX = xCenter - totalWidth / 2 + apiSpacing / 2;

  mcp.apis.forEach((api, index) => {
    const apiId = `api-${api.id}`;
    const xPos = startX + index * apiSpacing;

    nodes.push({
      id: apiId,
      type: 'default',
      position: { x: xPos, y: apiYPos },
      data: { 
        label: `📡 ${api.name}`,
        type: 'api',
        details: api
      },
      style: {
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        padding: '10px',
        width: 180,
      },
    });
    edges.push({
      id: `llm-${apiId}`,
      source: 'llm',
      target: apiId,
      type: 'smoothstep',
    });

    // Tools for this API
    const apiTools = mcp.tools.filter(t => t.apiId === api.id);
    const toolYPos = apiYPos + 120;
    
    apiTools.forEach((tool, toolIndex) => {
      const toolId = `tool-${tool.id}`;
      const toolX = xPos + (toolIndex - apiTools.length / 2) * 100;
      
      nodes.push({
        id: toolId,
        type: 'default',
        position: { x: toolX, y: toolYPos },
        data: { 
          label: `🔧 ${tool.displayName}`,
          type: 'tool',
          details: tool
        },
        style: {
          background: '#ddd6fe',
          border: '2px solid #7c3aed',
          borderRadius: '8px',
          padding: '10px',
          width: 160,
        },
      });
      edges.push({
        id: `${apiId}-${toolId}`,
        source: apiId,
        target: toolId,
        type: 'smoothstep',
      });
    });
  });

  // Output node
  const maxToolY = mcp.tools.length > 0 ? apiYPos + 240 : apiYPos + 120;
  nodes.push({
    id: 'output',
    type: 'default',
    position: { x: xCenter, y: maxToolY },
    data: { 
      label: '💬 Response to User',
      type: 'output'
    },
    style: {
      background: '#d1fae5',
      border: '2px solid #10b981',
      borderRadius: '8px',
      padding: '10px',
      width: 180,
    },
  });

  // Connect tools/APIs to output
  if (mcp.tools.length > 0) {
    mcp.tools.forEach(tool => {
      edges.push({
        id: `tool-${tool.id}-output`,
        source: `tool-${tool.id}`,
        target: 'output',
        type: 'smoothstep',
      });
    });
  } else if (mcp.apis.length > 0) {
    mcp.apis.forEach(api => {
      edges.push({
        id: `api-${api.id}-output`,
        source: `api-${api.id}`,
        target: 'output',
        type: 'smoothstep',
      });
    });
  } else {
    edges.push({
      id: 'llm-output',
      source: 'llm',
      target: 'output',
      type: 'smoothstep',
    });
  }

  return { nodes, edges };
}
