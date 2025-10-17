import { NavLink, useLocation } from "react-router-dom";
import { Home, Compass, MessageCircle, Mail, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Don't show on auth or landing pages
  if (!user || location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  const navItems = [
    { to: "/rooms", icon: Home, label: "Rooms" },
    { to: "/explore", icon: Compass, label: "Explore" },
    { to: "/messages", icon: Mail, label: "Messages" },
    { to: `/profile/${user.id}`, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Scanline effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/98 to-transparent pointer-events-none scanline opacity-30" />
      
      {/* Main nav container - Terminal aesthetic */}
      <div className="relative border-t-2 border-primary bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {/* Top glow line - sharp neon effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_hsl(var(--primary))]" />
        
        {/* Grid pattern background for retro feel */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center w-full h-12 transition-all duration-200 group"
            >
              {({ isActive }) => (
                <>
                  {/* Sharp terminal box */}
                  <div
                    className={`absolute inset-1 transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 border-2 border-primary shadow-[0_0_12px_hsl(var(--primary)/0.5),inset_0_0_12px_hsl(var(--primary)/0.2)]"
                        : "bg-card/30 border border-border group-hover:border-primary/50 group-hover:bg-primary/5 group-hover:shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
                    }`}
                  />
                  
                  {/* Terminal top bar accent */}
                  {isActive && (
                    <div className="absolute top-1 left-1 right-1 h-[2px] bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                  )}
                  
                  {/* Content - Terminal style */}
                  <div className="relative z-10 flex flex-col items-center gap-0.5">
                    <item.icon
                      className={`h-5 w-5 transition-all duration-200 ${
                        isActive
                          ? "text-primary text-glow-cyan"
                          : "text-muted-foreground group-hover:text-primary/80"
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider transition-all duration-200 ${
                        isActive
                          ? "text-primary font-bold"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  
                  {/* Sharp click effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 scale-0 group-active:scale-100 transition-transform duration-150" />
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>
        
        {/* Bottom terminal line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border" />
      </div>
    </nav>
  );
};

export default MobileNav;
