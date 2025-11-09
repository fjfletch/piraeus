"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Mock login
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in"
      });
      router.push("/dashboard");
    }, 1000);
  };

  const handleOAuthLogin = (provider: string) => {
    toast({
      title: `${provider} Login`,
      description: "OAuth integration coming soon..."
    });
  };

  const handleGuestMode = () => {
    toast({
      title: "Guest Mode",
      description: "Accessing as guest..."
    });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src="https://customer-assets.emergentagent.com/job_no-code-llm/artifacts/xbsi69r0_Screenshot_2025-11-08_at_10.53.35_PM-removebg-preview.png" 
            alt="Piraeus Logo" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <CardTitle className="text-2xl">Welcome to Piraeus</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-2 text-xs text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleOAuthLogin("Google")}
              disabled={loading}
            >
              Google
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleOAuthLogin("GitHub")}
              disabled={loading}
            >
              GitHub
            </Button>
          </div>

          <div className="text-center mt-6">
            <Link href="/auth/signup" className="text-primary hover:underline text-sm">
              Don't have an account? Sign up
            </Link>
          </div>

          <div className="text-center mt-4">
            <Button 
              variant="link" 
              className="text-sm"
              onClick={handleGuestMode}
            >
              Continue as Guest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}