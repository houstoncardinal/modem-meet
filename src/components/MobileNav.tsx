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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
