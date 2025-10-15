import { useState } from "react";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageActionsProps {
  messageId: string;
  content: string;
  isOwnMessage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const MessageActions = ({
  messageId,
  content,
  isOwnMessage,
  onEdit,
  onDelete,
}: MessageActionsProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOwnMessage) return null;

  const handleEdit = async () => {
    if (!editedContent.trim() || editedContent === content) {
      setIsEditing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("messages")
        .update({
          content: editedContent,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;

      setIsEditing(false);
      onEdit?.();
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("messages")
        .update({
          deleted_at: new Date().toISOString(),
          content: "[deleted]",
        })
        .eq("id", messageId);

      if (error) throw error;

      setShowDeleteDialog(false);
      onDelete?.();
      toast({
        title: "Message deleted",
        description: "Your message has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2 mt-2">
        <Input
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleEdit();
            }
            if (e.key === "Escape") {
              setIsEditing(false);
              setEditedContent(content);
            }
          }}
          className="flex-1"
          autoFocus
        />
        <Button size="sm" onClick={handleEdit}>
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsEditing(false);
            setEditedContent(content);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
