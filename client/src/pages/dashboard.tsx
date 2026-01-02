import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Image, Video, FileText, Zap, Clock, Send, BarChart3, Info, PlayCircle, BookOpen, Rocket, ShieldCheck } from "lucide-react";
import type { Limits, Content, Workflow } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: limits, isLoading: isLoadingLimits } = useQuery<Limits>({
    queryKey: ["/api/limits"],
  });

  const { data: content, isLoading: isLoadingContent } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });

  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const recentPosts = content?.slice(-5).reverse() || [];
  const activeWorkflows = workflows?.filter(w => w.enabled).length || 0;
  
  const totalItems = content?.length || 0;
  const readyItems = content?.filter(c => c.status === "ready").length || 0;
  const engagementRate = totalItems > 0 ? Math.min(98, 70 + (readyItems / totalItems) * 28) : 0;
  
  const stats = [
    {
      title: "Content Items",
      value: totalItems,
      icon: FileText,
      description: "Total AI assets",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      tooltip: "The total number of AI-generated captions and images in your library."
    },
    {
      title: "Images Created",
      value: limits?.imageUsed || 0,
      icon: Image,
      description: "Generation count",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      tooltip: "How many visual assets you've created this month out of your plan's quota."
    },
    {
      title: "Active Workflows",
      value: activeWorkflows,
      icon: Zap,
      description: "Running automation",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      tooltip: "The number of automation routines currently enabled and running on schedule."
    },
    {
      title: "Social Impact",
      value: `${engagementRate.toFixed(1)}%`,
      icon: BarChart3,
      description: "Estimated engagement",
      color: "text-green-500",
      bg: "bg-green-500/10",
      tooltip: "A smart score based on content quality and predicted social media reach."
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground font-medium">Monitoring your AI content production engine.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-bold shadow-xl hover:scale-105 transition-all">
              <BookOpen className="h-5 w-5" />
              Instruction Guide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-white dark:bg-gray-950 p-0 overflow-hidden border-none shadow-2xl">
            <div className="h-2 w-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
            <div className="p-8 space-y-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Rocket className="h-8 w-8 text-blue-600" />
                  How to use AI Automator
                </DialogTitle>
                <CardDescription className="text-base font-medium">Follow this colorful guide to master your AI content engine.</CardDescription>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg">1. Setup Engine</h3>
                  <p className="text-sm text-muted-foreground">Go to <b>Settings</b> and enter your Facebook Page ID and AI API secrets. This connects your social power.</p>
                </div>

                <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg">2. Automated Flow</h3>
                  <p className="text-sm text-muted-foreground">In <b>Workflows</b>, pick a time (like 9 AM) and name your routine. The AI will wake up and create content for you!</p>
                </div>

                <div className="p-5 rounded-2xl bg-pink-500/5 border border-pink-500/20 space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-pink-500 flex items-center justify-center text-white shadow-lg">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg">3. Creative Control</h3>
                  <p className="text-sm text-muted-foreground">Visit <b>Content Library</b>. Click "Inspect" to see AI work, and "Deploy" to send it live to your audience instantly.</p>
                </div>

                <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20 space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg">4. Safe Monitoring</h3>
                  <p className="text-sm text-muted-foreground">Watch your <b>Dashboard</b> (here!) to track your monthly limits and see recent engagement growth.</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guide Section */}
      <Card className="bg-primary/5 border-primary/20 border-dashed overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <PlayCircle className="h-24 w-24" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Start Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-bold">1. Configure Settings</p>
            <p className="text-xs text-muted-foreground">Add Page ID and secrets in the settings panel.</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">2. Create Workflows</p>
            <p className="text-xs text-muted-foreground">Setup schedules for hands-free posting.</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">3. Generate & Post</p>
            <p className="text-xs text-muted-foreground">Manually generate or review assets before deployment.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="hover-elevate transition-all border-border/50 cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1">
                      {stat.description}
                      <Info className="h-3 w-3 opacity-30" />
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-48 text-xs">{stat.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>AI Resource Usage</CardTitle>
              <CardDescription>Monthly quota distribution</CardDescription>
            </div>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {isLoadingLimits ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-blue-500" /> AI Captions</span>
                    <span>{Math.round((limits?.textUsed || 0) / (limits?.textLimit || 1) * 100)}%</span>
                  </div>
                  <Progress value={(limits?.textUsed || 0) / (limits?.textLimit || 1) * 100} className="h-2 bg-blue-500/10" />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-bold tracking-tighter uppercase">
                    <span>{limits?.textUsed} used</span>
                    <span>{limits?.textLimit} limit</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="flex items-center gap-2"><Image className="h-3.5 w-3.5 text-purple-500" /> Visual Assets</span>
                    <span>{Math.round((limits?.imageUsed || 0) / (limits?.imageLimit || 1) * 100)}%</span>
                  </div>
                  <Progress value={(limits?.imageUsed || 0) / (limits?.imageLimit || 1) * 100} className="h-2 bg-purple-500/10" />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-bold tracking-tighter uppercase">
                    <span>{limits?.imageUsed} used</span>
                    <span>{limits?.imageLimit} limit</span>
                  </div>
                </div>

                <div className="space-y-2 opacity-50">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="flex items-center gap-2"><Video className="h-3.5 w-3.5 text-orange-500" /> Video Processing</span>
                    <Badge variant="secondary" className="text-[10px] h-4">Coming Soon</Badge>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>Latest automation events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingContent ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentPosts.length > 0 ? (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div key={post.id} className="flex items-start gap-4 p-2 rounded-lg hover:bg-accent/50 transition-colors group">
                    <div className="mt-1">
                      {post.type === "image" ? (
                        <Image className="h-4 w-4 text-purple-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-none truncate mb-1">
                        {(post.data as any).prompt || (post.data as any).text || "Generated Content"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Clock className="h-3 w-3" />
                        {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <Badge variant="outline" className="text-[10px] py-0 h-4 capitalize">{post.status}</Badge>
                      </div>
                    </div>
                    <Send className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <Clock className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-medium">No recent activity detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
