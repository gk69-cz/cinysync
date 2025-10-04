// client/src/hooks/useChat.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { sendMessage, subscribeToMessages, ChatMessage } from "../services/chatService";
import { useToast } from "@/hooks/use-toast";

interface UseChatOptions {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function useChat({ roomId, userId, userName, userAvatar }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Subscribe to messages
  useEffect(() => {
    if (!roomId) return;

    setLoading(true);
    const unsubscribe = subscribeToMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const send = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || sending) return;

      setSending(true);
      try {
        await sendMessage({
          roomId,
          userId,
          userName,
          userAvatar,
          message: messageText,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Failed to send message",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setSending(false);
      }
    },
    [roomId, userId, userName, userAvatar, sending, toast]
  );

  return {
    messages,
    loading,
    sending,
    send,
    messagesEndRef,
    scrollToBottom,
  };
}