"use client";

import { useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Plus, Upload } from 'lucide-react';
import { ToolModal } from './ToolModal';
import { ToolsImportModal } from './ToolsImportModal';

export namespace ToolsTab {
  export function Sidebar() {
    const { tools } = useMCPBuilderStore();
    const [selectedToolId, setSelectedToolId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const handleToolClick = (toolId: number) => {
      setSelectedToolId(toolId);
      setIsModalOpen(true);
    };

    const handleAddTool = () => {
      setSelectedToolId(null);
      setIsModalOpen(true);
    };

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-3">Tools ({tools.length})</h3>
          <div className="space-y-2">
            <Button
              onClick={handleAddTool}
              className="w-full justify-start"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tool
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Tools Library
            </Button>
          </div>
        </div>

        {/* Tool List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className="p-3 bg-card border rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-2">
                <Wrench className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1 truncate">{tool.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="flex-shrink-0">
                      {tool.method}
                    </Badge>
                    <span className="truncate block">{tool.url}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modals */}
        <ToolModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          toolId={selectedToolId}
        />
        <ToolsImportModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
        />
      </div>
    );
  }

  export function Canvas() {
    const { tools } = useMCPBuilderStore();
    const [selectedToolId, setSelectedToolId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleToolClick = (toolId: number) => {
      setSelectedToolId(toolId);
      setIsModalOpen(true);
    };

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Tools</h2>
          <p className="text-muted-foreground">
            Define HTTP API tools that your MCPs can use to interact with external services
          </p>
        </div>

        {/* Tools Grid */}
        {tools.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tools yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first tool to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Card
                key={tool.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleToolClick(tool.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Wrench className="h-5 w-5 text-primary" />
                    <Badge variant="secondary">{tool.method}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{tool.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="font-mono text-xs truncate bg-muted p-2 rounded">
                      {tool.url}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modals */}
        <ToolModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          toolId={selectedToolId}
        />
      </div>
    );
  }
}
