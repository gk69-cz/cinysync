import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  name: string;
  message: string;
  avatar?: string;
  timestamp: string;
  isCurrentUser?: boolean;
}

export function ChatMessage({ name, message, avatar, timestamp, isCurrentUser = false }: ChatMessageProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className={cn("flex gap-3 mb-4", isCurrentUser && "flex-row-reverse")} data-testid={`message-${name.toLowerCase().replace(/\s/g, '-')}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      
      <div className={cn("flex flex-col", isCurrentUser && "items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium" data-testid={`text-name-${name.toLowerCase().replace(/\s/g, '-')}`}>{name}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        <div className={cn(
          "rounded-2xl px-4 py-2 max-w-md",
          isCurrentUser ? "bg-primary/10 text-foreground" : "bg-muted"
        )}>
          <p className="text-sm" data-testid={`text-message-${name.toLowerCase().replace(/\s/g, '-')}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
