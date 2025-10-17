import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Users, Hash, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { UserAvatar } from "@/components/UserAvatar";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { RoomSettingsDialog } from "@/components/RoomSettingsDialog";
import { MessageActions } from "@/components/MessageActions";
import { FileUpload } from "@/components/FileUpload";
import { z } from "zod";

interface Message {
  id: string;
  user_id: string;
  content: string;
  type: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
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
  useOnlineStatus(); // Track online status
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      
      const messagesCleanup = subscribeToMessages();
      const membersCleanup = subscribeToMembers();
      
      return () => {
        messagesCleanup();
        membersCleanup();
      };
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

  const fetchMessages = async (before?: string) => {
    try {
      let query = supabase
        .from("messages")
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (before) {
        query = query.lt("created_at", before);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const sortedData = (data || []).reverse();
      
      if (before) {
        setMessages((prev) => [...sortedData, ...prev]);
        setHasMore(data.length === 50);
      } else {
        setMessages(sortedData);
        setHasMore(data.length === 50);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    setLoadingMore(true);
    const oldestMessage = messages[0];
    await fetchMessages(oldestMessage.created_at);
    setLoadingMore(false);
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !loadingMore) {
        const scrollHeight = container.scrollHeight;
        loadMoreMessages().then(() => {
          // Maintain scroll position after loading more
          container.scrollTop = container.scrollHeight - scrollHeight;
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages, hasMore, loadingMore]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (!user || !roomId || messages.length === 0) return;

    const markAsRead = async () => {
      const lastMessage = messages[messages.length - 1];
      await supabase
        .from("read_receipts")
        .upsert({
          room_id: roomId,
          user_id: user.id,
          last_read_at: new Date().toISOString(),
          last_read_message_id: lastMessage.id,
        }, {
          onConflict: "room_id,user_id"
        });
    };

    markAsRead();
  }, [messages, user, roomId]);

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

  const handleSendMessage = async (attachmentData?: {
    url: string;
    name: string;
    type: string;
  }) => {
    if ((!message.trim() && !attachmentData) || !user) return;

    try {
      // Validate message content if present
      if (message.trim()) {
        const messageSchema = z.string().trim().min(1, "Message cannot be empty").max(5000, "Message must be less than 5000 characters");
        const validation = messageSchema.safeParse(message);
        if (!validation.success) {
          toast({
            title: "Invalid message",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      }

      // Check rate limit (10 messages per minute)
      const { data: rateLimit } = await supabase
        .from("message_rate_limit")
        .select("*")
        .eq("user_id", user.id)
        .eq("room_id", roomId)
        .maybeSingle();

      const now = new Date();
      const windowStart = rateLimit?.window_start
        ? new Date(rateLimit.window_start)
        : null;
      const messageCount = rateLimit?.message_count || 0;

      // Reset window if more than 1 minute has passed
      if (!windowStart || now.getTime() - windowStart.getTime() > 60000) {
        await supabase.from("message_rate_limit").upsert({
          user_id: user.id,
          room_id: roomId,
          message_count: 1,
          window_start: now.toISOString(),
        });
      } else if (messageCount >= 10) {
        toast({
          title: "Slow down!",
          description: "You're sending messages too quickly. Please wait a moment.",
          variant: "destructive",
        });
        return;
      } else {
        await supabase
          .from("message_rate_limit")
          .update({ message_count: messageCount + 1 })
          .eq("user_id", user.id)
          .eq("room_id", roomId);
      }

      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        user_id: user.id,
        content: message || (attachmentData ? `Sent a file: ${attachmentData.name}` : ""),
        type: "message",
        attachment_url: attachmentData?.url || null,
        attachment_name: attachmentData?.name || null,
        attachment_type: attachmentData?.type || null,
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
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {loadingMore && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Loading more messages...</p>
              </div>
            )}
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
                          {msg.edited_at && (
                            <span className="text-xs text-muted-foreground italic">
                              (edited)
                            </span>
                          )}
                          <div className="ml-auto">
                            <MessageActions
                              messageId={msg.id}
                              content={msg.content}
                              isOwnMessage={msg.user_id === user?.id}
                              onEdit={() => fetchMessages()}
                              onDelete={() => fetchMessages()}
                            />
                          </div>
                        </div>
                        <p className={`text-sm break-words ${
                          msg.deleted_at ? "text-muted-foreground italic" : "text-foreground"
                        }`}>
                          {msg.content}
                        </p>
                        {msg.attachment_url && !msg.deleted_at && (
                          <div className="mt-2">
                            {msg.attachment_type?.startsWith("image/") ? (
                              <img
                                src={msg.attachment_url}
                                alt={msg.attachment_name || "attachment"}
                                className="max-w-sm rounded border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(msg.attachment_url!, "_blank")}
                              />
                            ) : (
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <Paperclip className="h-4 w-4" />
                                {msg.attachment_name || "Download file"}
                              </a>
                            )}
                          </div>
                        )}
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
            <div className="flex gap-2 items-end">
              <FileUpload
                onFileUploaded={(url, name, type) =>
                  handleSendMessage({ url, name, type })
                }
              />
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
                className="border-2 border-primary bg-background rounded-none flex-1"
              />
              <Button onClick={() => handleSendMessage()} size="icon">
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
