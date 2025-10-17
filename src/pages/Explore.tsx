import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "@/components/PostCard";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  content: string;
  feeling: string | null;
  location: string | null;
  image_urls: string[] | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  post_tags?: Array<{ tag_name: string }>;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

const Explore = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchTrendingTags();
      subscribeToNewPosts();
    }
  }, [user, selectedTag]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("posts")
        .select(
          `
          *,
          profiles (username, avatar_url),
          post_tags (tag_name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (selectedTag) {
        query = query.contains("post_tags", [{ tag_name: selectedTag }]);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;

      // Fetch likes count and user's like status for each post
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          const [likesResult, userLikeResult, commentsResult] = await Promise.all([
            supabase
              .from("post_likes")
              .select("id", { count: "exact", head: true })
              .eq("post_id", post.id),
            supabase
              .from("post_likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user?.id || "")
              .maybeSingle(),
            supabase
              .from("post_comments")
              .select("id", { count: "exact", head: true })
              .eq("post_id", post.id),
          ]);

          return {
            ...post,
            likes_count: likesResult.count || 0,
            is_liked: !!userLikeResult.data,
            comments_count: commentsResult.count || 0,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTags = async () => {
    try {
      const { data, error } = await supabase
        .from("post_tags")
        .select("tag_name")
        .limit(100);

      if (error) throw error;

      // Count tag occurrences
      const tagCounts = (data || []).reduce((acc: Record<string, number>, tag) => {
        acc[tag.tag_name] = (acc[tag.tag_name] || 0) + 1;
        return acc;
      }, {});

      // Get top 10 trending tags
      const trending = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      setTrendingTags(trending);
    } catch (error: any) {
      console.error("Error fetching trending tags:", error);
    }
  };

  const subscribeToNewPosts = () => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.post_tags?.some((tag) =>
        tag.tag_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-primary animate-flicker">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0 relative">
      <AnimatedBackground />

      {/* Header */}
      <div className="sticky top-0 z-40 border-b-2 border-primary bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Explore
          </h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, people, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2 border-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Trending Tags */}
        {trendingTags.length > 0 && (
          <div className="bg-card/50 backdrop-blur p-4 rounded-lg border-2 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">Trending Tags</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="for-you" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="for-you" className="flex-1">
              For You
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              Following
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="for-you" className="space-y-4 mt-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No posts found" : "No posts yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Be the first to share something!
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onLikeToggle={fetchPosts} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="following" className="space-y-4 mt-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Follow people to see their posts here!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 lg:bottom-8 z-50">
        <CreatePostDialog onPostCreated={fetchPosts} />
      </div>
    </div>
  );
};

export default Explore;
