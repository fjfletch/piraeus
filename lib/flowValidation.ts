import { FlowConfiguration, FlowNode, FlowEdge, MCPTool } from '@/types/mcp';

/**
 * Connection rules: defines which node types can connect to which
 */
export const CONNECTION_RULES = {
  // Allowed connections: source type -> array of allowed target types
  allowed: {
    'query': ['llm', 'response'], // Query can connect to LLM or directly to Response
    'llm': ['response', 'tool'],  // LLM can connect to Response or Tool
    'tool': ['response'],          // Tool can only connect to Response
    'response': []                 // Response has no outgoing connections (terminal)
  },
  
  // Prohibited connections (for documentation)
  prohibited: {
    'query': ['query', 'tool'],
    'llm': ['query', 'llm'],
    'tool': ['query', 'llm', 'tool'],
    'response': ['query', 'llm', 'tool', 'response']
  }
};

/**
 * Check if a connection between two node types is allowed
 */
export function canConnect(sourceType: string, targetType: string): boolean {
  const allowedKey = sourceType as keyof typeof CONNECTION_RULES.allowed;
  const allowedTargets = CONNECTION_RULES.allowed[allowedKey];
  if (!allowedTargets) return false;
  return allowedTargets.includes(targetType as any);
}

/**
 * Get user-friendly error message for invalid connections
 */
export function getConnectionErrorMessage(sourceType: string, targetType: string): string {
  if (canConnect(sourceType, targetType)) {
    return '';
  }
  
  const allowed = CONNECTION_RULES.allowed[sourceType as keyof typeof CONNECTION_RULES.allowed] || [];
  
  if (allowed.length === 0) {
    return `${sourceType} nodes cannot have outgoing connections`;
  }
  
  return `${sourceType} nodes can only connect to: ${allowed.join(', ')}`;
}

/**
 * Check if a connection already exists between two nodes
 */
export function connectionExists(
  sourceId: string, 
  targetId: string, 
  edges: FlowEdge[]
): boolean {
  return edges.some(edge => 
    edge.source === sourceId && edge.target === targetId
  );
}

/**
 * Validate LLM to Tool connection
 * Tool must be in LLM's available tools list
 */
export function validateToolConnection(
  llmNode: FlowNode,
  toolNode: FlowNode,
  toolDefinitions: MCPTool[]
): { valid: boolean; error?: string } {
  // Get tool definition ID from tool node
  const toolDefinitionId = (toolNode.data as any)?.toolId;
  if (!toolDefinitionId) {
    return { valid: false, error: 'Tool instance has no tool definition' };
  }
  
  // Check if tool is in LLM's available tools
  const availableToolIds = (llmNode.data as any)?.availableToolIds || [];
  if (!availableToolIds.includes(toolDefinitionId)) {
    const toolDef = toolDefinitions.find(t => t.id === toolDefinitionId);
    const toolName = toolDef?.displayName || toolDefinitionId;
    return { 
      valid: false, 
      error: `Tool "${toolName}" is not in this LLM's available tools list. Add it in the LLM properties first.` 
    };
  }
  
  return { valid: true };
}

/**
 * Get required connections for a node type
 */
export function getRequiredConnections(nodeType: string): {
  incoming: string[];
  outgoing: string[];
} {
  switch (nodeType) {
    case 'query':
      return { incoming: [], outgoing: ['llm'] };
    case 'llm':
      return { incoming: ['query'], outgoing: ['response', 'tool'] };
    case 'tool':
      return { incoming: ['llm'], outgoing: ['response'] };
    case 'response':
      return { incoming: ['llm', 'tool'], outgoing: [] };
    default:
      return { incoming: [], outgoing: [] };
  }
}

/**
 * Validate entire flow for correctness
 */
export function validateFlow(flow: FlowConfiguration): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { nodes, edges } = flow;

  // Build adjacency maps
  const incomingConnections = new Map<string, string[]>();
  const outgoingConnections = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!incomingConnections.has(edge.target)) {
      incomingConnections.set(edge.target, []);
    }
    incomingConnections.get(edge.target)!.push(edge.source);

    if (!outgoingConnections.has(edge.source)) {
      outgoingConnections.set(edge.source, []);
    }
    outgoingConnections.get(edge.source)!.push(edge.target);
  });

  // Validate each node
  nodes.forEach((node) => {
    const incoming = incomingConnections.get(node.id) || [];
    const outgoing = outgoingConnections.get(node.id) || [];
    const required = getRequiredConnections(node.type);

    // Check query nodes
    if (node.type === 'query') {
      if (outgoing.length === 0) {
        errors.push(`User Query "${node.data.label}" has no outgoing connections. Connect it to an LLM node.`);
      }
    }

    // Check LLM nodes
    if (node.type === 'llm') {
      if (incoming.length === 0) {
        errors.push(`LLM "${node.data.label}" has no incoming connections. Connect a User Query to it.`);
      }
      if (outgoing.length === 0) {
        errors.push(`LLM "${node.data.label}" has no outgoing connections. Connect it to a Tool or Response node.`);
      }
    }

    // Check tool nodes
    if (node.type === 'tool') {
      if (incoming.length === 0) {
        errors.push(`Tool "${node.data.label}" has no incoming connections. Connect an LLM node to it.`);
      }
      if (outgoing.length === 0) {
        errors.push(`Tool "${node.data.label}" has no outgoing connections. Connect it to a Response node.`);
      }
    }

    // Check response nodes
    if (node.type === 'response') {
      if (incoming.length === 0) {
        errors.push(`Response "${node.data.label}" has no incoming connections. Connect an LLM or Tool to it.`);
      }
      if (outgoing.length > 0) {
        errors.push(`Response "${node.data.label}" should not have outgoing connections.`);
      }
    }
  });

  // Check for circular connections (simple check)
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoing = outgoingConnections.get(nodeId) || [];
    for (const targetId of outgoing) {
      if (!visited.has(targetId)) {
        if (hasCycle(targetId)) return true;
      } else if (recursionStack.has(targetId)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        errors.push('Flow contains circular connections, which are not allowed.');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
