import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, FileText, Send, Wrench, Zap } from 'lucide-react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { TabType } from '@/types/builder';

export function TabBar() {
  const { currentTab, setCurrentTab } = useMCPBuilderStore();

  return (
    <div className="h-12 border-b bg-background px-6">
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as TabType)}>
        <TabsList className="h-10">
          <TabsTrigger value="tools" className="gap-2">
            <Wrench className="h-4 w-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <FileText className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="mcps" className="gap-2">
            <Bot className="h-4 w-4" />
            MCPs
          </TabsTrigger>
          <TabsTrigger value="responses" className="gap-2">
            <Send className="h-4 w-4" />
            Responses
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2">
            <Zap className="h-4 w-4" />
            Workflow
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
