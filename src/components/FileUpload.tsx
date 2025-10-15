import { useState, useRef } from "react";
import { Paperclip, X, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUploaded: (url: string, name: string, type: string) => void;
}

export const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      onFileUploaded(publicUrl, selectedFile.name, selectedFile.type);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {selectedFile ? (
        <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded">
          <FileIcon className="h-4 w-4" />
          <span className="text-sm truncate max-w-[150px]">
            {selectedFile.name}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedFile(null)}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Send"}
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
