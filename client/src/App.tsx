import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { loginWithGoogle } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Rocket, Cpu, Globe } from "lucide-react";
import { useState } from "react";

import Dashboard from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import WorkflowsPage from "@/pages/workflows";
import ContentPage from "@/pages/content";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading || isSigningIn) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          {isSigningIn ? "Securely signing you in..." : "Initializing Platform..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/5 via-primary to-primary/5" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <Card className="w-full max-w-[440px] shadow-2xl border-border/50 relative z-10 overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pt-12 pb-8">
            <div className="mx-auto bg-primary/15 p-4 rounded-2xl w-fit mb-2 animate-in fade-in zoom-in duration-700">
              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-4xl font-black tracking-tighter text-foreground">
                SPARKPOST AI
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
                Sparking Social Impact
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col gap-8 pt-0 px-8 pb-10">
            <div className="space-y-5 text-sm">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-accent/50 border border-border/50 transition-all hover:bg-accent hover:border-primary/20 group">
                <div className="p-2 rounded-lg bg-background group-hover:scale-110 transition-transform">
                  <Cpu className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold leading-none">AI Asset Engine</p>
                  <p className="text-muted-foreground/80 text-xs">Generate pro-grade captions & images</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-accent/50 border border-border/50 transition-all hover:bg-accent hover:border-primary/20 group">
                <div className="p-2 rounded-lg bg-background group-hover:scale-110 transition-transform">
                  <Rocket className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold leading-none">Auto-Pilot Posting</p>
                  <p className="text-muted-foreground/80 text-xs">Set daily schedules for hands-free reach</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-accent/50 border border-border/50 transition-all hover:bg-accent hover:border-primary/20 group">
                <div className="p-2 rounded-lg bg-background group-hover:scale-110 transition-transform">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold leading-none">Smart Analytics</p>
                  <p className="text-muted-foreground/80 text-xs">Monitor engagement & usage growth</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full h-14 text-lg font-bold hover-elevate shadow-xl transition-all active-elevate-2 rounded-xl group relative overflow-hidden" 
              data-testid="button-login"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>

        {/* Brand Footer */}
        <div className="mt-8 text-center space-y-1 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Built by MAHDY ABRAR SHARZY
          </p>
          <div className="h-0.5 w-12 bg-primary/20 mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/5 via-primary to-primary/5" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <Card className="w-full max-w-[440px] shadow-2xl border-border/50 relative z-10 overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pt-12 pb-8">
            <div className="mx-auto bg-primary/15 p-4 rounded-2xl w-fit mb-2 animate-in fade-in zoom-in duration-700">
              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-4xl font-black tracking-tighter text-foreground">
                SPARKPOST AI
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
                Sparking Social Impact
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col gap-8 pt-0 px-8 pb-10">
            <div className="space-y-5 text-sm">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-accent/50 border border-border/50 transition-all hover:bg-accent hover:border-primary/20 group">
                <div className="p-2 rounded-lg bg-background group-hover:scale-110 transition-transform">
                  <Cpu className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold leading-none">AI Asset Engine</p>
                  <p className="text-muted-foreground/80 text-xs">Generate pro-grade captions & images</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-accent/50 border border-border/50 transition-all hover:bg-accent hover:border-primary/20 group">
                <div className="p-2 rounded-lg bg-background group-hover:scale-110 transition-transform">
                  <Rocket className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold leading-none">Auto-Pilot Posting</p>
                  <p className="text-muted-foreground/80 text-xs">Set daily schedules for hands-free reach</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-accent/50 border border-border/50 transition-all hover:bg-accent hover:border-primary/20 group">
                <div className="p-2 rounded-lg bg-background group-hover:scale-110 transition-transform">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold leading-none">Smart Analytics</p>
                  <p className="text-muted-foreground/80 text-xs">Monitor engagement & usage growth</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full h-14 text-lg font-bold hover-elevate shadow-xl transition-all active-elevate-2 rounded-xl group relative overflow-hidden" 
              data-testid="button-login"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>

        {/* Brand Footer */}
        <div className="mt-8 text-center space-y-1 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Built by MAHDY ABRAR SHARZY
          </p>
          <div className="h-0.5 w-12 bg-primary/20 mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/workflows" component={WorkflowsPage} />
      <Route path="/content" component={ContentPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthGuard>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full overflow-hidden">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center gap-2 p-2 border-b h-14 shrink-0 px-4 bg-background/50 backdrop-blur">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="h-4 w-[1px] bg-border mx-2" />
                  <h2 className="text-sm font-semibold tracking-tight truncate">SparkPost AI Automation</h2>
                </header>
                <main className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-zinc-950/30">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
        </AuthGuard>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
