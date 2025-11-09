'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { ToolAccessBadge } from './ToolAccessBadge';
import { useMCPStore } from '@/store/mcpStore';

export function LLMNode({ data, selected }: NodeProps) {
  const { currentMCP } = useMCPStore();
  const availableToolIds = data.availableToolIds || [];
  const tools = currentMCP?.tools || [];
  
  return (
    <div 
      className={`relative bg-gradient-to-br from-blue-50 to-cyan-50 border-2 rounded-lg p-3 min-w-[180px] ${
        selected ? 'border-blue-500 shadow-lg' : 'border-blue-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="space-y-2">
        <div className="font-semibold text-sm text-center">
          {data.label}
        </div>
        
        {availableToolIds.length > 0 && (
          <div className="flex justify-center">
            <ToolAccessBadge 
              toolCount={availableToolIds.length}
              toolIds={availableToolIds}
              tools={tools}
            />
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
