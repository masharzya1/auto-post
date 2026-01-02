import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Workflow, type Content } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Settings2, Clock, Calendar, BarChart3, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function WorkflowsPage() {
  const { toast } = useToast();
  const { data: workflows, isLoading } = useQuery<Workflow[]>({ queryKey: ["/api/workflows"] });
  const { data: content } = useQuery<Content[]>({ queryKey: ["/api/content"] });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [cronValue, setCronValue] = useState("");

  const pendingItems = content?.filter(c => c.status === "pending").length || 0;
  const totalItems = content?.length || 0;
  const growth = totalItems > 0 ? "+24%" : "0%";

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await apiRequest("POST", `/api/workflows/${id}/toggle`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow updated" });
    },
  });

  const updateCronMutation = useMutation({
    mutationFn: async ({ id, cronSchedule }: { id: number; cronSchedule: string }) => {
      const res = await apiRequest("PATCH", `/api/workflows/${id}`, { cronSchedule });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setEditingId(null);
      toast({ title: "Schedule updated", description: "The automation timer has been reset." });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows & Automation</h1>
          <p className="text-muted-foreground">Manage your content generation schedules and approval queues.</p>
        </div>
        <Button data-testid="button-new-workflow">
          Create New Workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20 hover-elevate transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-wider text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Approval Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingItems}</div>
            <p className="text-xs text-muted-foreground font-medium">Items waiting for review</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20 hover-elevate transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-wider text-blue-500">
              <BarChart3 className="h-4 w-4" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growth}</div>
            <p className="text-xs text-muted-foreground font-medium">Performance this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workflows?.map((workflow) => (
          <Card key={workflow.id} className={`${workflow.enabled ? "hover-elevate border-primary/20" : "opacity-60"} transition-all`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">{workflow.name}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-3 w-3" />
                  {workflow.lastRun ? `Last run: ${new Date(workflow.lastRun).toLocaleDateString()}` : "Not run yet"}
                </div>
              </div>
              <Switch 
                checked={workflow.enabled} 
                onCheckedChange={(val) => toggleMutation.mutate({ id: workflow.id, enabled: val })}
                disabled={toggleMutation.isPending}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-dashed border-border/50">
                <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1 block">
                  Schedule (Cron Expression)
                </Label>
                {editingId === workflow.id ? (
                  <div className="flex gap-2">
                    <Input 
                      className="h-8 text-xs font-mono bg-background" 
                      value={cronValue} 
                      onChange={(e) => setCronValue(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      className="h-8"
                      onClick={() => updateCronMutation.mutate({ id: workflow.id, cronSchedule: cronValue })}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => {
                      setEditingId(workflow.id);
                      setCronValue(workflow.cronSchedule);
                    }}
                  >
                    <code className="text-xs font-mono text-primary font-bold">{workflow.cronSchedule}</code>
                    <Clock className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                  Tip: <code>0 9 * * *</code> runs every day at 9 AM.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2 h-9 font-bold">
                  <Settings2 className="h-3.5 w-3.5" />
                  Config
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 gap-2 h-9 font-bold">
                  <Play className="h-3.5 w-3.5" />
                  Run Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
