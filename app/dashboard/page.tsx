"use client";

import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Activity, Zap, Edit, TestTube, Trash2, Star } from "lucide-react";
import Link from "next/link";
import { userMCPs, mockMCPs } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const recentMCPs = userMCPs;
  const communityMCPs = mockMCPs.slice(0, 3);

  const stats = [
    { icon: BarChart3, label: "Total MCPs", value: userMCPs.length, description: "Your integrations" },
    { icon: Activity, label: "API Calls", value: "1.2K", description: "This month" },
    { icon: Zap, label: "Active Integrations", value: userMCPs.filter(m => m.published).length, description: "Currently running" },
    { icon: BarChart3, label: "Community MCPs", value: mockMCPs.length, description: "Available to use" }
  ];

  const handleDelete = (mcpId: string, mcpName: string) => {
    toast({
      title: "MCP Deleted",
      description: `${mcpName} has been removed`
    });
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
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/80 mt-1">Welcome back! Here's an overview of your MCPs</p>
          </div>
          <Link href="/builder/new">
            <Button size="lg">
              Create New MCP
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-white/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent MCPs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Recent MCPs</h2>
          <div className="space-y-4">
            {recentMCPs.map((mcp) => (
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
                    <div className="flex gap-2">
                      <Link href={`/builder/${mcp.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/builder/${mcp.id}?tab=test`}>
                        <Button variant="outline" size="sm">
                          <TestTube className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                      </Link>
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
        </div>

        {/* Featured Community MCPs */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-white">Featured Community MCPs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {communityMCPs.map((mcp) => (
              <Card key={mcp.id} className="hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm border-white/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{mcp.emoji}</span>
                    {mcp.name}
                  </CardTitle>
                  <CardDescription>{mcp.description}</CardDescription>
                  <div className="text-sm text-muted-foreground mt-2">by @{mcp.author}</div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{mcp.stars}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({mcp.reviews} reviews)</span>
                  </div>
                  <Link href="/marketplace">
                    <Button className="w-full">Use This MCP</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}