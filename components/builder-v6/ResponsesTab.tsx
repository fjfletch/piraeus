"use client";

import { useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Plus } from 'lucide-react';
import { ResponseConfigModal } from './ResponseConfigModal';

export namespace ResponsesTab {
  export function Sidebar() {
    const { savedResponseConfigs } = useMCPBuilderStore();
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleConfigClick = (configId: number) => {
      setSelectedConfigId(configId);
      setIsModalOpen(true);
    };

    const handleAddConfig = () => {
      setSelectedConfigId(null);
      setIsModalOpen(true);
    };

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-3">
            Response Configs ({savedResponseConfigs.length})
          </h3>
          <Button
            onClick={handleAddConfig}
            className="w-full justify-start"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Response Config
          </Button>
        </div>

        {/* Config List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {savedResponseConfigs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No response configs yet
            </div>
          ) : (
            savedResponseConfigs.map((config) => (
              <div
                key={config.id}
                onClick={() => handleConfigClick(config.id)}
                className="p-3 bg-card border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Send className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate mb-1">{config.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {config.type === 'raw-output' ? 'Raw Output' : 'LLM Reprocess'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        <ResponseConfigModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          configId={selectedConfigId}
        />
      </div>
    );
  }

  export function Canvas() {
    const { savedResponseConfigs } = useMCPBuilderStore();
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleConfigClick = (configId: number) => {
      setSelectedConfigId(configId);
      setIsModalOpen(true);
    };

    const getTypeLabel = (type: string) => {
      return type === 'raw-output' ? 'Raw Output' : 'LLM Reprocess';
    };

    const getErrorHandlingLabel = (handling?: string) => {
      switch (handling) {
        case 'pass-through':
          return 'Pass Through';
        case 'retry':
          return 'Retry';
        case 'fallback':
          return 'Fallback';
        default:
          return 'Not Set';
      }
    };

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Response Configurations</h2>
          <p className="text-muted-foreground">
            Configure how responses are processed and handled
          </p>
        </div>

        {/* Configs Grid */}
        {savedResponseConfigs.length === 0 ? (
          <div className="text-center py-12">
            <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No response configs yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first response configuration to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedResponseConfigs.map((config) => (
              <Card
                key={config.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleConfigClick(config.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Send className="h-5 w-5 text-primary" />
                    <Badge variant="secondary">{getTypeLabel(config.type)}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{config.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Error Handling: </span>
                    <span className="font-medium">{getErrorHandlingLabel(config.errorHandling)}</span>
                  </div>
                  {config.type === 'llm-reprocess' && config.reprocessInstructions && (
                    <CardDescription className="line-clamp-2">
                      {config.reprocessInstructions}
                    </CardDescription>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        <ResponseConfigModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          configId={selectedConfigId}
        />
      </div>
    );
  }
}
