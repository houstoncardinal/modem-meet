import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

export const UserAvatar = ({
  username,
  avatarUrl,
  size = "md",
  className,
  onClick,
}: UserAvatarProps) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-xl",
    xl: "w-24 h-24 text-4xl",
  };

  const baseClasses = cn(
    "flex items-center justify-center font-bold transition-all",
    onClick && "cursor-pointer hover:border-secondary",
    sizeClasses[size],
    className
  );

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${username}'s avatar`}
        onClick={onClick}
        className={cn(
          baseClasses,
          "object-cover border-2 border-primary"
        )}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        baseClasses,
        "bg-primary/20 border-2 border-primary text-primary rounded-none"
      )}
    >
      {username[0]?.toUpperCase() || "?"}
    </div>
  );
};
