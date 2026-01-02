import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema, type Settings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

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
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved", description: "Your configuration has been updated." });
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Connections</CardTitle>
            <CardDescription>Configure your social media account IDs for automated posting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fbPageId">Facebook Page ID</Label>
              <Input id="fbPageId" {...form.register("fbPageId")} placeholder="Enter your FB Page ID" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ytChannelId">YouTube Channel ID</Label>
              <Input id="ytChannelId" {...form.register("ytChannelId")} placeholder="Enter your YT Channel ID" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation Preferences</CardTitle>
            <CardDescription>Set your content schedule and niche.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="niche">Content Niche</Label>
              <Input id="niche" {...form.register("niche")} placeholder="e.g. Health, Tech, Motivation" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="postsPerWeek">Posts Per Week</Label>
                <Input type="number" id="postsPerWeek" {...form.register("postsPerWeek", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="videosPerDay">Videos Per Day</Label>
                <Input type="number" id="videosPerDay" {...form.register("videosPerDay", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Random Posting Time</Label>
                <p className="text-sm text-muted-foreground">Post at unpredictable times to mimic human behavior.</p>
              </div>
              <Switch 
                checked={form.watch("randomPostingTime")} 
                onCheckedChange={(val) => form.setValue("randomPostingTime", val)} 
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Configuration
        </Button>
      </form>
    </div>
  );
}
