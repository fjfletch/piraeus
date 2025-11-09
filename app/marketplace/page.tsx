"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";
import { mockMCPs } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { MCPDetailModal } from "@/components/modals/MCPDetailModal";

export default function Marketplace() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedMCPId, setSelectedMCPId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const categories = ["All", "E-commerce", "Travel", "Gaming", "Finance", "Communication", "DevOps"];

  const handleUseMCP = (mcpId: string, mcpName: string) => {
    toast({
      title: "Installing MCP",
      description: `Installing ${mcpName}...`
    });
    setTimeout(() => {
      toast({
        title: "MCP Installed",
        description: `${mcpName} has been added to your MCPs`
      });
    }, 1000);
  };

  const handlePreview = (mcpId: string, mcpName: string) => {
    setSelectedMCPId(mcpId);
    setIsDetailModalOpen(true);
  };

  const filteredMCPs = mockMCPs.filter(mcp => {
    const matchesSearch = searchQuery === '' ||
      mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    switch(sortBy) {
      case 'popular': return (b.uses || 0) - (a.uses || 0);
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'rating': return (b.stars || 0) - (a.stars || 0);
      case 'uses': return (b.uses || 0) - (a.uses || 0);
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Airbrush gradient background */}
      <div className="fixed inset-0 -z-10">
        <style jsx>{`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(30px, -20px); }
            50% { transform: translate(-20px, 30px); }
            75% { transform: translate(20px, 20px); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(-25px, 25px); }
            50% { transform: translate(30px, -15px); }
            75% { transform: translate(-15px, -25px); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(-50%, -50%); }
            25% { transform: translate(calc(-50% + 25px), calc(-50% - 30px)); }
            50% { transform: translate(calc(-50% - 30px), calc(-50% + 20px)); }
            75% { transform: translate(calc(-50% + 15px), calc(-50% + 25px)); }
          }
        `}</style>
        <div className="absolute inset-0 bg-gradient-to-br from-[#033f63] via-[#28666e] to-[#7c9885]"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#b5b682] opacity-30 blur-[120px]" style={{ animation: 'float1 25s ease-in-out infinite' }}></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-[#fedc97] opacity-40 blur-[100px]" style={{ animation: 'float2 30s ease-in-out infinite' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full bg-[#7c9885] opacity-20 blur-[150px]" style={{ animation: 'float3 35s ease-in-out infinite' }}></div>
      </div>
      
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">MCP Marketplace</h1>
          <p className="text-white/80 mt-1">Browse and download other user's MCPs</p>
        </div>

        {/* Search Bar with Sort */}
        <div className="mb-6 flex gap-4 items-center">
          {/* Sort Options */}
          <select
            className="h-10 rounded-md border border-white/30 bg-white/90 backdrop-blur-sm px-3 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
            <option value="uses">Most Used</option>
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search MCPs..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* MCP Grid */}
        {filteredMCPs.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <h2 className="text-xl font-semibold mb-2 text-white">No MCPs found</h2>
            <p className="text-white/80">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMCPs.map((mcp) => (
              <Card key={mcp.id} className="hover:shadow-2xl transition-shadow flex flex-col bg-white/90 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{mcp.emoji}</span>
                    {mcp.name}
                  </CardTitle>
                  <CardDescription>{mcp.description}</CardDescription>
                  <div className="text-sm text-muted-foreground mt-2">by @{mcp.author}</div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{mcp.stars}</span>
                      <span className="text-sm text-muted-foreground">({mcp.reviews})</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {((mcp.uses || 0) / 1000).toFixed(1)}k uses
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleUseMCP(mcp.id, mcp.name)}
                    >
                      Use
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handlePreview(mcp.id, mcp.name)}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MCP Detail Modal */}
      <MCPDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        mcpId={selectedMCPId}
        onUseMCP={handleUseMCP}
      />
    </div>
  );
}