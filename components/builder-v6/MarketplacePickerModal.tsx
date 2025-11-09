"use client";

import { useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { MarketplaceMCP } from '@/types/builder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Search, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarketplacePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mcp: MarketplaceMCP) => void;
}

// Mock marketplace MCPs
const marketplaceMCPs: MarketplaceMCP[] = [
  {
    id: 'mcp-1',
    name: '🎮 Riftbound Tournament API',
    description: 'Access real-time tournament data, player stats, and match results from the Riftbound gaming platform',
    author: 'riftbound_dev',
    rating: 4.8,
    reviews: 124,
    uses: 5600,
    category: 'Gaming',
  },
  {
    id: 'mcp-2',
    name: '🛍️ Shopify Product Manager',
    description: 'Manage products, inventory, and orders across your Shopify stores with ease',
    author: 'ecommerce_pro',
    rating: 4.9,
    reviews: 342,
    uses: 12300,
    category: 'E-commerce',
  },
  {
    id: 'mcp-3',
    name: '✈️ Travel Planning Assistant',
    description: 'Search flights, hotels, and create comprehensive travel itineraries',
    author: 'travel_tech',
    rating: 4.7,
    reviews: 89,
    uses: 3200,
    category: 'Travel',
  },
  {
    id: 'mcp-4',
    name: '📊 Financial Data Analyzer',
    description: 'Fetch and analyze stock market data, crypto prices, and financial indicators',
    author: 'fin_data',
    rating: 4.6,
    reviews: 156,
    uses: 7800,
    category: 'Finance',
  },
  {
    id: 'mcp-5',
    name: '📧 Email Campaign Manager',
    description: 'Create, schedule, and track email marketing campaigns with advanced analytics',
    author: 'marketing_hub',
    rating: 4.8,
    reviews: 234,
    uses: 9400,
    category: 'Marketing',
  },
  {
    id: 'mcp-6',
    name: '🏥 Healthcare Record Access',
    description: 'Secure access to patient records and medical data (HIPAA compliant)',
    author: 'health_tech',
    rating: 4.9,
    reviews: 67,
    uses: 2100,
    category: 'Healthcare',
  },
  {
    id: 'mcp-7',
    name: '🏠 Real Estate Listings',
    description: 'Search properties, compare prices, and access neighborhood data',
    author: 'realty_api',
    rating: 4.5,
    reviews: 98,
    uses: 4500,
    category: 'Real Estate',
  },
  {
    id: 'mcp-8',
    name: '🎓 Learning Management System',
    description: 'Manage courses, students, and track educational progress',
    author: 'edu_platform',
    rating: 4.7,
    reviews: 145,
    uses: 6200,
    category: 'Education',
  },
];

export function MarketplacePickerModal({
  open,
  onOpenChange,
  onSelect,
}: MarketplacePickerModalProps) {
  const { toast } = useToast();
  const { addMCPConfig } = useMCPBuilderStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMCPs = marketplaceMCPs.filter((mcp) => {
    const query = searchQuery.toLowerCase();
    return (
      mcp.name.toLowerCase().includes(query) ||
      mcp.description.toLowerCase().includes(query) ||
      mcp.author.toLowerCase().includes(query) ||
      mcp.category?.toLowerCase().includes(query)
    );
  });

  const handleSelect = (mcp: MarketplaceMCP) => {
    // Create a new MCP config from marketplace MCP
    const newConfig = {
      name: mcp.name,
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
      systemPrompt: '',
      instruction: `This MCP provides ${mcp.description.toLowerCase()}`,
      selectedTools: [],
      deploymentStatus: 'not-deployed' as const,
    };

    addMCPConfig(newConfig);
    toast({
      title: 'MCP Added',
      description: `${mcp.name} has been added to your configurations`,
    });
    onSelect(mcp);
    onOpenChange(false);
  };

  const formatUses = (uses: number) => {
    if (uses >= 1000) {
      return `${(uses / 1000).toFixed(1)}k`;
    }
    return uses.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Browse Marketplace</DialogTitle>
          <DialogDescription>
            Select an MCP from the marketplace to add to your project
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MCPs by name, description, author, or category..."
            className="pl-10"
          />
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredMCPs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No MCPs found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
              {filteredMCPs.map((mcp) => (
                <Card key={mcp.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-1">{mcp.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {mcp.description}
                        </CardDescription>
                      </div>
                      <Bot className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">by @{mcp.author}</span>
                      {mcp.category && (
                        <Badge variant="outline">{mcp.category}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{mcp.rating}</span>
                          <span className="text-muted-foreground">({mcp.reviews})</span>
                        </div>
                      </div>
                      <span className="text-muted-foreground">
                        {formatUses(mcp.uses)} uses
                      </span>
                    </div>
                    <Button
                      onClick={() => handleSelect(mcp)}
                      className="w-full"
                      size="sm"
                    >
                      Select
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
