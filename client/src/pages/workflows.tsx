import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { type Workflow, type Content, insertWorkflowSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Settings2, Clock, Calendar, BarChart3, CheckCircle2, Plus, Info, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

export default function WorkflowsPage() {
  const { toast } = useToast();
  
  const createForm = useForm<any>({
    resolver: zodResolver(insertWorkflowSchema),
    defaultValues: {
      name: "",
      contentType: "text",
      includeHashtags: true,
      cronSchedule: "0 9 * * *",
      enabled: true
    }
  });

  const { data: workflows, isLoading, error: workflowError } = useQuery<Workflow[]>({ 
    queryKey: ["workflows"],
    queryFn: async () => {
      if (!db || !auth?.currentUser) return [];
      console.log("Fetching workflows for user:", auth.currentUser.uid);
      const q = query(collection(db, "workflows"), where("userId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as any);
    }
  });

  const { data: content, error: contentError } = useQuery<Content[]>({ 
    queryKey: ["content"],
    queryFn: async () => {
      if (!db || !auth?.currentUser) return [];
      console.log("Fetching content for user:", auth.currentUser.uid);
      const q = query(collection(db, "content"), where("userId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as any);
    }
  });

  if (workflowError) {
    console.error("Workflow query error:", workflowError);
  }
  if (contentError) {
    console.error("Content query error:", contentError);
  }

  const pendingItems = content?.filter(c => c.status === "pending").length || 0;
  const growth = "+12%";

  const updateCronMutation = useMutation({
    mutationFn: async ({ id, cronSchedule }: { id: string | number; cronSchedule: string }) => {
      if (!db) return;
      await updateDoc(doc(db, "workflows", id as string), { cronSchedule });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setEditingId(null);
      toast({ title: "Schedule updated" });
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async (id: string | number) => {
      // Mock trigger
      await new Promise(r => setTimeout(r, 1000));
      return id;
    },
    onSuccess: () => {
      setIsTriggering(null);
      toast({ title: "Workflow triggered manually" });
    }
  });

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [cronValue, setCronValue] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState<string | number | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!db || !auth?.currentUser) throw new Error("Not authenticated");
      const docRef = await addDoc(collection(db, "workflows"), {
        ...data,
        userId: auth.currentUser.uid,
        status: "idle",
        createdAt: new Date().toISOString()
      });
      return { ...data, id: docRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setIsCreateOpen(false);
      createForm.reset();
      toast({ title: "Workflow created" });
    },
    onError: (error: any) => {
      console.error("Workflow creation error:", error);
      toast({ 
        title: "Creation failed", 
        description: error.message || "Could not save workflow to Firebase.",
        variant: "destructive"
      });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string | number; enabled: boolean }) => {
      if (!db) return;
      await updateDoc(doc(db, "workflows", id as string), { enabled });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflows"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      if (!db) return;
      await deleteDoc(doc(db, "workflows", id as string));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({ title: "Workflow removed" });
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
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-workflow" className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-950 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">New Content Workflow</DialogTitle>
              <CardDescription className="text-muted-foreground">Configure an automated schedule for content generation.</CardDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit((data: any) => createMutation.mutate(data))} className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Workflow Name</Label>
                <Input {...createForm.register("name")} placeholder="e.g. Daily Motivation Posts" className="bg-white border-muted-foreground/20 focus:bg-background transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Content Type</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-muted-foreground/20 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:bg-background transition-colors"
                    {...createForm.register("contentType")}
                  >
                    <option value="text">Text Only</option>
                    <option value="image">Image Only</option>
                    <option value="video">Video (Coming Soon)</option>
                    <option value="image_text">Image + Text</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch 
                    id="hashtags"
                    checked={createForm.watch("includeHashtags")}
                    onCheckedChange={(checked) => createForm.setValue("includeHashtags", checked)}
                  />
                  <Label htmlFor="hashtags" className="text-sm font-semibold">Relevant Hashtags</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Schedule (Posting Time)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-muted-foreground/20 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:bg-background transition-colors"
                  {...createForm.register("cronSchedule")}
                >
                  <option value="0 9 * * *">Every day at 9:00 AM</option>
                  <option value="0 12 * * *">Every day at 12:00 PM</option>
                  <option value="0 18 * * *">Every day at 6:00 PM</option>
                  <option value="0 21 * * *">Every day at 9:00 PM</option>
                  <option value="0 0 * * *">Every day at Midnight</option>
                </select>
                <p className="text-[10px] text-muted-foreground italic font-medium">Select a time for the automation to run daily.</p>
              </div>
              <DialogFooter className="pt-4 border-t border-muted/20">
                <Button type="submit" size="lg" className="w-full sm:w-auto font-bold" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Establish Workflow
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-primary/5 border-primary/20 hover-elevate transition-all cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-wider text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Approval Queue
                    <Info className="h-3 w-3 opacity-50 ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingItems as unknown as string}</div>
                  <p className="text-xs text-muted-foreground font-medium">Items waiting for review</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generated content items that require manual approval before posting.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-blue-500/5 border-blue-500/20 hover-elevate transition-all cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-wider text-blue-500">
                    <BarChart3 className="h-4 w-4" />
                    Engagement
                    <Info className="h-3 w-3 opacity-50 ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{growth as unknown as string}</div>
                  <p className="text-xs text-muted-foreground font-medium">Performance this week</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Weekly trend of interactions and reach across connected platforms.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
                onCheckedChange={(val) => toggleMutation.mutate({ id: workflow.id as unknown as string, enabled: val })}
                disabled={toggleMutation.isPending}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-dashed border-border/50">
                <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1 block">
                  Automated Schedule
                </Label>
                {editingId === (workflow.id as unknown as string) ? (
                  <div className="flex gap-2">
                    <select 
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={cronValue} 
                      onChange={(e) => setCronValue(e.target.value)}
                    >
                      <option value="0 9 * * *">9:00 AM Daily</option>
                      <option value="0 12 * * *">12:00 PM Daily</option>
                      <option value="0 18 * * *">6:00 PM Daily</option>
                      <option value="0 21 * * *">9:00 PM Daily</option>
                      <option value="0 0 * * *">Midnight Daily</option>
                    </select>
                    <Button 
                      size="sm" 
                      className="h-8"
                      onClick={() => updateCronMutation.mutate({ id: workflow.id as unknown as string, cronSchedule: cronValue })}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => {
                      setEditingId(workflow.id as unknown as string);
                      setCronValue(workflow.cronSchedule);
                    }}
                  >
                    <span className="text-xs text-primary font-bold">
                      {workflow.cronSchedule === "0 9 * * *" ? "9:00 AM Daily" :
                       workflow.cronSchedule === "0 12 * * *" ? "12:00 PM Daily" :
                       workflow.cronSchedule === "0 18 * * *" ? "6:00 PM Daily" :
                       workflow.cronSchedule === "0 21 * * *" ? "9:00 PM Daily" :
                       workflow.cronSchedule === "0 0 * * *" ? "Midnight Daily" :
                       workflow.cronSchedule}
                    </span>
                    <Clock className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-2 h-9 font-bold"
                  onClick={() => {
                    setEditingId(workflow.id as unknown as string);
                    setCronValue(workflow.cronSchedule);
                  }}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Edit Schedule
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1 gap-2 h-9 font-bold"
                  disabled={isTriggering === (workflow.id as unknown as string)}
                  onClick={() => {
                    setIsTriggering(workflow.id as unknown as string);
                    triggerMutation.mutate(workflow.id as unknown as string);
                  }}
                >
                  {isTriggering === (workflow.id as unknown as string) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Run Now
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-2 text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate(workflow.id as unknown as string)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
