import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReportMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
}

export const ReportMessageDialog = ({
  open,
  onOpenChange,
  messageId,
}: ReportMessageDialogProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReport = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for reporting this message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("reported_messages").insert({
        message_id: messageId,
        reported_by: user.id,
        reason: reason.trim(),
      });

      if (error) throw error;

      toast({
        title: "Message reported",
        description: "Thank you for reporting. Moderators will review this.",
      });

      setReason("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error reporting message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Message</DialogTitle>
          <DialogDescription>
            Help us understand why this message should be reviewed by moderators
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Describe why this message violates community guidelines..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          className="border-2 border-primary"
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReport} disabled={loading}>
            {loading ? "Reporting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
