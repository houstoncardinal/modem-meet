import { useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  content: string;
  feeling: string | null;
  location: string | null;
  image_urls: string[] | null;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  user_id: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  post_tags?: Array<{ tag_name: string }>;
}

interface PostCardProps {
  post: Post;
  onLikeToggle?: () => void;
}

const FEELING_EMOJIS: Record<string, string> = {
  happy: "😊",
  excited: "🎉",
  loved: "💖",
  blessed: "🙏",
  grateful: "🌟",
  motivated: "💪",
  chill: "😎",
  thoughtful: "🤔",
  creative: "🎨",
  adventurous: "🏔️",
};

export const PostCard = ({ post, onLikeToggle }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        // Like
        const { error } = await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: user.id,
        });

        if (error) throw error;
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }

      if (onLikeToggle) onLikeToggle();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.profiles.username}`,
        text: post.content,
        url: window.location.href,
      });
    } else {
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard",
      });
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Card className="p-4 space-y-4 border-2 border-primary/20 hover:border-primary/40 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        <UserAvatar
          username={post.profiles.username}
          avatarUrl={post.profiles.avatar_url}
          size="md"
        />
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-foreground">
              {post.profiles.username}
            </span>
            {post.feeling && (
              <span className="text-sm text-muted-foreground">
                is feeling {post.feeling} {FEELING_EMOJIS[post.feeling]}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
          {post.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              {post.location}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <p className="text-foreground whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {/* Images */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div
            className={`grid gap-2 ${
              post.image_urls.length === 1
                ? "grid-cols-1"
                : post.image_urls.length === 2
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {post.image_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-auto max-h-96 object-cover rounded border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(url, "_blank")}
              />
            ))}
          </div>
        )}

        {/* Tags */}
        {post.post_tags && post.post_tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.post_tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag.tag_name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className={isLiked ? "text-red-500" : ""}
        >
          <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
          <span>{likesCount}</span>
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="h-4 w-4 mr-1" />
          <span>{post.comments_count || 0}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
