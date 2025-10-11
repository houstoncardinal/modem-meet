import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Hash, Users, TrendingUp, MessageCircle, Search, LogOut } from "lucide-react";

interface Room {
  id: string;
  name: string;
  topic: string;
  users: number;
  category: string;
}

const mockRooms: Room[] = [
  { id: "1", name: "general", topic: "General discussion & vibes", users: 847, category: "General" },
  { id: "2", name: "tech-talk", topic: "Technology & coding", users: 523, category: "Technology" },
  { id: "3", name: "music-lounge", topic: "Share your favorite tunes", users: 412, category: "Entertainment" },
  { id: "4", name: "gaming-zone", topic: "PC, console & mobile gaming", users: 689, category: "Gaming" },
  { id: "5", name: "art-corner", topic: "Digital & traditional art", users: 234, category: "Creative" },
  { id: "6", name: "late-night", topic: "Night owls unite", users: 156, category: "General" },
  { id: "7", name: "meme-factory", topic: "Dank memes only", users: 934, category: "Entertainment" },
  { id: "8", name: "study-group", topic: "Focus & productivity", users: 312, category: "Education" },
];

const Rooms = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const storedUsername = localStorage.getItem("retro-username");
    if (!storedUsername) {
      navigate("/");
    } else {
      setUsername(storedUsername);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("retro-username");
    navigate("/");
  };

  const filteredRooms = mockRooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || room.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...Array.from(new Set(mockRooms.map((r) => r.category)))];

  const totalUsers = mockRooms.reduce((sum, room) => sum + room.users, 0);

  return (
    <div className="min-h-screen p-4 scanline">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-2 border-primary bg-card p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary text-glow-cyan">
                CHAT ROOMS
              </h1>
              <p className="text-sm text-muted-foreground">
                Logged in as: <span className="text-accent">{username}</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-2 border-primary bg-card p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xl font-bold text-accent">{totalUsers}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-secondary bg-card p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-secondary" />
              <div>
                <div className="text-xl font-bold text-accent">{mockRooms.length}</div>
                <div className="text-xs text-muted-foreground">Active Rooms</div>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-accent bg-card p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <div>
                <div className="text-xl font-bold text-accent">LIVE</div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-primary bg-card p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xl font-bold text-accent animate-flicker">ON</div>
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
                variant={selectedCategory === category ? "default" : "outline"}
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
              onClick={() => navigate(`/chat/${room.id}`)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary group-hover:text-secondary transition-colors" />
                    <h3 className="text-lg font-bold text-foreground group-hover:text-glow-cyan transition-all">
                      {room.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-accent">
                    <Users className="h-3 w-3" />
                    <span>{room.users}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {room.topic}
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
            <p className="text-muted-foreground">No rooms found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
