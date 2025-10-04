import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VideoTile } from "@/components/VideoTile";
import { ChatMessage } from "@/components/ChatMessage";
import { Film, Mic, MicOff, Video, VideoOff, Share2, Settings as SettingsIcon, LogOut, Send, Smile } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Room() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    console.log('Send message:', message);
    setMessage("");
  };

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
            <h1 className="font-display font-semibold text-lg" data-testid="text-room-name">Friday Night Movie</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Netflix</Badge>
              <span className="text-xs text-muted-foreground" data-testid="text-participant-count">5 participants</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" data-testid="button-settings">
            <SettingsIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-leave">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-muted/30 flex items-center justify-center p-6">
            <Card className="aspect-video w-full max-w-4xl bg-black/50 flex items-center justify-center">
              <p className="text-muted-foreground">Movie Player Area</p>
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
            <h2 className="font-semibold mb-3">Participants</h2>
            <div className="grid grid-cols-2 gap-2">
              <VideoTile name="Sarah Chen" isMuted={false} />
              <VideoTile name="Alex Rivera" isMuted={true} />
              <VideoTile name="Jamie Lee" isMuted={false} />
              <VideoTile name="You" isMuted={isMuted} />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Chat</h2>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <ChatMessage
                name="Sarah Chen"
                message="This scene is amazing! 🎬"
                timestamp="2:45 PM"
                isCurrentUser={false}
              />
              <ChatMessage
                name="Alex Rivera"
                message="Totally agree! Best part so far"
                timestamp="2:46 PM"
                isCurrentUser={false}
              />
              <ChatMessage
                name="You"
                message="Can't wait to see what happens next!"
                timestamp="2:47 PM"
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
                <Button size="icon" onClick={handleSendMessage} className="shrink-0" data-testid="button-send-message">
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
