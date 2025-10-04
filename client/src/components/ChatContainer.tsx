// client/src/components/ChatContainer.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator, useTypingIndicator } from "@/components/TypingIndicator";
import { Send, Smile, Loader2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";

interface ChatContainerProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
}

export function ChatContainer({
  roomId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: ChatContainerProps) {
  const [messageInput, setMessageInput] = useState("");
  
  const { messages, loading, sending, send, messagesEndRef } = useChat({
    roomId,
    userId: currentUserId,
    userName: currentUserName,
    userAvatar: currentUserAvatar,
  });

  const { setTyping, clearTyping } = useTypingIndicator(
    roomId,
    currentUserId,
    currentUserName
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (e.target.value.trim()) {
      setTyping();
    } else {
      clearTyping();
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return;

    const messageToSend = messageInput;
    setMessageInput(""); // Clear input immediately for better UX
    clearTyping(); // Clear typing indicator
    
    await send(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold">Chat</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to say something!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                name={msg.userName}
                message={msg.message}
                avatar={msg.userAvatar}
                timestamp={formatTimestamp(msg.createdAt)}
                isCurrentUser={msg.userId === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {/* Typing Indicator */}
        <TypingIndicator
          roomId={roomId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0" 
            data-testid="button-emoji"
            disabled={sending}
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="h-10 rounded-full"
            data-testid="input-chat-message"
            disabled={sending}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            className="shrink-0" 
            data-testid="button-send-message"
            disabled={sending || !messageInput.trim()}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}