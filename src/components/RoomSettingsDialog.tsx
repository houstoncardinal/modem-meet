import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Link2, Copy, RefreshCw, Lock, Users, Ban } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "./UserAvatar";

interface RoomSettingsDialogProps {
  roomId: string;
  roomName: string;
  isPrivate: boolean;
  password?: string;
  inviteCode: string;
  userRole?: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

export const RoomSettingsDialog = ({
  roomId,
  roomName,
  isPrivate: initialIsPrivate,
  password: initialPassword,
  inviteCode: initialInviteCode,
  userRole,
}: RoomSettingsDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [password, setPassword] = useState(initialPassword || "");
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("room_members")
        .select("id, user_id, role, profiles(username, avatar_url)")
        .eq("room_id", roomId)
        .order("role");

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error("Error fetching members:", error);
    }
  };

  const handleUpdateSettings = async () => {
    if (!isOwnerOrAdmin) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          is_private: isPrivate,
          password: password || null,
        })
        .eq("id", roomId);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Room settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!isOwnerOrAdmin) return;

    try {
      const { data, error } = await supabase.rpc("regenerate_invite_code", {
        _room_id: roomId,
      });

      if (error) throw error;
      setInviteCode(data);

      toast({
        title: "Invite code regenerated",
        description: "A new invite code has been generated.",
      });
    } catch (error: any) {
      toast({
        title: "Error regenerating code",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Invite link has been copied to clipboard.",
    });
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: "member" | "moderator" | "admin" | "owner") => {
    if (!isOwnerOrAdmin) return;

    try {
      const { error } = await supabase
        .from("room_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      await fetchMembers();
      toast({
        title: "Role updated",
        description: "Member role has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwnerOrAdmin) return;

    try {
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      await fetchMembers();
      toast({
        title: "Member removed",
        description: "Member has been kicked from the room.",
      });
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBanMember = async (memberId: string, userId: string, username: string) => {
    if (!isOwnerOrAdmin) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, remove from room
      const { error: removeError } = await supabase
        .from("room_members")
        .delete()
        .eq("id", memberId);

      if (removeError) throw removeError;

      // Then add to banned list
      const { error: banError } = await supabase
        .from("banned_room_users")
        .insert({
          room_id: roomId,
          user_id: userId,
          banned_by: user.id,
          reason: "Banned by moderator",
        });

      if (banError) throw banError;

      await fetchMembers();
      toast({
        title: "Member banned",
        description: `${username} has been banned from the room.`,
      });
    } catch (error: any) {
      toast({
        title: "Error banning member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-primary bg-card max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-glow-cyan">
            Room Settings
          </DialogTitle>
          <DialogDescription>{roomName}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="invite">Invite</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="private" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private Room
                </Label>
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  disabled={!isOwnerOrAdmin || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Room Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for no password"
                  className="border-2 border-border rounded-none"
                  disabled={!isOwnerOrAdmin || loading}
                />
              </div>

              {isOwnerOrAdmin && (
                <Button onClick={handleUpdateSettings} disabled={loading}>
                  Save Settings
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Invite Link
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/join/${inviteCode}`}
                    readOnly
                    className="border-2 border-border rounded-none font-mono text-sm"
                  />
                  <Button onClick={copyInviteLink} size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Invite Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteCode}
                    readOnly
                    className="border-2 border-border rounded-none font-mono text-lg"
                  />
                  {isOwnerOrAdmin && (
                    <Button onClick={handleRegenerateCode} size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Share this link or code with others to invite them to the room.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </Label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-border rounded"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        username={member.profiles.username}
                        avatarUrl={member.profiles.avatar_url}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">{member.profiles.username}</p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    {isOwnerOrAdmin && member.role !== "owner" && (
                      <div className="flex gap-2">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateMemberRole(member.id, e.target.value as "admin" | "member" | "moderator" | "owner")
                          }
                          className="text-xs border border-border rounded px-2 py-1 bg-background"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Kick (can rejoin)"
                        >
                          Kick
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBanMember(member.id, member.user_id, member.profiles.username)}
                          className="text-destructive hover:text-destructive"
                          title="Ban (cannot rejoin)"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
