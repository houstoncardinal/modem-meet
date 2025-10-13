export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          animation: "grid-move 20s linear infinite",
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${10 + Math.random() * 20}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.3 + Math.random() * 0.3,
          }}
        />
      ))}

      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px] opacity-10 animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary rounded-full blur-[120px] opacity-10 animate-pulse"
        style={{ animationDuration: "10s", animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-10 animate-pulse"
        style={{ animationDuration: "12s", animationDelay: "4s" }}
      />

      {/* Animated lines */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`line-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{
            width: "100%",
            top: `${20 + i * 20}%`,
            animation: `slide ${5 + i * 2}s linear infinite`,
            animationDelay: `${i * 0.5}s`,
            opacity: 0.2,
          }}
        />
      ))}

      <style>
        {`
          @keyframes grid-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-10px) translateX(-10px); }
            75% { transform: translateY(-30px) translateX(5px); }
          }

          @keyframes slide {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 0.2; }
            100% { transform: translateX(100%); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};
