"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, TestTube, Copy, Share2, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { userMCPs } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function MyMCPs() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [mcps, setMcps] = useState(userMCPs);

  const handleTest = (mcpId: string, mcpName: string) => {
    toast({
      title: "Opening Test Interface",
      description: `Loading test environment for ${mcpName}`
    });
  };

  const handleDuplicate = (mcpId: string, mcpName: string) => {
    toast({
      title: "MCP Duplicated",
      description: `Created a copy of ${mcpName}`
    });
  };

  const handleShare = (mcpName: string) => {
    toast({
      title: "Link Copied",
      description: `Share link for ${mcpName} copied to clipboard`
    });
  };

  const handleDelete = (mcpId: string, mcpName: string) => {
    if (confirm(`Are you sure you want to delete "${mcpName}"?`)) {
      setMcps(mcps.filter(m => m.id !== mcpId));
      toast({
        title: "MCP Deleted",
        description: `${mcpName} has been removed`
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const filteredMCPs = mcps.filter(mcp => {
    const matchesSearch = searchQuery === '' ||
      mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcp.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'published' && mcp.published) ||
      (filter === 'drafts' && !mcp.published);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Airbrush gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#033f63] via-[#28666e] to-[#7c9885]"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#b5b682] opacity-30 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-[#fedc97] opacity-40 blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#7c9885] opacity-20 blur-[150px]"></div>
      </div>
      
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My MCPs</h1>
            <p className="text-white/80 mt-1">Manage your MCP integrations</p>
          </div>
          <Link href="/builder/new">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create New MCP
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search your MCPs..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-white/30 bg-white/90 backdrop-blur-sm px-3 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All MCPs</option>
            <option value="published">Published</option>
            <option value="drafts">Drafts</option>
          </select>
        </div>

        {/* MCP List */}
        {filteredMCPs.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2 text-white">No MCPs found</h2>
            <p className="text-white/80 mb-4">
              {searchQuery ? "Try a different search term" : "Create your first MCP to get started"}
            </p>
            {!searchQuery && (
              <Link href="/builder/new">
                <Button>Create Your First MCP</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredMCPs.map((mcp) => (
              <Card key={mcp.id} className="hover:shadow-md transition-shadow bg-white/90 backdrop-blur-sm border-white/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle>{mcp.name}</CardTitle>
                        {mcp.published ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                      <CardDescription>{mcp.description}</CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <span>{mcp.apis.length} API(s)</span>
                        <span>•</span>
                        <span>{mcp.tools.length} Tool(s)</span>
                        <span>•</span>
                        <span>{mcp.uses} use(s)</span>
                        <span>•</span>
                        <span>Last edited {formatDate(mcp.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/builder/${mcp.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTest(mcp.id, mcp.name)}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDuplicate(mcp.id, mcp.name)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </Button>
                      {mcp.published && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleShare(mcp.name)}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(mcp.id, mcp.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}