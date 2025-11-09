'use client';

import { MCPTool } from '@/types/mcp';

interface ToolAccessBadgeProps {
  toolCount: number;
  toolIds: string[];
  tools: MCPTool[];
  onClick?: () => void;
}

export function ToolAccessBadge({ toolCount, toolIds, tools, onClick }: ToolAccessBadgeProps) {
  const toolNames = tools
    .filter(t => toolIds.includes(t.id))
    .map(t => t.displayName)
    .slice(0, 3);
  
  const tooltipText = `Available tools: ${toolNames.join(', ')}${toolCount > 3 ? ` and ${toolCount - 3} more` : ''}`;
  
  return (
    <div 
      className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-purple-200 transition-colors"
      onClick={onClick}
      title={tooltipText}
    >
      🔧 {toolCount} tool{toolCount !== 1 ? 's' : ''}
    </div>
  );
}
