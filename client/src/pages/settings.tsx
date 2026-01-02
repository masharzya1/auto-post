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
import { Loader2, Save, Key, Cpu, AlertCircle } from "lucide-react";

const MODELS = {
  photos: [
    { id: "gpt-image-1", name: "DALL-E 3 (OpenAI)", provider: "openai", canGen: true },
    { id: "stable-diffusion", name: "Stable Diffusion", provider: "custom", canGen: true },
    { id: "midjourney", name: "Midjourney", provider: "custom", canGen: false },
  ],
  caption: [
    { id: "gpt-5", name: "GPT-5 (OpenAI)", provider: "openai", canGen: true },
    { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", canGen: true },
    { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", provider: "google", canGen: true },
  ],
  videos: [
    { id: "sora", name: "Sora (OpenAI)", provider: "openai", canGen: false },
    { id: "runway-gen-2", name: "Runway Gen-2", provider: "runway", canGen: false },
    { id: "next-gen-video", name: "Next-Gen (Upcoming)", provider: "internal", canGen: false },
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
      captionModel: "gpt-5",
      videoModel: "next-gen-video",
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
      toast({ title: "Settings saved", description: "Your configuration and API keys have been updated." });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedPhotoModel = MODELS.photos.find(m => m.id === form.watch("photoModel"));
  const selectedCaptionModel = MODELS.caption.find(m => m.id === form.watch("captionModel"));
  const selectedVideoModel = MODELS.videos.find(m => m.id === form.watch("videoModel"));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Model Selection
            </CardTitle>
            <CardDescription>Choose the AI models for each content segment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Photo Model</Label>
                <Select value={form.watch("photoModel")} onValueChange={(v) => form.setValue("photoModel", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.photos.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPhotoModel && !selectedPhotoModel.canGen && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Not currently available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Caption Model</Label>
                <Select value={form.watch("captionModel")} onValueChange={(v) => form.setValue("captionModel", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.caption.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCaptionModel && !selectedCaptionModel.canGen && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Not currently available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Video Model</Label>
                <Select value={form.watch("videoModel")} onValueChange={(v) => form.setValue("videoModel", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.videos.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic">
                  This feature will come next
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              API Key Management
            </CardTitle>
            <CardDescription>Configure external provider keys.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>OpenAI API Key</Label>
                <Input type="password" {...form.register("openaiApiKey")} placeholder="sk-..." />
              </div>
              <div className="grid gap-2">
                <Label>Claude API Key</Label>
                <Input type="password" {...form.register("claudeApiKey")} placeholder="key-..." />
              </div>
              <div className="grid gap-2">
                <Label>Gemini API Key</Label>
                <Input type="password" {...form.register("geminiApiKey")} placeholder="key-..." />
              </div>
              <div className="grid gap-2">
                <Label>Facebook Access Token</Label>
                <Input type="password" {...form.register("fbAccessToken")} placeholder="EAAB..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Facebook Page ID</Label>
              <Input {...form.register("fbPageId")} placeholder="Page ID" />
            </div>
            <div className="grid gap-2">
              <Label>YouTube Channel ID (API Disabled)</Label>
              <Input disabled placeholder="YouTube API is currently disabled" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Settings
        </Button>
      </form>
    </div>
  );
}
