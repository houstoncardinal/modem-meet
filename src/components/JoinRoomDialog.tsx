import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: (password?: string) => void;
  roomName: string;
  requiresPassword: boolean;
}

export const JoinRoomDialog = ({
  open,
  onOpenChange,
  onJoin,
  roomName,
  requiresPassword,
}: JoinRoomDialogProps) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(requiresPassword ? password : undefined);
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-primary bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary text-glow-cyan">
            Join Room
          </DialogTitle>
          <DialogDescription>
            {requiresPassword
              ? `This room requires a password to join: ${roomName}`
              : `Join ${roomName}?`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {requiresPassword && (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password"
                className="border-2 border-border rounded-none"
                required
              />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Join Room</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
