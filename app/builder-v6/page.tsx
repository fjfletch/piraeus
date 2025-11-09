"use client";

import { useEffect, useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { LoadingScreen } from '@/components/builder-v6/LoadingScreen';
import { Header } from '@/components/builder-v6/Header';
import { TabBar } from '@/components/builder-v6/TabBar';
import { ToolsTab } from '@/components/builder-v6/ToolsTab';
import { useToast } from '@/hooks/use-toast';

export default function BuilderV6Page() {
  const { toast } = useToast();
  const { currentTab } = useMCPBuilderStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Initial loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Save handler
  const handleSave = () => {
    setIsSaving(true);
    // Simulate save operation
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Saved',
        description: 'Your project has been saved successfully'
      });
    }, 1000);
  };

  // Publish handler
  const handlePublish = () => {
    setIsPublishModalOpen(true);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <Header
        onSave={handleSave}
        onDeploy={handlePublish}
        isSaving={isSaving}
      />

      {/* Tab Bar */}
      <TabBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - 280px */}
        <div className="w-[280px] border-r bg-background overflow-y-auto">
          {currentTab === 'tools' && <ToolsTab.Sidebar />}
          {currentTab !== 'tools' && (
            <div className="p-4">
              <div className="text-sm text-muted-foreground">
                Sidebar for {currentTab}
              </div>
            </div>
          )}
        </div>

        {/* Center Canvas - Flexible */}
        <div className="flex-1 bg-background overflow-y-auto">
          {currentTab === 'tools' && <ToolsTab.Canvas />}
          {currentTab !== 'tools' && (
            <div className="p-6">
              <div className="text-2xl font-bold mb-2 capitalize">{currentTab}</div>
              <div className="text-muted-foreground">
                Canvas area for {currentTab} tab (content coming in next phases)
              </div>
            </div>
          )}
        </div>

        {/* Right Inspector - 400px (only for workflow tab) */}
        {currentTab === 'workflow' && (
          <div className="w-[400px] border-l bg-background overflow-y-auto">
            <div className="p-4">
              <div className="text-sm font-semibold mb-2">Inspector</div>
              <div className="text-sm text-muted-foreground">
                Workflow inspector panel
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
