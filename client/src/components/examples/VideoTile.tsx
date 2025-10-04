// client/src/components/VideoTile.tsx
import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  name: string;
  avatar?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  stream?: MediaStream;
  isLocal?: boolean;
}

export function VideoTile({ 
  name, 
  avatar, 
  isMuted = false, 
  isVideoOff = false,
  stream,
  isLocal = false
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
      {/* Video element */}
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local video to prevent echo
          className={cn(
            "w-full h-full object-cover",
            isLocal && "scale-x-[-1]" // Mirror local video
          )}
        />
      ) : (
        // Show avatar when video is off
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center justify-between">
          <span className="text-white text-xs font-medium truncate">
            {name} {isLocal && "(You)"}
          </span>
          <div className="flex items-center gap-1">
            {isMuted ? (
              <div className="bg-red-500 rounded-full p-1">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            ) : (
              <div className="bg-green-500 rounded-full p-1">
                <Mic className="h-3 w-3 text-white" />
              </div>
            )}
            {isVideoOff && (
              <div className="bg-red-500 rounded-full p-1">
                <VideoOff className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speaking indicator */}
      {!isMuted && stream && (
        <div className="absolute top-2 left-2">
          <div className="bg-green-500 rounded-full p-1 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}