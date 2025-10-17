import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Image as ImageIcon,
  MapPin,
  Hash,
  Smile,
  X,
  Loader2,
} from "lucide-react";

const FEELINGS = [
  { value: "happy", label: "Happy 😊", icon: "😊" },
  { value: "excited", label: "Excited 🎉", icon: "🎉" },
  { value: "loved", label: "Loved 💖", icon: "💖" },
  { value: "blessed", label: "Blessed 🙏", icon: "🙏" },
  { value: "grateful", label: "Grateful 🌟", icon: "🌟" },
  { value: "motivated", label: "Motivated 💪", icon: "💪" },
  { value: "chill", label: "Chill 😎", icon: "😎" },
  { value: "thoughtful", label: "Thoughtful 🤔", icon: "🤔" },
  { value: "creative", label: "Creative 🎨", icon: "🎨" },
  { value: "adventurous", label: "Adventurous 🏔️", icon: "🏔️" },
];

interface CreatePostDialogProps {
  onPostCreated?: () => void;
}

export const CreatePostDialog = ({ onPostCreated }: CreatePostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [feeling, setFeeling] = useState<string>("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).slice(0, 5 - images.length);
      setImages([...images, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
          );
          const data = await response.json();
          setLocation(
            data.display_name || `${position.coords.latitude}, ${position.coords.longitude}`
          );
        } catch (error) {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        } finally {
          setGettingLocation(false);
        }
      },
      () => {
        toast({
          title: "Location access denied",
          description: "Please enable location access in your browser",
          variant: "destructive",
        });
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast({
        title: "Empty post",
        description: "Please add some content or images",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setUploading(true);
    try {
      let imageUrls: string[] = [];

      // Upload images if any
      if (images.length > 0) {
        const uploadPromises = images.map(async (image) => {
          const fileExt = image.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("chat-attachments")
            .upload(filePath, image);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("chat-attachments").getPublicUrl(filePath);

          return publicUrl;
        });

        imageUrls = await Promise.all(uploadPromises);
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: content.trim(),
          feeling: feeling || null,
          location: location || null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add tags
      if (tags.length > 0 && post) {
        const tagInserts = tags.map((tag) => ({
          post_id: post.id,
          tag_name: tag.toLowerCase(),
        }));

        const { error: tagsError } = await supabase
          .from("post_tags")
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community",
      });

      // Reset form
      setContent("");
      setFeeling("");
      setLocation("");
      setTags([]);
      setImages([]);
      setOpen(false);

      if (onPostCreated) onPostCreated();
    } catch (error: any) {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full h-14 w-14 shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content */}
          <div>
            <Label>What's on your mind?</Label>
            <Textarea
              placeholder="Share your thoughts with the community..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] mt-2 border-2 border-primary/20 focus:border-primary"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/5000
            </p>
          </div>

          {/* Feeling */}
          <div>
            <Label className="flex items-center gap-2">
              <Smile className="h-4 w-4" />
              Feeling
            </Label>
            <Select value={feeling} onValueChange={setFeeling}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="How are you feeling?" />
              </SelectTrigger>
              <SelectContent>
                {FEELINGS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add a location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-2 border-primary/20 focus:border-primary"
              />
              <Button
                type="button"
                variant="outline"
                onClick={getLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Tags
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add tags (e.g., travel, food, tech)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="border-2 border-primary/20 focus:border-primary"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images (Max 5)
            </Label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
              disabled={images.length >= 5}
            />
            <label htmlFor="image-upload">
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                disabled={images.length >= 5}
                asChild
              >
                <span>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Images ({images.length}/5)
                </span>
              </Button>
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded border-2 border-primary/20"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={uploading || (!content.trim() && images.length === 0)}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              "Share Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
