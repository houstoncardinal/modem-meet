import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
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
            emailRedirectTo: `${window.location.origin}/rooms`,
            data: {
              username: formData.username,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Check your email!",
          description: "We sent you a confirmation link.",
        });
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/auth`,
        }
      );

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We sent you a password reset link.",
      });
      setShowResetPassword(false);
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
    <div className="min-h-screen flex items-center justify-center p-4 scanline relative">
      <AnimatedBackground />
      <Card className="w-full max-w-md border-2 border-primary bg-card p-8 space-y-6 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-cyan">
            {showResetPassword ? "RESET PASSWORD" : isSignUp ? "CREATE ACCOUNT" : "LOGIN"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {showResetPassword
              ? "Enter your email to receive a reset link"
              : isSignUp
              ? "Join the network"
              : "Access the grid"}
          </p>
        </div>

        {showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="text-sm text-primary hover:text-secondary transition-colors"
              >
                ← Back to login
              </button>
            </div>
          </form>
        ) : (
          <>
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

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:text-secondary transition-colors block w-full"
              >
                {isSignUp
                  ? "Already have an account? Login"
                  : "Need an account? Sign up"}
              </button>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-primary hover:text-secondary transition-colors block w-full"
                >
                  Forgot password?
                </button>
              )}
            </div>
          </>
        )}

        <div className="pt-4 border-t border-border space-y-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors block"
          >
            ← Back to home
          </button>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => navigate("/terms")}
              className="text-primary hover:underline"
            >
              Terms of Service
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={() => navigate("/privacy")}
              className="text-primary hover:underline"
            >
              Privacy Policy
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
