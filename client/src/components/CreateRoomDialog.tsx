import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

export function CreateRoomDialog() {
  const [roomName, setRoomName] = useState("");
  const [service, setService] = useState("");
  const [url, setUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = () => {
    console.log('Create room:', { roomName, service, url, isPrivate });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-2xl" data-testid="button-create-room">
          <Plus className="mr-2 h-5 w-5" />
          Create Watch Party
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create a Watch Party</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
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
            <Label htmlFor="service">Streaming Service</Label>
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
            <Label htmlFor="url">Movie/Show URL</Label>
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
          
          <Button onClick={handleCreate} className="w-full h-12 rounded-2xl" data-testid="button-submit-create-room">
            Create Room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
