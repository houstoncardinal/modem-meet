import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Hash, Lock } from "lucide-react";

const JoinWithCode = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (code && user) {
      fetchRoom();
    }
  }, [code, user]);

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("invite_code", code)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Invalid invite code",
          description: "This invite link is invalid or expired.",
          variant: "destructive",
        });
        navigate("/rooms");
        return;
      }

      setRoom(data);
    } catch (error: any) {
      toast({
        title: "Error loading room",
        description: error.message,
        variant: "destructive",
      });
      navigate("/rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !room) return;

    // Check password if required
    if (room.password && room.password !== password) {
      toast({
        title: "Incorrect password",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("room_members")
        .select("id")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        navigate(`/chat/${room.id}`);
        return;
      }

      // Join the room
      const { error } = await supabase
        .from("room_members")
        .insert({ room_id: room.id, user_id: user.id });

      if (error) throw error;

      toast({
        title: "Joined successfully",
        description: `You've joined ${room.name}`,
      });

      navigate(`/chat/${room.id}`);
    } catch (error: any) {
      toast({
        title: "Error joining room",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-primary animate-flicker">Loading...</p>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen p-4 scanline relative flex items-center justify-center">
      <AnimatedBackground />
      <Card className="border-2 border-primary bg-card p-6 max-w-md w-full relative z-10">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary text-glow-cyan mb-2">
              Join Room
            </h1>
            <div className="flex items-center justify-center gap-2 text-foreground">
              <Hash className="h-5 w-5" />
              <span className="text-xl font-bold">{room.name}</span>
            </div>
            {room.topic && (
              <p className="text-sm text-muted-foreground mt-2">{room.topic}</p>
            )}
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            {room.password && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  This room requires a password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="border-2 border-border rounded-none"
                  required
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/rooms")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Join Room
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default JoinWithCode;
