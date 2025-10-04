import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Lock } from "lucide-react";

interface RoomCardProps {
  roomName: string;
  service: "Netflix" | "Prime Video" | "Disney+";
  participants: number;
  isPrivate: boolean;
  thumbnail?: string;
}

export function RoomCard({ roomName, service, participants, isPrivate, thumbnail }: RoomCardProps) {
  const serviceColors = {
    "Netflix": "bg-red-500/10 text-red-500",
    "Prime Video": "bg-blue-500/10 text-blue-500",
    "Disney+": "bg-indigo-500/10 text-indigo-500"
  };

  return (
    <Card className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid={`card-room-${roomName.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="aspect-video bg-muted relative">
        {thumbnail && (
          <img src={thumbnail} alt={roomName} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge className={serviceColors[service]}>{service}</Badge>
          {isPrivate && (
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Private
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{roomName}</h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          <span data-testid={`text-participants-${roomName.toLowerCase().replace(/\s/g, '-')}`}>{participants} watching</span>
        </div>
      </div>
    </Card>
  );
}
