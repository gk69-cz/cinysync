// client/src/components/RoomCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Lock } from "lucide-react";
import { useLocation } from "wouter";

interface RoomCardProps {
  roomName: string;
  service: string;
  participants: number;
  isPrivate: boolean;
  roomId?: string;
}

export function RoomCard({ roomName, service, participants, isPrivate, roomId }: RoomCardProps) {
  const [, setLocation] = useLocation();

  const getServiceColor = (service: string) => {
    switch (service.toLowerCase()) {
      case "netflix":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "prime":
      case "prime video":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "disney":
      case "disney+":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const handleJoin = () => {
    if (roomId) {
      setLocation(`/room/${roomId}`);
    }
  };

  return (
    <Card className="hover-elevate cursor-pointer group" onClick={handleJoin}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{roomName}</CardTitle>
          {isPrivate && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={getServiceColor(service)} variant="outline">
            {service}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{participants}</span>
          </div>
        </div>
        <Button 
          className="w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant="outline"
          onClick={handleJoin}
        >
          Join Room
        </Button>
      </CardContent>
    </Card>
  );
}