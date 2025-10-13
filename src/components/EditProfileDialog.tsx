import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  status: string;
  bio: string | null;
  interests: string[] | null;
  location: string | null;
  website: string | null;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  onProfileUpdate: () => void;
}

export const EditProfileDialog = ({
  open,
  onOpenChange,
  profile,
  onProfileUpdate,
}: EditProfileDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: profile.username,
    status: profile.status,
    bio: profile.bio || "",
    location: profile.location || "",
    website: profile.website || "",
  });
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    setFormData({
      username: profile.username,
      status: profile.status,
      bio: profile.bio || "",
      location: profile.location || "",
      website: profile.website || "",
    });
    setInterests(profile.interests || []);
  }, [profile]);

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          status: formData.status,
          bio: formData.bio || null,
          location: formData.location || null,
          website: formData.website || null,
          interests: interests.length > 0 ? interests : null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });

      onOpenChange(false);
      onProfileUpdate();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-primary bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-glow-cyan">
            EDIT PROFILE
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Username
            </label>
            <Input
              placeholder="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              className="border-2 border-primary bg-background rounded-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="border-2 border-primary bg-background rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Bio
            </label>
            <Textarea
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="border-2 border-primary bg-background rounded-none min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/500
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Location
            </label>
            <Input
              placeholder="City, Country"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="border-2 border-primary bg-background rounded-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Website
            </label>
            <Input
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              className="border-2 border-primary bg-background rounded-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-accent uppercase tracking-wider">
              Interests
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInterest())}
                className="border-2 border-primary bg-background rounded-none"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddInterest}
              >
                Add
              </Button>
            </div>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {interests.map((interest, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-primary text-primary pr-1"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
