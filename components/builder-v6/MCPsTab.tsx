"use client";

import { useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Plus, Upload as UploadIcon, CheckCircle2, Loader2, AlertCircle, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MCPConfigModal } from './MCPConfigModal';
import { DeploymentProgressModal } from './DeploymentProgressModal';
import { MarketplacePickerModal } from './MarketplacePickerModal';

export namespace MCPsTab {
  export function Sidebar() {
    const { toast } = useToast();
    const { savedMCPConfigs, importMCPConfigs, updateMCPDeploymentStatus } = useMCPBuilderStore();
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
    const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
    const [deployingConfigId, setDeployingConfigId] = useState<number | null>(null);

    const handleConfigClick = (configId: number) => {
      setSelectedConfigId(configId);
      setIsModalOpen(true);
    };

    const handleAddConfig = () => {
      setSelectedConfigId(null);
      setIsModalOpen(true);
    };

    const handleDeploy = (configId: number) => {
      const config = savedMCPConfigs.find(c => c.id === configId);
      if (!config) return;

      setDeployingConfigId(configId);
      updateMCPDeploymentStatus(configId, 'deploying');
      setIsDeploymentModalOpen(true);
    };

    const handleDeploymentComplete = () => {
      if (deployingConfigId !== null) {
        const url = `https://mcp-server.example.com/mcp/${deployingConfigId}`;
        updateMCPDeploymentStatus(deployingConfigId, 'deployed', url);
        toast({
          title: 'Deployment Complete',
          description: 'Your MCP is now live and ready to use',
        });
      }
      setIsDeploymentModalOpen(false);
      setDeployingConfigId(null);
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const configs = Array.isArray(data) ? data : [data];
          
          const validConfigs = configs.filter(
            (c: any) => c.name && c.model && Array.isArray(c.selectedTools)
          );
          
          if (validConfigs.length === 0) {
            toast({
              title: 'Invalid Format',
              description: 'No valid MCP configurations found',
              variant: 'destructive',
            });
          } else {
            importMCPConfigs(validConfigs);
            toast({
              title: 'Import Successful',
              description: `Imported ${validConfigs.length} MCP configuration(s)`,
            });
          }
        } catch (error) {
          toast({
            title: 'Import Failed',
            description: 'Failed to parse JSON file',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
    };

    const getStatusIcon = (status?: string) => {
      switch (status) {
        case 'deployed':
          return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
        case 'deploying':
          return <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />;
        case 'failed':
          return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
        default:
          return null;
      }
    };

    const getStatusText = (status?: string) => {
      switch (status) {
        case 'deployed':
          return 'Deployed';
        case 'deploying':
          return 'Deploying';
        case 'failed':
          return 'Failed';
        default:
          return 'Not deployed';
      }
    };

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-3">
            MCP Configurations ({savedMCPConfigs.length})
          </h3>
          <div className="space-y-2">
            <Button onClick={handleAddConfig} className="w-full justify-start" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create new MCP
            </Button>
            <Button
              onClick={() => setIsMarketplaceOpen(true)}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <Bot className="h-4 w-4 mr-2" />
              From Marketplace
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="absolute inset-0 opacity-0 cursor-pointer"
                id="import-mcp-json"
              />
              <Button
                variant="outline"
                className="w-full justify-start pointer-events-none"
                size="sm"
                asChild
              >
                <label htmlFor="import-mcp-json" className="pointer-events-auto cursor-pointer">
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Import MCPs
                </label>
              </Button>
            </div>
          </div>
        </div>

        {/* MCP List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {savedMCPConfigs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No MCP configurations yet
            </div>
          ) : (
            savedMCPConfigs.map((config) => (
              <div
                key={config.id}
                onClick={() => handleConfigClick(config.id)}
                className="p-3 bg-card border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Bot className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{config.name}</span>
                      {getStatusIcon(config.deploymentStatus)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getStatusText(config.deploymentStatus)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modals */}
        <MCPConfigModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          configId={selectedConfigId}
          onDeploy={handleDeploy}
        />
        <MarketplacePickerModal
          open={isMarketplaceOpen}
          onOpenChange={setIsMarketplaceOpen}
          onSelect={() => {}}
        />
        <DeploymentProgressModal
          open={isDeploymentModalOpen}
          onOpenChange={setIsDeploymentModalOpen}
          mcpName={
            deployingConfigId !== null
              ? savedMCPConfigs.find(c => c.id === deployingConfigId)?.name || ''
              : ''
          }
          onComplete={handleDeploymentComplete}
        />
      </div>
    );
  }

  export function Canvas() {
    const { savedMCPConfigs, updateMCPDeploymentStatus } = useMCPBuilderStore();
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
    const [deployingConfigId, setDeployingConfigId] = useState<number | null>(null);
    const { toast } = useToast();

    const handleConfigClick = (configId: number) => {
      setSelectedConfigId(configId);
      setIsModalOpen(true);
    };

    const handleDeploy = (configId: number) => {
      const config = savedMCPConfigs.find(c => c.id === configId);
      if (!config) return;

      setDeployingConfigId(configId);
      updateMCPDeploymentStatus(configId, 'deploying');
      setIsDeploymentModalOpen(true);
    };

    const handleDeploymentComplete = () => {
      if (deployingConfigId !== null) {
        const url = `https://mcp-server.example.com/mcp/${deployingConfigId}`;
        updateMCPDeploymentStatus(deployingConfigId, 'deployed', url);
        toast({
          title: 'Deployment Complete',
          description: 'Your MCP is now live and ready to use',
        });
      }
      setIsDeploymentModalOpen(false);
      setDeployingConfigId(null);
    };

    const formatTimeAgo = (isoString?: string) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const getStatusBadge = (status?: string) => {
      switch (status) {
        case 'deployed':
          return <Badge className="bg-green-600 dark:bg-green-700">Deployed</Badge>;
        case 'deploying':
          return <Badge className="bg-blue-600 dark:bg-blue-700">Deploying</Badge>;
        case 'failed':
          return <Badge variant="destructive">Failed</Badge>;
        default:
          return <Badge variant="outline">Not Deployed</Badge>;
      }
    };

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">MCP Configurations</h2>
          <p className="text-muted-foreground">
            Configure and deploy Model Context Protocol integrations
          </p>
        </div>

        {/* MCPs Grid */}
        {savedMCPConfigs.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No MCP configurations yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first MCP configuration to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedMCPConfigs.map((config) => (
              <Card key={config.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Bot className="h-5 w-5 text-primary" />
                    {getStatusBadge(config.deploymentStatus)}
                  </div>
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{config.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tools:</span>
                      <span className="font-medium">{config.selectedTools.length}</span>
                    </div>
                    {config.deploymentUrl && (
                      <div className="text-xs text-muted-foreground truncate">
                        {config.deploymentUrl}
                      </div>
                    )}
                    {config.deployedAt && (
                      <div className="text-xs text-muted-foreground">
                        Deployed: {formatTimeAgo(config.deployedAt)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConfigClick(config.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeploy(config.id)}
                      size="sm"
                      className="flex-1"
                    >
                      {config.deploymentStatus === 'deployed' ? (
                        <>
                          <Rocket className="h-4 w-4 mr-1" />
                          Redeploy
                        </>
                      ) : (
                        'Deploy'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modals */}
        <MCPConfigModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          configId={selectedConfigId}
          onDeploy={handleDeploy}
        />
        <DeploymentProgressModal
          open={isDeploymentModalOpen}
          onOpenChange={setIsDeploymentModalOpen}
          mcpName={
            deployingConfigId !== null
              ? savedMCPConfigs.find(c => c.id === deployingConfigId)?.name || ''
              : ''
          }
          onComplete={handleDeploymentComplete}
        />
      </div>
    );
  }
}
