// client/src/pages/room.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoTile } from "@/components/VideoTile";
import { ChatContainer } from "@/components/ChatContainer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Film, Mic, MicOff, Video, VideoOff, Share2, Settings as SettingsIcon, LogOut, Copy, Phone, PhoneOff } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import useWebRTC from "@/hooks/useWebRTC";
import { getRoomById, joinRoom, leaveRoom } from "../services/roomService";
import { Room } from "@/types/room";
import { useToast } from "@/hooks/use-toast";

export default function RoomPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  // WebRTC Hook
  const {
    connect,
    disconnect,
    localStream,
    remotePeers,
    isConnected,
    isInitializing,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
  } = useWebRTC(id!, currentUser?.uid || "");

  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Load room info
  useEffect(() => {
    loadRoom();
  }, [id, currentUser]);

  const loadRoom = async () => {
    if (!id || !currentUser) return;

    try {
      setLoading(true);
      const roomData = await getRoomById(id);

      if (!roomData) {
        toast({
          title: "Room not found",
          description: "This room may have been deleted",
          variant: "destructive",
        });
        setLocation("/dashboard");
        return;
      }

      if (!roomData.isActive) {
        toast({
          title: "Room ended",
          description: "This room is no longer active",
          variant: "destructive",
        });
        setLocation("/dashboard");
        return;
      }

      if (!roomData.participants.includes(currentUser.uid)) {
        await joinRoom(id, currentUser.uid);
        roomData.participants.push(currentUser.uid);
      }

      setRoom(roomData);
    } catch (error) {
      console.error("Error loading room:", error);
      toast({
        title: "Failed to load room",
        description: "Please try again",
        variant: "destructive",
      });
      setLocation("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!id || !currentUser) return;

    try {
      if (isConnected) {
        await disconnect();
      }
      await leaveRoom(id, currentUser.uid);
      toast({
        title: "Left room",
        description: "You have left the watch party",
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error("Error leaving room:", error);
      toast({
        title: "Error leaving room",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCopyRoomCode = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText((room as any).roomCode || id!);
      toast({
        title: "Room code copied",
        description: "Share it with your friends",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const handleConnectCall = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center cursor-pointer">
              <Film className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
          <div>
            <h1 className="font-display font-semibold text-lg">
              {room.roomName}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {room.service}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {room.participants.length} participants
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleCopyRoomCode}>
            <Copy className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <SettingsIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLeaveRoom}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-muted/30 flex items-center justify-center p-6">
            <div className="aspect-video w-full max-w-4xl">
              <VideoPlayer
                url={room.url}
                service={room.service}
                roomId={id!}
                userId={currentUser!.uid}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3">
              {!isConnected ? (
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleConnectCall}
                  disabled={isInitializing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isInitializing ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                </Button>
              ) : (
                <Button variant="destructive" size="icon" onClick={handleConnectCall}>
                  <PhoneOff className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant={!isAudioEnabled ? "destructive" : "secondary"}
                size="icon"
                onClick={toggleAudio}
                disabled={!isConnected}
              >
                {!isAudioEnabled ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                variant={!isVideoEnabled ? "destructive" : "secondary"}
                size="icon"
                onClick={toggleVideo}
                disabled={!isConnected}
              >
                {!isVideoEnabled ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>

              <Button variant="secondary" size="icon" disabled={!isConnected}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 min-w-[320px] border-l border-border flex flex-col bg-card max-h-full">
          {/* Participants Section */}
          <div className="p-4 border-b border-border shrink-0">
            <h2 className="font-semibold mb-3 flex items-center justify-between">
              <span>Participants</span>
              {isConnected && <span className="text-green-500 text-sm flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </span>}
            </h2>
            
            {/* Debug Info */}
            {isConnected && (
              <div className="mb-2 p-2 bg-muted/50 rounded text-xs">
                <div>Local Stream: {localStream ? '✅' : '❌'}</div>
                <div>Remote Peers: {remotePeers.length}</div>
                {remotePeers.map((p, i) => (
                  <div key={i}>Peer {i + 1}: {p.peerId.slice(0, 8)} - Stream: {p.stream ? '✅' : '❌'}</div>
                ))}
              </div>
            )}
            
            {/* Video Grid */}
            {isConnected ? (
              <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                {/* Local Video */}
                <VideoTile
                  name={currentUser?.displayName || "You"}
                  avatar={currentUser?.photoURL || undefined}
                  isMuted={!isAudioEnabled}
                  stream={localStream || undefined}
                  isLocal={true}
                />

                {/* Remote Peers */}
                {remotePeers.length > 0 ? (
                  remotePeers.map((peer: { peerId: string; stream: MediaStream }) => (
                    <VideoTile
                      key={peer.peerId}
                      name={`User ${peer.peerId.slice(0, 6)}`}
                      isMuted={false}
                      stream={peer.stream}
                      isLocal={false}
                    />
                  ))
                ) : (
                  <div className="col-span-1 flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                    <p className="text-xs text-muted-foreground text-center mb-2">
                      Waiting for others...
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={async () => {
                        await disconnect();
                        setTimeout(() => connect(), 500);
                      }}
                      className="h-7 text-xs"
                    >
                      Refresh
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="col-span-2 text-center p-6 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                <Phone className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Join Video Call
                </p>
                <p className="text-xs text-muted-foreground">
                  Click the green button below to start
                </p>
              </div>
            )}

            {/* Participant Count */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {isConnected ? (
                  <>
                    <span className="font-semibold text-foreground">{1 + remotePeers.length}</span> in call
                    {room.participants.length > (1 + remotePeers.length) && (
                      <span className="ml-1">
                        • <span className="font-semibold text-foreground">{room.participants.length - (1 + remotePeers.length)}</span> in room
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{room.participants.length}</span> in room
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 min-h-0">
            <ChatContainer
              roomId={id!}
              currentUserId={currentUser!.uid}
              currentUserName={currentUser?.displayName || "Anonymous"}
              currentUserAvatar={currentUser?.photoURL || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}