"use client";

import { useEffect, useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { LoadingScreen } from '@/components/builder-v6/LoadingScreen';
import { Header } from '@/components/builder-v6/Header';
import { TabBar } from '@/components/builder-v6/TabBar';
import { ToolsTab } from '@/components/builder-v6/ToolsTab';
import { PromptsTab } from '@/components/builder-v6/PromptsTab';
import { MCPsTab } from '@/components/builder-v6/MCPsTab';
import { ResponsesTab } from '@/components/builder-v6/ResponsesTab';
import { WorkflowTab } from '@/components/builder-v6/WorkflowTab';
import { Inspector } from '@/components/builder-v6/Inspector';
import { useToast } from '@/hooks/use-toast';

export default function BuilderV6Page() {
  const { toast } = useToast();
  const { currentTab, loadAllFromBackend, syncSaveWorkflow, isLoading: storeLoading, isSyncing } = useMCPBuilderStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Load data from backend on mount (with graceful fallback)
  useEffect(() => {
    const loadData = async () => {
      // Backend loading enabled - investigating route issues
      
      const ENABLE_BACKEND = true; // Enabled for debugging
      
      if (ENABLE_BACKEND) {
        try {
          await loadAllFromBackend();
          console.log('✅ Successfully loaded data from backend');
          toast({
            title: 'Connected',
            description: 'Data loaded from backend',
          });
        } catch (error) {
          console.warn('⚠️ Backend unavailable, using local data:', error);
          toast({
            title: 'Offline Mode',
            description: 'Using local data (backend unavailable)',
            variant: 'default'
          });
        }
      } else {
        console.log('📦 Using local data (backend disabled - requires HTTPS)');
        toast({
          title: 'Local Mode',
          description: 'Using mock data - backend requires HTTPS',
          variant: 'default'
        });
      }
      
      // Show loading screen for minimum duration
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    };
    
    loadData();
  }, []);

  // Save handler - saves workflow to backend
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await syncSaveWorkflow('My Workflow');
      toast({
        title: 'Saved',
        description: 'Your workflow has been saved to backend'
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save workflow to backend',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
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
        isSaving={isSaving || isSyncing}
      />

      {/* Tab Bar */}
      <TabBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - 280px */}
        <div className="w-[280px] border-r bg-background overflow-y-auto">
          {currentTab === 'tools' && <ToolsTab.Sidebar />}
          {currentTab === 'prompts' && <PromptsTab.Sidebar />}
          {currentTab === 'mcps' && <MCPsTab.Sidebar />}
          {currentTab === 'responses' && <ResponsesTab.Sidebar />}
          {currentTab === 'workflow' && <WorkflowTab.Sidebar />}
        </div>

        {/* Center Canvas - Flexible */}
        <div className="flex-1 bg-background overflow-y-auto">
          {currentTab === 'tools' && <ToolsTab.Canvas />}
          {currentTab === 'prompts' && <PromptsTab.Canvas />}
          {currentTab === 'mcps' && <MCPsTab.Canvas />}
          {currentTab === 'responses' && <ResponsesTab.Canvas />}
          {currentTab === 'workflow' && <WorkflowTab.Canvas />}
        </div>

        {/* Right Inspector - 400px (only for workflow tab) */}
        {currentTab === 'workflow' && (
          <div className="w-[400px] border-l bg-background overflow-y-auto">
            <Inspector />
          </div>
        )}
      </div>
    </div>
  );
}
