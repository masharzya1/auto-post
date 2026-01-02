import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema, type Settings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Key, Cpu, AlertCircle, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MODELS = {
  photos: [
    { id: "gpt-image-1", name: "DALL-E 3 (OpenAI)", provider: "openai", canGen: true, tier: "Free" },
    { id: "stable-diffusion-xl", name: "Stable Diffusion XL", provider: "custom", canGen: true, tier: "Pro" },
    { id: "midjourney-v6", name: "Midjourney v6", provider: "custom", canGen: false, tier: "Pro" },
    { id: "flux-1-dev", name: "Flux.1 Dev", provider: "custom", canGen: true, tier: "Pro" },
  ],
  caption: [
    { id: "gpt-4o", name: "GPT-4o (Most Capable)", provider: "openai", canGen: true, tier: "Pro" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", canGen: true, tier: "Free" },
    { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", canGen: true, tier: "Pro" },
    { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", provider: "google", canGen: true, tier: "Pro" },
    { id: "llama-3-1-70b", name: "Llama 3.1 70B", provider: "meta", canGen: true, tier: "Free" },
    { id: "deepseek-chat", name: "DeepSeek V3", provider: "deepseek", canGen: true, tier: "Free" },
    { id: "o1-mini", name: "OpenAI o1-mini", provider: "openai", canGen: true, tier: "Pro" },
  ],
  videos: [
    { id: "sora", name: "Sora (OpenAI)", provider: "openai", canGen: false, tier: "Pro" },
    { id: "runway-gen-3", name: "Runway Gen-3 Alpha", provider: "runway", canGen: false, tier: "Pro" },
    { id: "luma-dream-machine", name: "Luma Dream Machine", provider: "luma", canGen: false, tier: "Pro" },
    { id: "kling-ai", name: "Kling AI", provider: "kling", canGen: false, tier: "Pro" },
  ]
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<Settings>({ queryKey: ["/api/settings"] });

  const form = useForm({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: settings || {
      fbPageId: "",
      ytChannelId: "",
      niche: "Motivation",
      postsPerWeek: 7,
      videosPerDay: 1,
      randomPostingTime: false,
      photoModel: "gpt-image-1",
      captionModel: "gpt-4o-mini",
      videoModel: "luma-dream-machine",
      fbAccessToken: "",
      openaiApiKey: "",
      geminiApiKey: "",
      claudeApiKey: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved", description: "Your configuration and AI models have been updated." });
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
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground font-medium">Fine-tune your AI models and social connections.</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Intelligence Core
            </CardTitle>
            <CardDescription>Select high-performance models for your content generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Photo Generation</Label>
                <Select value={form.watch("photoModel")} onValueChange={(v) => form.setValue("photoModel", v)}>
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {MODELS.photos.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-medium">{m.name}</span>
                          <Badge variant={m.tier === "Pro" ? "default" : "secondary"} className="text-[9px] px-1 h-3.5">
                            {m.tier}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Smart Captions</Label>
                <Select value={form.watch("captionModel")} onValueChange={(v) => form.setValue("captionModel", v)}>
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {MODELS.caption.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-medium">{m.name}</span>
                          <Badge variant={m.tier === "Pro" ? "default" : "secondary"} className="text-[9px] px-1 h-3.5">
                            {m.tier}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cinematic Video</Label>
                <Select disabled value={form.watch("videoModel")} onValueChange={(v) => form.setValue("videoModel", v)}>
                  <SelectTrigger className="h-11 opacity-50">
                    <SelectValue placeholder="Coming Soon..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.videos.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-medium">{m.name}</span>
                          <Badge variant="outline" className="text-[9px] px-1 h-3.5 border-primary/30 text-primary">
                            Coming Soon
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              API Gateways
            </CardTitle>
            <CardDescription>Securely store your provider credentials.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>OpenAI Secret Key</Label>
              <Input type="password" {...form.register("openaiApiKey")} placeholder="sk-..." className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Claude Access Token</Label>
              <Input type="password" {...form.register("claudeApiKey")} placeholder="key-..." className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Gemini API Endpoint</Label>
              <Input type="password" {...form.register("geminiApiKey")} placeholder="key-..." className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Facebook System Token</Label>
              <Input type="password" {...form.register("fbAccessToken")} placeholder="EAAB..." className="h-11" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Platform Identity</CardTitle>
            <CardDescription>Direct IDs for automated distribution.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Facebook Page ID</Label>
              <Input {...form.register("fbPageId")} placeholder="numeric-id" className="h-11" />
            </div>
            <div className="space-y-2 opacity-50">
              <Label>YouTube Studio Link (Restricted)</Label>
              <Input disabled value="v3 API Integration Pending" className="h-11" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-14 text-lg font-bold hover-elevate shadow-lg transition-all" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Finalize & Save Changes
        </Button>
      </form>
    </div>
  );
}
