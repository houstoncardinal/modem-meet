import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to ChatLink. Redirecting...",
        });

        setTimeout(() => navigate("/rooms"), 1000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });

        navigate("/rooms");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 scanline">
      <Card className="w-full max-w-md border-2 border-primary bg-card p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-cyan">
            {isSignUp ? "CREATE ACCOUNT" : "LOGIN"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isSignUp ? "Join the network" : "Access the grid"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm text-accent uppercase tracking-wider">
                Username
              </label>
              <Input
                type="text"
                placeholder="enter_username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                className="border-2 border-primary bg-background rounded-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Email
            </label>
            <Input
              type="email"
              placeholder="email@domain.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="border-2 border-primary bg-background rounded-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
              className="border-2 border-primary bg-background rounded-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            <Zap className="mr-2 h-5 w-5" />
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Login"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:text-secondary transition-colors"
          >
            {isSignUp
              ? "Already have an account? Login"
              : "Need an account? Sign up"}
          </button>
        </div>

        <div className="pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
