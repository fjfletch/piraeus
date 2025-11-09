import { FlowConfiguration, FlowNode, FlowEdge } from '@/types/mcp';

/**
 * Check if a connection between two node types is allowed
 */
export function canConnect(sourceType: string, targetType: string): boolean {
  // Query can only connect to LLM
  if (sourceType === 'query' && targetType === 'llm') return true;

  // LLM can connect to Response or Tool
  if (sourceType === 'llm' && (targetType === 'response' || targetType === 'tool')) return true;

  // Tool can only connect to Response
  if (sourceType === 'tool' && targetType === 'response') return true;

  // Everything else is invalid
  return false;
}

/**
 * Get user-friendly error message for invalid connections
 */
export function getConnectionErrorMessage(sourceType: string, targetType: string): string {
  if (sourceType === 'query' && targetType !== 'llm') {
    return 'User Queries can only connect to LLM nodes';
  }

  if (sourceType === 'llm' && targetType !== 'response' && targetType !== 'tool') {
    return 'LLM nodes can only connect to Tool instances or Response nodes';
  }

  if (sourceType === 'tool' && targetType !== 'response') {
    return 'Tool instances can only connect to Response nodes';
  }

  if (sourceType === 'response') {
    return 'Response nodes cannot have outgoing connections';
  }

  return 'This connection is not allowed';
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
