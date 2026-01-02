import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type Limits, type Content } from "@shared/schema";
import { Loader2, Zap, Image as ImageIcon, Video, FileText } from "lucide-react";

export default function Dashboard() {
  const { data: limits, isLoading: limitsLoading } = useQuery<Limits>({ queryKey: ["/api/limits"] });
  const { data: content, isLoading: contentLoading } = useQuery<Content[]>({ queryKey: ["/api/content"] });

  if (limitsLoading || contentLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: "Text", used: limits?.textUsed || 0, total: limits?.textLimit || 100, icon: FileText, color: "text-blue-500" },
    { label: "Images", used: limits?.imageUsed || 0, total: limits?.imageLimit || 50, icon: ImageIcon, color: "text-purple-500" },
    { label: "Videos", used: limits?.videoUsed || 0, total: limits?.videoLimit || 10, icon: Video, color: "text-orange-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
          <Zap className="h-4 w-4" />
          AI Powered
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label} Usage</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.used} / {stat.total}</div>
              <Progress value={(stat.used / stat.total) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {content?.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="p-2 bg-primary/10 rounded-md">
                  {item.type === "text" && <FileText className="h-4 w-4 text-primary" />}
                  {item.type === "image" && <ImageIcon className="h-4 w-4 text-primary" />}
                  {item.type === "video" && <Video className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Generated {item.type} content</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  item.status === "ready" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {item.status}
                </div>
              </div>
            ))}
            {(!content || content.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No recent activity found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
