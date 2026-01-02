import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type Workflow } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Settings2, Clock } from "lucide-react";

export default function WorkflowsPage() {
  const { toast } = useToast();
  const { data: workflows, isLoading } = useQuery<Workflow[]>({ queryKey: ["/api/workflows"] });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await apiRequest("POST", `/api/workflows/${id}/toggle`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow updated", description: "The workflow status has been changed." });
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
        <Button data-testid="button-new-workflow">
          Create New Workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows?.map((workflow) => (
          <Card key={workflow.id} className={workflow.enabled ? "" : "opacity-60"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Last run: {workflow.lastRun ? new Date(workflow.lastRun).toLocaleDateString() : "Never"}
                </CardDescription>
              </div>
              <Switch 
                checked={workflow.enabled} 
                onCheckedChange={(val) => toggleMutation.mutate({ id: workflow.id, enabled: val })}
                disabled={toggleMutation.isPending}
              />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Settings2 className="h-3 w-3" />
                  Edit
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 gap-1">
                  <Play className="h-3 w-3" />
                  Run Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!workflows || workflows.length === 0) && (
          <Card className="md:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No workflows found</h3>
              <p className="text-muted-foreground mb-4">Start by creating your first automation workflow.</p>
              <Button variant="outline">Create My First Workflow</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
