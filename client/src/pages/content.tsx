import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Content } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText, Image as ImageIcon, Video, Eye, Send, Trash2, Sparkles, Edit2, Save, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { type Settings } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ContentPage() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");
  
  const { data: content, isLoading } = useQuery<Content[]>({ 
    queryKey: ["content"],
    queryFn: async () => {
      if (!db || !auth?.currentUser) return [];
      const q = query(collection(db, "content"), where("userId", "==", auth.currentUser.uid));
      return new Promise<Content[]>((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (snap) => {
          resolve(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as any));
        }, reject);
      });
    }
  });

  useEffect(() => {
    if (!db || !auth?.currentUser) return;
    const q = query(collection(db, "content"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as any);
      queryClient.setQueryData(["content"], data);
    });
    return () => unsubscribe();
  }, [auth?.currentUser?.uid]);

  const { data: settings } = useQuery<Settings | null>({ 
    queryKey: ["settings"],
    queryFn: async () => {
      if (!db || !auth?.currentUser) return null;
      const docRef = doc(db, "settings", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as Settings : null;
    }
  });

  // Check if user has necessary API keys configured
  const hasOpenAIKey = settings?.openaiApiKey && settings.openaiApiKey.length > 0;
  const hasClaudeKey = settings?.claudeApiKey && settings.claudeApiKey.length > 0;
  const hasGeminiKey = settings?.geminiApiKey && settings.geminiApiKey.length > 0;
  const hasAnyKey = hasOpenAIKey || hasClaudeKey || hasGeminiKey;

  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      if (!db || !auth?.currentUser) throw new Error("Not authenticated");
      
      const niche = settings?.niche || "General";
      
      // Determine which model and provider to use
      let model, provider, apiKey;
      
      if (type === "text") {
        model = settings?.captionModel || "gpt-4o-mini";
        // Determine provider from model name
        if (model.includes("gpt")) {
          provider = "openai";
          apiKey = settings?.openaiApiKey;
        } else if (model.includes("claude")) {
          provider = "anthropic";
          apiKey = settings?.claudeApiKey;
        } else if (model.includes("gemini")) {
          provider = "google";
          apiKey = settings?.geminiApiKey;
        }
      } else if (type === "image") {
        model = settings?.photoModel || "gpt-image-1";
        provider = "openai"; // Images only support OpenAI for now
        apiKey = settings?.openaiApiKey;
      }

      // Validate API key exists
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error(`${provider?.toUpperCase()} API Key is required. Please add it in Settings.`);
      }

      // Try to generate content
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, niche, model, provider, apiKey })
      });

      if (!response.ok) {
        const error = await response.json();
        
        // More helpful error messages
        if (error.error?.includes("quota") || error.error?.includes("429")) {
          throw new Error(`Your ${provider?.toUpperCase()} API key has no credits. Please add credits to your account or try a different provider.`);
        } else if (error.error?.includes("401") || error.error?.includes("invalid")) {
          throw new Error(`Invalid ${provider?.toUpperCase()} API key. Please check your key in Settings.`);
        }
        
        throw new Error(error.error || "Generation failed");
      }

      const data = await response.json();
      
      // Save to Firebase
      const docRef = await addDoc(collection(db, "content"), {
        type,
        userId: auth.currentUser.uid,
        data,
        status: "ready",
        createdAt: new Date().toISOString()
      });
      
      return { id: docRef.id, type };
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ 
        title: "✨ Content Created!", 
        description: `Generated using ${settings?.niche || "General"} niche.` 
      });
    },
    onError: (error: any) => {
      console.error("Generation error:", error);
      toast({ 
        title: "❌ Generation Failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      if (!db) return;
      const contentDoc = await getDoc(doc(db, "content", id));
      const currentData = contentDoc.data();
      await updateDoc(doc(db, "content", id), { 
        data: { ...currentData?.data, text } 
      });
    },
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ title: "✏️ Content updated!" });
    },
  });

  const postMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!db || !auth?.currentUser) throw new Error("Not authenticated");
      
      const contentDoc = await getDoc(doc(db, "content", id));
      const contentData = contentDoc.data();
      
      if (!contentData) throw new Error("Content not found");
      
      const settingsDoc = await getDoc(doc(db, "settings", auth.currentUser.uid));
      const settingsData = settingsDoc.data();
      
      if (!settingsData?.fbPageId || !settingsData?.fbAccessToken) {
        throw new Error("Facebook Page ID and Access Token required in Settings");
      }

      const response = await fetch("/api/facebook-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: settingsData.fbPageId,
          accessToken: settingsData.fbAccessToken,
          message: contentData.data.text,
          imageUrl: contentData.data.url,
          hashtags: contentData.data.hashtags
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Facebook posting failed");
      }

      const result = await response.json();
      await updateDoc(doc(db, "content", id), { status: "deployed" });
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ 
        title: "🚀 Posted to Facebook!", 
        description: `Post ID: ${result.postId}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Posting failed", 
        description: error.message,
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
            disabled={generateMutation.isPending || !hasAnyKey}
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
            disabled={generateMutation.isPending || !hasOpenAIKey}
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

      {/* Warning Alert if no API keys configured */}
      {!hasAnyKey && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>⚠️ API Keys Required</AlertTitle>
          <AlertDescription>
            Please add at least one AI provider API key in <a href="/settings" className="underline font-bold">Settings</a> to generate content.
            <br />
            <span className="text-xs mt-1 block">
              • OpenAI: For images and captions (DALL-E, GPT-4)
              <br />
              • Claude: For captions (Claude models)
              <br />
              • Gemini: For captions (Google models)
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert for Image Generation */}
      {hasAnyKey && !hasOpenAIKey && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>ℹ️ Image Generation Unavailable</AlertTitle>
          <AlertDescription>
            Image generation requires an OpenAI API key with credits. Add one in <a href="/settings" className="underline font-bold">Settings</a> to unlock DALL-E image generation.
          </AlertDescription>
        </Alert>
      )}

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
                  {item.status}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (!db) return;
                    deleteDoc(doc(db, "content", (item.id as unknown as string))).then(() => {
                      queryClient.invalidateQueries({ queryKey: ["content"] });
                      toast({ title: "🗑️ Content removed" });
                    });
                  }}
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
                    {editingId === (item.id as unknown as string) ? (
                      <Textarea 
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="min-h-[100px] text-xs"
                      />
                    ) : (
                      <p className="line-clamp-4">{(item.data as any).text || (item.data as any).prompt || "Processing AI visual..."}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {editingId === (item.id as unknown as string) ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 font-bold"
                    onClick={() => updateMutation.mutate({ id: item.id as unknown as string, text: editedText })}
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 font-bold bg-background"
                    onClick={() => {
                      setEditingId(item.id as unknown as string);
                      setEditedText((item.data as any).text || "");
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                )}
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 h-9 font-bold shadow-sm" 
                  disabled={item.status !== "ready" || postMutation.isPending}
                  onClick={() => postMutation.mutate((item.id as unknown as string))}
                >
                  {postMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Post to FB
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
              <p className="text-xs text-muted-foreground/60">
                {hasAnyKey 
                  ? "Generate your first AI asset to begin." 
                  : "Add API keys in Settings to start generating content."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
