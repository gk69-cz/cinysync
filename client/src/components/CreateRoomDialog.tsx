// client/src/components/CreateRoomDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Copy, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createRoom } from "@/services/roomService";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function CreateRoomDialog() {
  const [roomName, setRoomName] = useState("");
  const [service, setService] = useState("");
  const [url, setUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [roomLink, setRoomLink] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleCreate = async () => {
    if (!roomName.trim() || !service || !url.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "Please log in to create a room",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { roomId, roomCode: code } = await createRoom({
        roomName: roomName.trim(),
        service: service as 'netflix' | 'prime' | 'disney',
        url: url.trim(),
        isPrivate,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || "Anonymous",
        maxParticipants: 10,
      });

      const link = `${window.location.origin}/room/${roomId}`;
      setRoomLink(link);
      setRoomCode(code);
      setShowSuccess(true);

      toast({
        title: "Room created!",
        description: "Your watch party is ready",
      });
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Failed to create room",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share it with your friends",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast({
        title: "Code copied!",
        description: "Share it with your friends",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const handleJoinRoom = () => {
    setLocation(roomLink.replace(window.location.origin, ""));
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setRoomName("");
    setService("");
    setUrl("");
    setIsPrivate(false);
    setShowSuccess(false);
    setRoomLink("");
    setRoomCode("");
    setCopied(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-2xl" data-testid="button-create-room">
          <Plus className="mr-2 h-5 w-5" />
          Create Watch Party
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {showSuccess ? "Room Created!" : "Create a Watch Party"}
          </DialogTitle>
        </DialogHeader>
        
        {!showSuccess ? (
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name *</Label>
              <Input
                id="room-name"
                placeholder="Friday Night Movie"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="h-12 rounded-xl"
                data-testid="input-room-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">Streaming Service *</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="h-12 rounded-xl" data-testid="select-service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="netflix">Netflix</SelectItem>
                  <SelectItem value="prime">Prime Video</SelectItem>
                  <SelectItem value="disney">Disney+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">Movie/Show URL *</Label>
              <Input
                id="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 rounded-xl"
                data-testid="input-url"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="private">Private Room</Label>
                <p className="text-sm text-muted-foreground">Only invited friends can join</p>
              </div>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                data-testid="switch-private"
              />
            </div>
            
            <Button 
              onClick={handleCreate} 
              className="w-full h-12 rounded-2xl" 
              disabled={isCreating}
              data-testid="button-submit-create-room"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Room Code</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-background px-4 py-3 rounded-lg font-mono text-lg">
                    {roomCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="h-12 w-12"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Room Link</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={roomLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="h-10 w-10"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleJoinRoom}
                className="flex-1 h-12 rounded-2xl"
              >
                Join Room Now
              </Button>
              <Button
                onClick={() => handleOpenChange(false)}
                variant="outline"
                className="flex-1 h-12 rounded-2xl"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}