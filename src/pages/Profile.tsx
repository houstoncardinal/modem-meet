import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Globe, Edit, MessageCircle, Ban, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { AnimatedBackground } from "@/components/AnimatedBackground";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  status: string;
  bio: string | null;
  interests: string[] | null;
  location: string | null;
  website: string | null;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      checkIfBlocked();
    }
  }, [userId]);

  const checkIfBlocked = async () => {
    if (!user || !userId || isOwnProfile) return;

    try {
      const { data } = await supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", userId)
        .maybeSingle();

      setIsBlocked(!!data);
    } catch (error) {
      console.error("Error checking block status:", error);
    }
  };

  const handleBlockToggle = async () => {
    if (!user || !userId) return;

    setBlockLoading(true);
    try {
      if (isBlocked) {
        // Unblock
        const { error } = await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", user.id)
          .eq("blocked_id", userId);

        if (error) throw error;

        toast({
          title: "User unblocked",
          description: `You can now see messages from ${profile?.username}.`,
        });
        setIsBlocked(false);
      } else {
        // Block
        const { error } = await supabase
          .from("blocked_users")
          .insert({
            blocker_id: user.id,
            blocked_id: userId,
          });

        if (error) throw error;

        toast({
          title: "User blocked",
          description: `You will no longer see messages from ${profile?.username}.`,
        });
        setIsBlocked(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBlockLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
      navigate("/rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleStartDM = async () => {
    if (!user || !userId) return;

    try {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        user1: user.id,
        user2: userId,
      });

      if (error) throw error;
      navigate("/messages");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-accent";
      case "away":
        return "bg-secondary";
      case "busy":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-primary animate-flicker">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 scanline relative">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            {!isOwnProfile && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStartDM}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
                <Button
                  variant={isBlocked ? "outline" : "destructive"}
                  size="sm"
                  onClick={handleBlockToggle}
                  disabled={blockLoading}
                >
                  {isBlocked ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Unblock
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Block
                    </>
                  )}
                </Button>
              </>
            )}
            {isOwnProfile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <Card className="border-2 border-primary bg-card p-8">
          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <UserAvatar
                username={profile.username}
                avatarUrl={profile.avatar_url}
                size="xl"
              />

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-primary text-glow-cyan">
                    {profile.username}
                  </h1>
                  <div
                    className={`h-3 w-3 rounded-full ${getStatusColor(
                      profile.status
                    )}`}
                  />
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Member since {formatDate(profile.created_at)}
                </p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="border-t border-border pt-4">
                <h2 className="text-sm uppercase tracking-wider text-accent mb-2">
                  Bio
                </h2>
                <p className="text-foreground whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="border-t border-border pt-4">
                <h2 className="text-sm uppercase tracking-wider text-accent mb-3">
                  Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!profile.bio &&
              (!profile.interests || profile.interests.length === 0) &&
              !profile.location &&
              !profile.website &&
              isOwnProfile && (
                <div className="border-t border-border pt-4 text-center">
                  <p className="text-muted-foreground mb-4">
                    Your profile is looking a bit empty!
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    Complete Your Profile
                  </Button>
                </div>
              )}
          </div>
        </Card>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
          onProfileUpdate={fetchProfile}
        />
      )}
    </div>
  );
};

export default Profile;
