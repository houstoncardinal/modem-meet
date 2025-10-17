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
      {/* Glow effect background */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
      
      {/* Main nav container with 3D effect */}
      <div className="relative border-t-2 border-primary/30 bg-gradient-to-b from-card/98 to-card backdrop-blur-xl supports-[backdrop-filter]:bg-card/95">
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-pulse" />
        
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center w-full h-14 transition-all duration-300 group ${
                  isActive ? "scale-105" : "scale-100 hover:scale-105"
                }`
              }
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {({ isActive }) => (
                <>
                  {/* 3D Card background */}
                  <div
                    className={`absolute inset-1 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-2 border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] scale-100"
                        : "bg-gradient-to-br from-muted/40 to-muted/20 border border-border/30 group-hover:border-primary/30 group-hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] scale-95 group-hover:scale-100"
                    }`}
                  />
                  
                  {/* Inset shadow for depth */}
                  <div
                    className={`absolute inset-1 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]"
                        : "shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)] group-hover:shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)]"
                    }`}
                  />
                  
                  {/* Active indicator glow */}
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-pulse" />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <item.icon
                      className={`h-5 w-5 transition-all duration-300 ${
                        isActive
                          ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
                          : "text-muted-foreground group-hover:text-foreground group-hover:drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.4)]"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-medium transition-all duration-300 ${
                        isActive
                          ? "text-primary font-bold"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  
                  {/* Ripple effect on click */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10 scale-0 group-active:scale-100 transition-transform duration-300 rounded-2xl" />
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-b from-transparent to-background/50" />
      </div>
    </nav>
  );
};

export default MobileNav;
