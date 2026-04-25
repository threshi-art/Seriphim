import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Instagram, RefreshCw, BarChart3, Eye, Heart, MessageCircle,
  TrendingUp, Brain, AlertCircle, Image as ImageIcon, Clock,
} from "lucide-react";

export default function InstagramPage() {
  const { data: accountData, isLoading: accountLoading } = trpc.instagram.account.useQuery();
  const { data: postsData, isLoading: postsLoading } = trpc.instagram.posts.useQuery();
  const { data: allData } = trpc.instagram.allData.useQuery();
  const analyzeMutation = trpc.instagram.analyze.useMutation();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const account = accountData?.data as any;
  const posts = (postsData?.data as any[]) || [];
  const hasData = allData && allData.length > 0;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeMutation.mutateAsync();
      setAnalysis(result.analysis);
    } catch (e: any) {
      toast.error("Analysis failed: " + (e.message || "Unknown error"));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Instagram className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Instagram Intelligence</h1>
              <p className="text-sm text-muted-foreground">Social media analytics and insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing || !hasData}
              className="gap-1.5 text-xs"
            >
              <Brain className="h-3.5 w-3.5" />
              {analyzing ? "Analyzing..." : "AI Analysis"}
            </Button>
          </div>
        </div>

        {/* No Data State */}
        {!hasData && !accountLoading && !postsLoading && (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Instagram className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-2">No Instagram Data Synced</h3>
              <p className="text-xs text-muted-foreground max-w-md mb-4">
                Instagram data is synced via the Manus MCP integration. Ask Seraphim to fetch your Instagram
                account info and posts, and the data will appear here for analysis.
              </p>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs font-mono text-muted-foreground max-w-md">
                <p className="text-primary mb-1">Try asking in Chat:</p>
                <p>"Fetch my Instagram account info and recent posts"</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Overview */}
        {account && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-400" /> Account Overview
              </CardTitle>
              {accountData?.fetchedAt && (
                <CardDescription className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last synced: {new Date(accountData.fetchedAt).toLocaleString()}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                {account.profile_picture_url && (
                  <img src={account.profile_picture_url} alt="" className="h-16 w-16 rounded-full border-2 border-pink-500/30" />
                )}
                <div>
                  <h3 className="font-semibold">{account.name || account.username || "Unknown"}</h3>
                  {account.username && <p className="text-xs text-muted-foreground">@{account.username}</p>}
                  {account.biography && <p className="text-xs text-muted-foreground mt-1 max-w-md">{account.biography}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{account.followers_count?.toLocaleString() || "—"}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Followers</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{account.follows_count?.toLocaleString() || "—"}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Following</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{account.media_count?.toLocaleString() || "—"}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Posts */}
        {posts.length > 0 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> Recent Posts
              </CardTitle>
              <CardDescription className="text-xs">{posts.length} posts loaded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {posts.slice(0, 10).map((post: any, i: number) => (
                  <div key={post.id || i} className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                    {post.media_url && (
                      <img src={post.media_url} alt="" className="h-16 w-16 rounded-md object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground line-clamp-2">{post.caption || "No caption"}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {post.like_count !== undefined && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Heart className="h-3 w-3" /> {post.like_count}
                          </span>
                        )}
                        {post.comments_count !== undefined && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MessageCircle className="h-3 w-3" /> {post.comments_count}
                          </span>
                        )}
                        {post.timestamp && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(post.timestamp).toLocaleDateString()}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[9px] h-4">
                          {post.media_type || "post"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        {analysis && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Intelligence Briefing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm prose-invert max-w-none text-xs">
                <Streamdown>{analysis}</Streamdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Cache Status */}
        {hasData && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Data Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allData?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] h-4">{item.dataType}</Badge>
                    </div>
                    <span className="text-muted-foreground font-mono">
                      {new Date(item.fetchedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
