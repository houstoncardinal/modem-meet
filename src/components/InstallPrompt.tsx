import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Only show if user hasn't dismissed before
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 p-4 bg-card/95 backdrop-blur-sm border-primary/20">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Install ChatLink</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Install our app for a better experience with offline access and quick launch from your home screen.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="flex-1">
              Install
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="ghost">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
