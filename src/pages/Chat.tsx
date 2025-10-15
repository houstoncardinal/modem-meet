import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Users, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/UserAvatar";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { RoomSettingsDialog } from "@/components/RoomSettingsDialog";

interface Message {
  id: string;
  user_id: string;
  content: string;
  type: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface RoomMember {
  user_id: string;
  role?: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    status: string;
  };
}

interface Room {
  id: string;
  name: string;
  topic: string;
  is_private: boolean;
  password?: string;
  invite_code: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && roomId) {
      fetchRoom();
      fetchMessages();
      fetchMembers();
      subscribeToMessages();
      subscribeToMembers();
    }
  }, [user, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, topic, is_private, password, invite_code")
        .eq("id", roomId)
        .single();

      if (error) throw error;
      setRoom(data);
    } catch (error: any) {
      toast({
        title: "Error loading room",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("room_members")
        .select(`
          user_id,
          role,
          profiles (
            username,
            avatar_url,
            status
          )
        `)
        .eq("room_id", roomId);

      if (error) throw error;
      setMembers(data || []);
      
      // Set current user's role
      const currentUserMember = data?.find(m => m.user_id === user?.id);
      setUserRole(currentUserMember?.role || null);
    } catch (error: any) {
      console.error("Error fetching members:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              profiles (
                username,
                avatar_url
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMembers = () => {
    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        user_id: user.id,
        content: message,
        type: "message",
      });

      if (error) throw error;
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-accent";
      case "away":
        return "text-secondary";
      case "busy":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  if (authLoading || !room) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-primary animate-flicker">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col scanline relative">
      <AnimatedBackground />
      {/* Header */}
      <div className="border-b-2 border-primary bg-card p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/rooms")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary text-glow-cyan" />
              <h1 className="text-xl font-bold text-foreground">
                {room.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {room && (
              <RoomSettingsDialog
                roomId={room.id}
                roomName={room.name}
                isPrivate={room.is_private}
                password={room.password}
                inviteCode={room.invite_code}
                userRole={userRole || undefined}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full relative z-10">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "system" ? (
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 inline-block border border-border">
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <div className="group hover:bg-muted/30 p-2 -mx-2 transition-colors">
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        username={msg.profiles.username}
                        avatarUrl={msg.profiles.avatar_url}
                        size="md"
                        onClick={() => navigate(`/profile/${msg.user_id}`)}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline gap-2">
                          <button
                            onClick={() => navigate(`/profile/${msg.user_id}`)}
                            className={`font-bold text-sm hover:underline ${
                              msg.user_id === user?.id
                                ? "text-secondary"
                                : "text-primary"
                            }`}
                          >
                            {msg.profiles.username}
                          </button>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t-2 border-primary bg-card p-4">
            <div className="flex gap-2">
              <Input
                placeholder="type_message_here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="border-2 border-primary bg-background rounded-none"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* User List Sidebar */}
        <div className="w-64 border-l-2 border-primary bg-card hidden lg:block">
          <div className="p-4 border-b-2 border-border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">
                Online ({members.length})
              </h2>
            </div>
          </div>
          <div
            className="p-2 space-y-1 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 140px)" }}
          >
            {members.map((member, idx) => (
              <button
                key={idx}
                onClick={() => navigate(`/profile/${member.user_id}`)}
                className="w-full p-2 hover:bg-muted/30 transition-colors group text-left"
              >
                <div className="flex items-center gap-2">
                  <UserAvatar
                    username={member.profiles.username}
                    avatarUrl={member.profiles.avatar_url}
                    size="sm"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {member.profiles.username}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
