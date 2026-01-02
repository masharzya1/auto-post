import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Content } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText, Image as ImageIcon, Video, Eye, Send, Trash2 } from "lucide-react";

export default function ContentPage() {
  const { toast } = useToast();
  const { data: content, isLoading } = useQuery<Content[]>({ queryKey: ["/api/content"] });

  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", "/api/content/generate", { type });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ title: "Generation started", description: "AI is crafting your content now." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/content/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ title: "Content deleted" });
    },
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">Manage and review your AI-generated assets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateMutation.mutate("text")} disabled={generateMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Text
          </Button>
          <Button variant="outline" onClick={() => generateMutation.mutate("image")} disabled={generateMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Image
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content?.map((item) => (
          <Card key={item.id} className="overflow-hidden hover-elevate group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  {getTypeIcon(item.type)}
                </div>
                <CardTitle className="text-sm font-medium capitalize">{item.type}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  item.status === "ready" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {item.status}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="bg-muted/30 rounded-md p-3 mb-3 aspect-video flex flex-col items-center justify-center text-center text-xs text-muted-foreground border relative overflow-hidden">
                {item.type === "image" && (item.data as any).url ? (
                  <img src={(item.data as any).url} alt="Generated" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="p-4">
                    <p className="line-clamp-3">{(item.data as any).prompt || (item.data as any).text || "No preview available"}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button variant="primary" size="sm" className="flex-1 gap-1" disabled={item.status !== "ready"}>
                  <Send className="h-3 w-3" />
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!content || content.length === 0) && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
            <p className="text-muted-foreground">No content items generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
