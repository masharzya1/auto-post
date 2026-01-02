import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { loginWithGoogle } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

import Dashboard from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import WorkflowsPage from "@/pages/workflows";
import ContentPage from "@/pages/content";
import NotFound from "@/pages/not-found";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-2">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">AI Content Automator</CardTitle>
            <p className="text-muted-foreground">
              Your intelligent social media companion
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">1</div>
                <p>Generate high-quality niche content with AI</p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">2</div>
                <p>Schedule posts to Facebook and YouTube automatically</p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">3</div>
                <p>Monitor your AI usage and performance</p>
              </div>
            </div>
            <Button onClick={loginWithGoogle} className="w-full hover-elevate py-6 text-lg" size="lg" data-testid="button-login">
              Sign in with Google
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
              Powered by Replit AI & Firebase
            </p>
          </CardContent>
        </Card>
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
                <header className="flex items-center gap-2 p-2 border-b h-14 shrink-0 px-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="h-4 w-[1px] bg-border mx-2" />
                  <h2 className="text-sm font-semibold tracking-tight truncate">AI Content Automation</h2>
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
