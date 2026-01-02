import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Content, api } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText, Image as ImageIcon, Video, Eye, Send, Trash2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ContentPage() {
  const { toast } = useToast();
  const { data: content, isLoading } = useQuery<Content[]>({ queryKey: [api.content.list.path] });

  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", api.content.generate.path, { type });
      return res.json();
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: [api.content.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/limits"] });
      toast({ 
        title: "Content Created!", 
        description: `Successfully generated a new ${newItem.type} asset.`,
        className: "bg-primary text-primary-foreground border-none shadow-lg"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Generation Failed", 
        description: error.message || "An unexpected error occurred.",
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/content/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.content.list.path] });
      toast({ title: "Content removed from library" });
    },
  });

  const postMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/content/${id}/post`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Successfully posted!", description: "Your content is live on Facebook." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Posting failed", 
        description: error.message || "Check your Facebook settings.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text": return <FileText className="h-4 w-4" />;
      case "image": return <ImageIcon className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground font-medium">Manage and review your AI-generated digital assets.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="h-11 px-6 hover-elevate transition-all border-primary/20 bg-primary/5 text-primary font-bold"
            onClick={() => generateMutation.mutate("text")} 
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending && generateMutation.variables === "text" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            AI Caption
          </Button>
          <Button 
            className="h-11 px-6 hover-elevate shadow-lg font-bold"
            onClick={() => generateMutation.mutate("image")} 
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending && generateMutation.variables === "image" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            AI Image
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {content?.slice().reverse().map((item) => (
          <Card key={item.id} className="overflow-hidden border-border/50 hover-elevate group transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  {getTypeIcon(item.type)}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold capitalize">{item.type}</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                    ID: {item.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                  <Badge variant={item.status === "ready" ? "default" : "secondary"} className="text-[10px] h-5 capitalize">
                    {item.workflowId ? "Auto" : "Manual"} • {item.status}
                  </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="bg-muted/30 rounded-xl p-3 mb-4 aspect-video flex flex-col items-center justify-center text-center text-xs text-muted-foreground border border-border/50 relative overflow-hidden group/preview">
                {item.type === "image" && (item.data as any).url ? (
                  <img src={(item.data as any).url} alt="Generated" className="absolute inset-0 w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="p-4 font-medium leading-relaxed italic">
                    <p className="line-clamp-4">{(item.data as any).text || (item.data as any).prompt || "Processing AI visual..."}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 h-9 font-bold bg-background">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Inspect
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-white dark:bg-gray-950">
                    <DialogHeader>
                      <DialogTitle className="capitalize">{item.type} Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      {item.type === "image" && (item.data as any).url ? (
                        <div className="rounded-xl overflow-hidden border">
                          <img src={(item.data as any).url} alt="Generated" className="w-full h-auto" />
                        </div>
                      ) : (
                        <div className="p-6 rounded-xl bg-muted/30 border text-sm leading-relaxed whitespace-pre-wrap">
                          {(item.data as any).text || (item.data as any).prompt}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 rounded-lg bg-muted/20">
                          <p className="text-muted-foreground mb-1 uppercase tracking-wider font-bold">Status</p>
                          <p className="font-semibold capitalize">{item.status}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20">
                          <p className="text-muted-foreground mb-1 uppercase tracking-wider font-bold">Created At</p>
                          <p className="font-semibold">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 h-9 font-bold shadow-sm" 
                  disabled={item.status !== "ready" || postMutation.isPending}
                  onClick={() => postMutation.mutate(item.id)}
                >
                  {postMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Deploy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!content || content.length === 0) && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-24 bg-accent/30 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center gap-4">
            <div className="p-4 bg-background rounded-full shadow-sm">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground">Digital Assets Empty</p>
              <p className="text-xs text-muted-foreground/60">Generate your first AI asset to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
