import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Hash, Users, TrendingUp, MessageCircle, Search, LogOut, User, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";

interface Room {
  id: string;
  name: string;
  topic: string;
  category: string;
  is_private: boolean;
  password?: string;
  invite_code: string;
  unreadCount?: number;
}

interface Profile {
  username: string;
}

const Rooms = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRooms();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch unread counts for each room
      if (user) {
        const roomsWithUnread = await Promise.all(
          (data || []).map(async (room) => {
            const { data: receipt } = await supabase
              .from("read_receipts")
              .select("last_read_at")
              .eq("room_id", room.id)
              .eq("user_id", user.id)
              .maybeSingle();

            if (!receipt) {
              // No read receipt, count all messages
              const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("room_id", room.id);
              return { ...room, unreadCount: count || 0 };
            }

            // Count messages after last read
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("room_id", room.id)
              .gt("created_at", receipt.last_read_at);

            return { ...room, unreadCount: count || 0 };
          })
        );
        setRooms(roomsWithUnread);
      } else {
        setRooms(data || []);
      }
    } catch (error: any) {
      toast({
        title: "Error loading rooms",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    if (room.password) {
      setJoinDialogOpen(true);
    } else {
      handleJoinRoom(room.id);
    }
  };

  const handleJoinRoom = async (roomId: string, password?: string) => {
    if (!user) return;

    const room = rooms.find(r => r.id === roomId) || selectedRoom;
    
    // Check password if required
    if (room?.password && room.password !== password) {
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
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        // Already a member, just navigate
        navigate(`/chat/${roomId}`);
        setJoinDialogOpen(false);
        return;
      }

      // Join the room
      const { error } = await supabase
        .from("room_members")
        .insert({ room_id: roomId, user_id: user.id });

      if (error) throw error;
      
      setJoinDialogOpen(false);
      navigate(`/chat/${roomId}`);
    } catch (error: any) {
      toast({
        title: "Error joining room",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || room.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "All",
    ...Array.from(new Set(rooms.map((r) => r.category))),
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-primary animate-flicker">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 scanline relative">
      <AnimatedBackground />
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="border-2 border-primary bg-card p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary text-glow-cyan">
                CHAT ROOMS
              </h1>
              <p className="text-sm text-muted-foreground">
                Logged in as:{" "}
                <span className="text-accent">{profile?.username}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/profile/${user?.id}`)}
              >
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/messages")}
              >
                <Mail className="mr-2 h-4 w-4" />
                Messages
              </Button>
              <CreateRoomDialog onRoomCreated={fetchRooms} />
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-2 border-primary bg-card p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xl font-bold text-accent">
                  {rooms.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Rooms
                </div>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-secondary bg-card p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              <div>
                <div className="text-xl font-bold text-accent">LIVE</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-accent bg-card p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <div>
                <div className="text-xl font-bold text-accent">ACTIVE</div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-primary bg-card p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xl font-bold text-accent animate-flicker">
                  ON
                </div>
                <div className="text-xs text-muted-foreground">Messages</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="border-2 border-primary bg-card p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="search_rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2 border-border bg-background rounded-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={
                  selectedCategory === category ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Room List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRooms.map((room) => (
            <Card
              key={room.id}
              className="border-2 border-primary bg-card p-4 hover:border-secondary transition-all cursor-pointer group"
              onClick={() => handleRoomClick(room)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary group-hover:text-secondary transition-colors" />
                    <h3 className="text-lg font-bold text-foreground group-hover:text-glow-cyan transition-all">
                      {room.name}
                    </h3>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  {room.is_private && (
                    <span className="text-xs text-secondary uppercase">
                      Private
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1">
                  {room.topic || "No topic set"}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground uppercase">
                    {room.category}
                  </span>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Join Room →
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="border-2 border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              No rooms found matching your search.
            </p>
          </div>
        )}
      </div>

      <JoinRoomDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onJoin={(password) => selectedRoom && handleJoinRoom(selectedRoom.id, password)}
        roomName={selectedRoom?.name || ""}
        requiresPassword={!!selectedRoom?.password}
      />
    </div>
  );
};

export default Rooms;
