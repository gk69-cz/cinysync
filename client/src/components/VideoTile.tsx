// client/src/components/VideoTile.tsx
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  name: string;
  avatar?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  isLocal?: boolean;
  stream?: MediaStream;
}

export function VideoTile({ 
  name, 
  avatar, 
  isMuted = false, 
  isVideoOff = false,
  isScreenSharing = false,
  isLocal = false,
  stream 
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Set up video stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    // Cleanup
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <Card 
      className="relative aspect-[16/9] overflow-hidden bg-black border-2 border-border w-full h-[400px] sm:h-[500px]" 
      data-testid={`video-tile-${name.toLowerCase().replace(/\s/g, '-')}`}
    >
      {/* Video Element or Avatar Fallback */}
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local video to prevent echo
          className={cn(
            "w-full h-full object-cover",
            isLocal && "scale-x-[-1]" // Mirror local video horizontally
          )}
        />
      ) : (
        // Show avatar when no stream or video is off
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <div className="text-center">
            <Avatar className="h-20 w-20 mx-auto mb-2 border-2 border-primary/20">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isVideoOff && (
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <VideoOff className="h-4 w-4" />
                <span className="text-xs">Camera off</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Overlay with name and status */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
        <div className="flex items-center justify-between">
          <Badge 
            className="backdrop-blur-sm bg-black/40 text-white border-white/20 text-xs font-medium" 
            data-testid={`text-name-${name.toLowerCase().replace(/\s/g, '-')}`}
          >
            {name} {isLocal && "(You)"}
          </Badge>
          
          <div className="flex gap-2 items-center">
            {isScreenSharing && (
              <Badge className="backdrop-blur-sm bg-blue-500/80 text-white border-blue-400/30 text-xs">
                📺 Sharing
              </Badge>
            )}
            
            {/* Audio indicator */}
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full transition-colors",
              isMuted ? "bg-red-500/90" : "bg-green-500/90"
            )}>
              {isMuted ? (
                <MicOff className="h-4 w-4 text-white" />
              ) : (
                <Mic className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Speaking indicator - shows when mic is active and stream exists */}
      {!isMuted && stream && !isVideoOff && (
        <div className="absolute top-3 left-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
          </div>
        </div>
      )}

      {/* Connection quality indicator (optional) */}
      {stream && (
        <div className="absolute top-3 right-3">
          <div className="flex gap-0.5">
            {[1, 2, 3].map((bar) => (
              <div
                key={bar}
                className={cn(
                  "w-1 rounded-full bg-white/60 transition-all",
                  bar === 1 && "h-2",
                  bar === 2 && "h-3",
                  bar === 3 && "h-4"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}