import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  AlertTriangle,
  Shield,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  username: string;
  email?: string;
  status: string;
  created_at: string;
  roles: string[];
}

interface Room {
  id: string;
  name: string;
  category: string;
  created_at: string;
  member_count: number;
}

interface Report {
  id: string;
  message_id: string;
  reported_by: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_username: string;
  message_content: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !roleLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/rooms");
    }
  }, [authLoading, roleLoading, isAdmin, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchRooms(), fetchReports()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            ...profile,
            roles: rolesData?.map((r) => r.role) || [],
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, category, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const roomsWithCounts = await Promise.all(
        (data || []).map(async (room) => {
          const { count } = await supabase
            .from("room_members")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id);

          return { ...room, member_count: count || 0 };
        })
      );

      setRooms(roomsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error fetching rooms",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reported_messages")
        .select(`
          *,
          profiles!reported_messages_reported_by_fkey(username),
          messages(content)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedReports = (data || []).map((report: any) => ({
        id: report.id,
        message_id: report.message_id,
        reported_by: report.reported_by,
        reason: report.reason,
        status: report.status,
        created_at: report.created_at,
        reporter_username: report.profiles?.username || "Unknown",
        message_content: report.messages?.content || "[deleted]",
      }));

      setReports(formattedReports);
    } catch (error: any) {
      toast({
        title: "Error fetching reports",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Remove existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Add new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: userId, 
          role: newRole as "admin" | "moderator" | "user"
        });

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) throw error;

      toast({
        title: "Room deleted",
        description: "Room has been deleted successfully",
      });

      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error deleting room",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("reported_messages")
        .update({
          status,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Report updated",
        description: `Report has been ${status}`,
      });

      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error updating report",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-primary animate-flicker">Loading...</p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 scanline relative">
      <AnimatedBackground />
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <div className="border-2 border-primary bg-card p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/rooms")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary text-glow-cyan" />
              <h1 className="text-2xl font-bold text-primary text-glow-cyan">
                ADMIN PANEL
              </h1>
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="rooms">
              <MessageSquare className="h-4 w-4 mr-2" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="reports">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reports ({reports.filter((r) => r.status === "pending").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-primary"
            />

            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-2 border-primary p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">
                        {user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))}
                      <Select
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Set role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <Input
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-primary"
            />

            <div className="space-y-2">
              {filteredRooms.map((room) => (
                <Card key={room.id} className="border-2 border-primary p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{room.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.category} • {room.member_count} members
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the room and all its
                            messages. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="space-y-2">
              {reports
                .filter((r) => r.status === "pending")
                .map((report) => (
                  <Card key={report.id} className="border-2 border-primary p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground">
                            Reported by: {report.reporter_username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="destructive">{report.status}</Badge>
                      </div>
                      <div className="border-l-2 border-border pl-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          Message:
                        </p>
                        <p className="text-sm text-foreground">
                          {report.message_content}
                        </p>
                      </div>
                      <div className="border-l-2 border-border pl-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          Reason:
                        </p>
                        <p className="text-sm text-foreground">
                          {report.reason}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleResolveReport(report.id, "resolved")
                          }
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResolveReport(report.id, "dismissed")
                          }
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

              {reports.filter((r) => r.status === "pending").length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No pending reports
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
