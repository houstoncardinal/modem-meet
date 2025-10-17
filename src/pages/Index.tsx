import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, Zap } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

const Index = () => {
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 scanline relative">
      <AnimatedBackground />
      <div className="w-full max-w-2xl space-y-8 animate-slide-up relative z-10">
        {/* ASCII Art Logo */}
        <div className="text-center overflow-hidden">
          <div className="relative inline-block w-full">
            {/* Glow background effect */}
            <div className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />
            
            <pre className="text-primary text-glow-cyan text-[8px] xs:text-[10px] sm:text-sm md:text-base lg:text-lg inline-block animate-flicker font-bold relative z-10 overflow-x-auto max-w-full leading-tight tracking-tighter">
{`
 ██████╗██╗  ██╗ █████╗ ████████╗
██╔════╝██║  ██║██╔══██╗╚══██╔══╝
██║     ███████║███████║   ██║   
██║     ██╔══██║██╔══██║   ██║   
╚██████╗██║  ██║██║  ██║   ██║   
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
██╗     ██╗███╗   ██╗██╗  ██╗
██║     ██║████╗  ██║██║ ██╔╝
██║     ██║██╔██╗ ██║█████╔╝ 
██║     ██║██║╚██╗██║██╔═██╗ 
███████╗██║██║ ╚████║██║  ██╗
╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
`}
            </pre>
          </div>
          
          {/* Subtitle with animated typing effect */}
          <div className="mt-6 space-y-2">
            <p className="text-secondary text-glow-magenta text-xs sm:text-sm md:text-base font-sans font-bold">
              {'>>> RETRO CHAT NETWORK v2.0 <<<'}
            </p>
            <div className="flex items-center justify-center gap-2 text-accent text-xs animate-pulse">
              <span className="inline-block w-2 h-2 bg-accent rounded-full animate-ping" />
              <span>SYSTEM ONLINE</span>
              <span className="inline-block w-2 h-2 bg-accent rounded-full animate-ping" />
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="border-2 border-primary bg-card/80 backdrop-blur p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.2)]">
          {/* Animated top border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent animate-pulse"></div>
          
          {/* Side glows */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-primary to-transparent opacity-50 animate-pulse" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-secondary to-transparent opacity-50 animate-pulse" />
          
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-primary text-glow-cyan font-sans animate-fade-in">
              CONNECT TO THE GRID
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Enter your handle to join thousands of users in real-time chat rooms
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleJoin}
              size="lg"
              className="w-full group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse relative z-10" />
              <span className="relative z-10">Get Started</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-xs">
                <div className="text-accent font-bold animate-flicker">ONLINE</div>
                <div className="text-muted-foreground">Live Users</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-secondary" />
              <div className="text-xs">
                <div className="text-accent font-bold animate-flicker">ACTIVE</div>
                <div className="text-muted-foreground">Chat Rooms</div>
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
          <p className="font-mono">[ REAL-TIME MESSAGING ]</p>
          <p className="font-mono">[ SECURE & PRIVATE ]</p>
          <p className="text-primary animate-flicker">█</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
