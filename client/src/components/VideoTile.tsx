import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff } from "lucide-react";

interface VideoTileProps {
  name: string;
  avatar?: string;
  isMuted?: boolean;
  isScreenSharing?: boolean;
}

export function VideoTile({ name, avatar, isMuted = false, isScreenSharing = false }: VideoTileProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className="relative aspect-video overflow-hidden bg-muted" data-testid={`video-tile-${name.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="w-full h-full flex items-center justify-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <Badge className="backdrop-blur-md bg-background/80 text-xs" data-testid={`text-name-${name.toLowerCase().replace(/\s/g, '-')}`}>
          {name}
        </Badge>
        
        <div className="flex gap-1">
          {isScreenSharing && (
            <Badge className="backdrop-blur-md bg-accent/80 text-accent-foreground text-xs">
              Sharing
            </Badge>
          )}
          {isMuted ? (
            <MicOff className="h-4 w-4 text-destructive" />
          ) : (
            <Mic className="h-4 w-4 text-primary" />
          )}
        </div>
      </div>
    </Card>
  );
}
