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
  const displayName = currentUser?.displayName?.split(" ")[0] || "there";

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
                  data-testid="input-join-code"
                />
                <Button className="h-12 rounded-xl px-8" data-testid="button-join">Join</Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-2xl">Active Rooms</h2>
                  <Badge variant="secondary" className="rounded-full">
                    <div className="h-2 w-2 rounded-full bg-status-online mr-2" />
                    5 live
                  </Badge>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <RoomCard
                    roomName="Friday Night Movie"
                    service="Netflix"
                    participants={5}
                    isPrivate={false}
                  />
                  <RoomCard
                    roomName="Action Marathon"
                    service="Prime Video"
                    participants={3}
                    isPrivate={true}
                  />
                  <RoomCard
                    roomName="Disney Classics"
                    service="Disney+"
                    participants={8}
                    isPrivate={false}
                  />
                </div>
              </div>

              <div>
                <h2 className="font-display font-semibold text-2xl mb-4">My Recent Rooms</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <RoomCard
                    roomName="Last Week's Thriller"
                    service="Netflix"
                    participants={0}
                    isPrivate={true}
                  />
                  <RoomCard
                    roomName="Weekend Comedy"
                    service="Prime Video"
                    participants={0}
                    isPrivate={false}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
