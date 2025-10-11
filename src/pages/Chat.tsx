import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Users, Hash, Circle } from "lucide-react";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  type: "message" | "system";
}

interface User {
  username: string;
  status: "online" | "away" | "busy";
}

const mockUsers: User[] = [
  { username: "cyber_punk_77", status: "online" },
  { username: "retro_gamer", status: "online" },
  { username: "neon_dreams", status: "away" },
  { username: "pixel_wizard", status: "online" },
  { username: "code_ninja", status: "busy" },
  { username: "vaporwave_fan", status: "online" },
];

const mockMessages: Message[] = [
  { id: "1", user: "system", text: "Welcome to #general! Be respectful and have fun.", timestamp: new Date(Date.now() - 3600000), type: "system" },
  { id: "2", user: "cyber_punk_77", text: "hey everyone! what's up?", timestamp: new Date(Date.now() - 1800000), type: "message" },
  { id: "3", user: "retro_gamer", text: "just vibing, coding some stuff", timestamp: new Date(Date.now() - 1200000), type: "message" },
  { id: "4", user: "pixel_wizard", text: "working on a new pixel art project!", timestamp: new Date(Date.now() - 600000), type: "message" },
];

const Chat = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("retro-username");
    if (!storedUsername) {
      navigate("/");
    } else {
      setUsername(storedUsername);
      // Add join message
      const joinMessage: Message = {
        id: Date.now().toString(),
        user: "system",
        text: `${storedUsername} has joined the chat`,
        timestamp: new Date(),
        type: "system",
      };
      setMessages((prev) => [...prev, joinMessage]);
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      user: username,
      text: message,
      timestamp: new Date(),
      type: "message",
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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

  return (
    <div className="h-screen flex flex-col scanline">
      {/* Header */}
      <div className="border-b-2 border-primary bg-card p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/rooms")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary text-glow-cyan" />
              <h1 className="text-xl font-bold text-foreground">general</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-accent">{username}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "system" ? (
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 inline-block border border-border">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div className="group hover:bg-muted/30 p-2 -mx-2 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-none bg-primary/20 border border-primary flex items-center justify-center text-primary font-bold text-sm">
                        {msg.user[0].toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-bold text-sm ${msg.user === username ? "text-secondary" : "text-primary"}`}>
                            {msg.user}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words">{msg.text}</p>
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
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
              <h2 className="font-bold text-foreground">Online ({mockUsers.length})</h2>
            </div>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
            {mockUsers.map((user) => (
              <div
                key={user.username}
                className="p-2 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Circle className={`h-2 w-2 fill-current ${getStatusColor(user.status)}`} />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {user.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
