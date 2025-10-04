// client/src/pages/room.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VideoTile } from "@/components/VideoTile";
import { ChatMessage } from "@/components/ChatMessage";
import { Film, Mic, MicOff, Video, VideoOff, Share2, Settings as SettingsIcon, LogOut, Send, Smile, Copy } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

import { getRoomById, joinRoom, leaveRoom } from "../services/roomService";
import { Room } from "@/types/room";
import { useToast } from "@/hooks/use-toast";
import { VideoPlayer } from "@/components/ui/VideoPlayer";

export default function RoomPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

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

      // Join the room if not already a participant
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

  const handleSendMessage = () => {
    if (!message.trim()) return;
    console.log('Send message:', message);
    // TODO: Implement real-time chat with Firebase
    setMessage("");
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

  if (!room) {
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center cursor-pointer">
              <Film className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
          <div>
            <h1 className="font-display font-semibold text-lg" data-testid="text-room-name">
              {room.roomName}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {room.service}
              </Badge>
              <span className="text-xs text-muted-foreground" data-testid="text-participant-count">
                {room.participants.length} participants
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCopyRoomCode}
            data-testid="button-copy-code"
          >
            <Copy className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-settings">
            <SettingsIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLeaveRoom}
            data-testid="button-leave"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-muted/30 flex items-center justify-center p-6">
            <Card className="aspect-video w-full max-w-4xl bg-black/50 flex items-center justify-center">
              <div className="flex-1 bg-muted/30 flex items-center justify-center p-6">
  <div className="aspect-video w-full max-w-4xl">
    <VideoPlayer url={room.url} service={room.service} />
  </div>
</div>
            </Card>
          </div>

          <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                data-testid="button-toggle-mic"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="icon"
                onClick={() => setIsVideoOff(!isVideoOff)}
                data-testid="button-toggle-video"
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>
              <Button variant="secondary" size="icon" data-testid="button-share-screen">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-80 border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold mb-3">Participants ({room.participants.length})</h2>
            <div className="grid grid-cols-2 gap-2">
              <VideoTile 
                name={currentUser?.displayName || "You"} 
                isMuted={isMuted} 
              />
              {/* TODO: Load real participants from Firebase */}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Chat</h2>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <ChatMessage
                name={currentUser?.displayName || "You"}
                message="Welcome to the watch party!"
                timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                isCurrentUser={true}
              />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-emoji">
                  <Smile className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="h-10 rounded-full"
                  data-testid="input-chat-message"
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage} 
                  className="shrink-0" 
                  data-testid="button-send-message"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}