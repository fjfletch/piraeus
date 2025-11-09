'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { useMCPStore } from '@/store/mcpStore';

export function ToolNode({ data, selected }: NodeProps) {
  const { currentMCP, nodes } = useMCPStore();
  const toolId = data.toolId;
  
  // Find which LLMs have this tool in their available list
  const availableLLMs = (nodes as any[]).filter(n => {
    if (n.id === 'llm' || n.id?.startsWith('llm-')) {
      const llmToolIds = n.data?.availableToolIds || [];
      return llmToolIds.includes(toolId);
    }
    return false;
  });
  
  return (
    <div 
      className={`relative bg-gradient-to-br from-purple-50 to-pink-50 border-2 rounded-lg p-3 min-w-[180px] ${
        selected ? 'border-purple-500 shadow-lg' : 'border-purple-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="space-y-1">
        <div className="font-semibold text-sm text-center">
          {data.label}
        </div>
        
        {availableLLMs.length > 0 && (
          <div className="text-xs text-center text-muted-foreground">
            ✓ Available to {availableLLMs.length} LLM{availableLLMs.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
