import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, Zap } from "lucide-react";

const Index = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (username.trim()) {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 scanline">
      <div className="w-full max-w-2xl space-y-8 animate-slide-up">
        {/* ASCII Art Logo */}
        <div className="text-center">
          <pre className="text-primary text-glow-cyan text-xs sm:text-sm md:text-base inline-block animate-flicker">
{`
 ██████╗██╗  ██╗ █████╗ ████████╗██╗     ██╗███╗   ██╗██╗  ██╗
██╔════╝██║  ██║██╔══██╗╚══██╔══╝██║     ██║████╗  ██║██║ ██╔╝
██║     ███████║███████║   ██║   ██║     ██║██╔██╗ ██║█████╔╝ 
██║     ██╔══██║██╔══██║   ██║   ██║     ██║██║╚██╗██║██╔═██╗ 
╚██████╗██║  ██║██║  ██║   ██║   ███████╗██║██║ ╚████║██║  ██╗
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
`}
          </pre>
          <p className="text-secondary text-glow-magenta text-sm sm:text-base mt-4 font-sans">
            {'>>> RETRO CHAT NETWORK v2.0 <<<'}
          </p>
        </div>

        {/* Welcome Card */}
        <div className="border-2 border-primary bg-card p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary text-glow-cyan font-sans">
              CONNECT TO THE GRID
            </h1>
            <p className="text-muted-foreground">
              Enter your handle to join thousands of users in real-time chat rooms
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-accent uppercase tracking-wider">
                Username
              </label>
              <Input
                type="text"
                placeholder="enter_username_here"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
                className="border-2 border-primary bg-background text-foreground placeholder:text-muted-foreground focus:border-secondary transition-colors rounded-none h-12"
              />
            </div>

            <Button
              onClick={handleJoin}
              size="lg"
              className="w-full"
              disabled={!username.trim()}
            >
              <Zap className="mr-2 h-5 w-5" />
              Connect Now
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-xs">
                <div className="text-accent font-bold">12,847</div>
                <div className="text-muted-foreground">Online Now</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-secondary" />
              <div className="text-xs">
                <div className="text-accent font-bold">256</div>
                <div className="text-muted-foreground">Active Rooms</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <div className="text-xs">
                <div className="text-accent font-bold">LIVE</div>
                <div className="text-muted-foreground">System Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p className="font-mono">[ NO REGISTRATION REQUIRED ]</p>
          <p className="font-mono">[ ANONYMOUS & FREE FOREVER ]</p>
          <p className="text-primary animate-flicker">█</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
