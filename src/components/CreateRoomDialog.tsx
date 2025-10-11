import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const categories = ["General", "Technology", "Entertainment", "Gaming", "Creative", "Education"];

export const CreateRoomDialog = ({ onRoomCreated }: { onRoomCreated: () => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    topic: "",
    category: "General",
    isPrivate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("rooms").insert({
        name: formData.name.toLowerCase().replace(/\s+/g, "-"),
        topic: formData.topic,
        category: formData.category,
        is_private: formData.isPrivate,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Room created!",
        description: `${formData.name} is now live.`,
      });

      setOpen(false);
      setFormData({ name: "", topic: "", category: "General", isPrivate: false });
      onRoomCreated();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus className="mr-2 h-4 w-4" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-primary bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary text-glow-cyan">
            CREATE NEW ROOM
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Room Name
            </label>
            <Input
              placeholder="my-awesome-room"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="border-2 border-primary bg-background rounded-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Topic
            </label>
            <Textarea
              placeholder="What's this room about?"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
              className="border-2 border-primary bg-background rounded-none min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Category
            </label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="border-2 border-primary bg-background rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-accent uppercase tracking-wider">
              Private Room
            </label>
            <Switch
              checked={formData.isPrivate}
              onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
