// client/src/pages/dashboard.tsx
import { useState, useEffect } from "react";
import { Film, Home, Users, Compass, Settings, LogOut } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { RoomCard } from "@/components/RoomCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { getActiveRooms, getUserRooms, getRoomByCode } from "../services/roomService";
import { Room } from "@/types/room";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Home", icon: Home, url: "/dashboard" },
  { title: "My Rooms", icon: Film, url: "/my-rooms" },
  { title: "Friends", icon: Users, url: "/friends" },
  { title: "Discover", icon: Compass, url: "/discover" },
  { title: "Settings", icon: Settings, url: "/settings" },
];

function AppSidebar() {
  const { currentUser, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = currentUser?.displayName || "User";
  const displayEmail = currentUser?.email || "";

  return (
    <Sidebar>
      <SidebarContent className="p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Film className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">CineSync</span>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto pt-6 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser?.photoURL || undefined} />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-status-online" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/settings")} data-testid="menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = currentUser?.displayName?.split(" ")[0] || "there";

  useEffect(() => {
    loadRooms();
  }, [currentUser]);

  const loadRooms = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [active, user] = await Promise.all([
        getActiveRooms(),
        getUserRooms(currentUser.uid),
      ]);
      
      // Filter to show only public rooms or rooms user is part of
      const filteredActive = active.filter(
        room => !room.isPrivate || room.participants.includes(currentUser.uid)
      ).slice(0, 6);
      
      setActiveRooms(filteredActive);
      setUserRooms(user.slice(0, 6));
    } catch (error) {
      console.error("Error loading rooms:", error);
      toast({
        title: "Failed to load rooms",
        description: "Please refresh the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Enter a room code",
        description: "Please enter a valid room code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);

    try {
      const room = await getRoomByCode(joinCode.trim().toUpperCase());

      if (!room) {
        toast({
          title: "Room not found",
          description: "Please check the code and try again",
          variant: "destructive",
        });
        return;
      }

      if (room.isPrivate && !room.participants.includes(currentUser!.uid)) {
        toast({
          title: "Private room",
          description: "You need an invitation to join this room",
          variant: "destructive",
        });
        return;
      }

      setLocation(`/room/${room.id}`);
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Failed to join room",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const style = {
    "--sidebar-width": "18rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="font-display font-bold text-4xl mb-2">Welcome back, {displayName}!</h1>
                  <p className="text-muted-foreground">Ready to watch something together?</p>
                </div>
                <CreateRoomDialog />
              </div>

              <div className="flex gap-3">
                <Input 
                  placeholder="Join with room code..." 
                  className="h-12 rounded-xl flex-1"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
                  disabled={isJoining}
                  data-testid="input-join-code"
                />
                <Button 
                  className="h-12 rounded-xl px-8" 
                  onClick={handleJoinByCode}
                  disabled={isJoining}
                  data-testid="button-join"
                >
                  {isJoining ? "Joining..." : "Join"}
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading rooms...</p>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-semibold text-2xl">Active Rooms</h2>
                      <Badge variant="secondary" className="rounded-full">
                        <div className="h-2 w-2 rounded-full bg-status-online mr-2" />
                        {activeRooms.length} live
                      </Badge>
                    </div>
                    {activeRooms.length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeRooms.map((room) => (
                          <RoomCard
                            key={room.id}
                            roomName={room.roomName}
                            service={room.service}
                            participants={room.participants.length}
                            isPrivate={room.isPrivate}
                            roomId={room.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No active rooms right now</p>
                    )}
                  </div>

                  <div>
                    <h2 className="font-display font-semibold text-2xl mb-4">My Recent Rooms</h2>
                    {userRooms.length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userRooms.map((room) => (
                          <RoomCard
                            key={room.id}
                            roomName={room.roomName}
                            service={room.service}
                            participants={room.participants.length}
                            isPrivate={room.isPrivate}
                            roomId={room.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">You haven't created any rooms yet</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}