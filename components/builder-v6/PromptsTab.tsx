"use client";

import { useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus } from 'lucide-react';
import { PromptModal } from './PromptModal';

export namespace PromptsTab {
  export function Sidebar() {
    const { savedPrompts } = useMCPBuilderStore();
    const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePromptClick = (promptId: number) => {
      setSelectedPromptId(promptId);
      setIsModalOpen(true);
    };

    const handleAddPrompt = () => {
      setSelectedPromptId(null);
      setIsModalOpen(true);
    };

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-3">Saved Prompts ({savedPrompts.length})</h3>
          <Button
            onClick={handleAddPrompt}
            className="w-full justify-start"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Prompt
          </Button>
        </div>

        {/* Prompt List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {savedPrompts.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No saved prompts yet
            </div>
          ) : (
            savedPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => handlePromptClick(prompt.id)}
                className="p-3 bg-card border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{prompt.name}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        <PromptModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          promptId={selectedPromptId}
        />
      </div>
    );
  }

  export function Canvas() {
    const { savedPrompts } = useMCPBuilderStore();
    const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePromptClick = (promptId: number) => {
      setSelectedPromptId(promptId);
      setIsModalOpen(true);
    };

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Saved Prompts</h2>
          <p className="text-muted-foreground">
            Create and manage reusable prompts for your MCP configurations
          </p>
        </div>

        {/* Prompts Grid */}
        {savedPrompts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first prompt to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPrompts.map((prompt) => (
              <Card
                key={prompt.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handlePromptClick(prompt.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg mt-2">{prompt.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3">
                    {prompt.content.substring(0, 150)}
                    {prompt.content.length > 150 && '...'}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        <PromptModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          promptId={selectedPromptId}
        />
      </div>
    );
  }
}
