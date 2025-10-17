import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
    status: string;
    last_seen: string | null;
  };
  unread_count: number;
}

interface DirectMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const DirectMessages = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  useOnlineStatus(); // Track online status
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      subscribeToMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          direct_messages!inner(*)
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Fetch other user details for each conversation
      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
          const { data: userData } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, status, last_seen")
            .eq("id", otherUserId)
            .single();

          // Check if user is online (last seen within 5 minutes)
          const isOnline = userData?.last_seen 
            ? new Date().getTime() - new Date(userData.last_seen).getTime() < 300000
            : false;

          return {
            ...conv,
            other_user: {
              ...userData,
              status: isOnline ? "online" : "offline",
            },
            unread_count: 0, // TODO: Implement unread count
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv) return;

      const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;

      const { data, error } = await supabase
        .from("direct_messages")
        .select(`
          *,
          profiles!direct_messages_sender_id_fkey (
            username,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        async (payload) => {
          const { data } = await supabase
            .from("direct_messages")
            .select(`
              *,
              profiles!direct_messages_sender_id_fkey (
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const conv = conversations.find((c) => c.id === selectedConversation);
      if (!conv) return;

      const receiverId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;

      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user?.id,
        receiver_id: receiverId,
        content: newMessage,
      });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation);

      setNewMessage("");
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

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-primary animate-flicker">Loading...</p>
      </div>
    );
  }

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="h-screen flex flex-col pb-16 lg:pb-0">
      {/* Header - only show on desktop or when viewing conversation list on mobile */}
      <div className={`border-b-2 border-primary bg-card/95 backdrop-blur p-4 ${selectedConversation ? 'hidden lg:block' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/rooms")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Direct Messages</h1>
          </div>
        </div>
      </div>

      {/* Chat Header - only show on mobile when in chat view */}
      {selectedConversation && selectedConv && (
        <div className="lg:hidden border-b-2 border-primary bg-card/95 backdrop-blur p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <UserAvatar
              username={selectedConv.other_user.username}
              avatarUrl={selectedConv.other_user.avatar_url}
              size="sm"
            />
            <div className="flex-1">
              <p className="font-bold text-sm text-foreground">
                {selectedConv.other_user.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedConv.other_user.status === "online" ? "Active now" : "Offline"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Conversations List - hidden on mobile when chat is open */}
        <div className={`w-full lg:w-80 lg:border-r-2 border-primary bg-card overflow-y-auto ${
          selectedConversation ? 'hidden lg:block' : 'block'
        }`}>
          <div className="p-4 border-b-2 border-border lg:block hidden">
            <h2 className="font-bold text-foreground">Conversations</h2>
          </div>
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">No conversations yet</p>
              <p className="text-xs">Click on a user's profile to start chatting</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors border-l-4 ${
                    selectedConversation === conv.id
                      ? "border-primary bg-muted/30"
                      : "border-transparent"
                  }`}
                >
                  <UserAvatar
                    username={conv.other_user.username}
                    avatarUrl={conv.other_user.avatar_url}
                    size="md"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm text-foreground truncate">
                        {conv.other_user.username}
                      </p>
                      {conv.other_user.status === "online" && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {conv.other_user.status === "online" ? "Active now" : "Offline"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area - full width on mobile when open */}
        {selectedConversation ? (
          <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${
                      msg.sender_id === user?.id ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <UserAvatar
                        username={msg.profiles.username}
                        avatarUrl={msg.profiles.avatar_url}
                        size="sm"
                      />
                    </div>
                    <div className="flex flex-col max-w-[75%] sm:max-w-md">
                      <div
                        className={`p-3 border-2 rounded-lg ${
                          msg.sender_id === user?.id
                            ? "border-primary bg-primary/10"
                            : "border-muted bg-muted/30"
                        }`}
                      >
                        <p className="text-sm text-foreground break-words">{msg.content}</p>
                      </div>
                      <p className={`text-xs text-muted-foreground mt-1 px-1 ${
                        msg.sender_id === user?.id ? "text-right" : ""
                      }`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t-2 border-primary bg-card/95 backdrop-blur p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="border-2 border-primary/20 bg-background focus:border-primary transition-colors"
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  disabled={!newMessage.trim()}
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-muted/10">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
