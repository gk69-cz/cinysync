// client/src/hooks/useWebRTC.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { WebRTCService } from "@/services/webrtcService";
import { useToast } from "@/hooks/use-toast";

interface RemotePeer {
  peerId: string;
  stream: MediaStream;
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  autoStart?: boolean;
}

export function useWebRTC({ roomId, userId, autoStart = false }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, MediaStream>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const { toast } = useToast();

  // Initialize WebRTC service
  const initializeWebRTC = useCallback(async () => {
    if (webrtcServiceRef.current || isInitializing) return;

    setIsInitializing(true);
    try {
      // Create WebRTC service
      const service = new WebRTCService(
        roomId,
        userId,
        (peerId, stream) => {
          // Handle remote stream
          setRemotePeers((prev) => {
            const newPeers = new Map(prev);
            newPeers.set(peerId, stream);
            return newPeers;
          });
        },
        (peerId) => {
          // Handle peer disconnection
          setRemotePeers((prev) => {
            const newPeers = new Map(prev);
            newPeers.delete(peerId);
            return newPeers;
          });
        }
      );

      webrtcServiceRef.current = service;

      // Get local stream
      const stream = await service.initializeLocalStream(isAudioEnabled, isVideoEnabled);
      setLocalStream(stream);

      // Join room
      await service.joinRoom();
      setIsConnected(true);

      toast({
        title: "Connected",
        description: "Video and audio enabled",
      });
    } catch (error: any) {
      console.error("Error initializing WebRTC:", error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to access camera/microphone",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [roomId, userId, isAudioEnabled, isVideoEnabled, toast, isInitializing]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !isConnected && !isInitializing) {
      initializeWebRTC();
    }
  }, [autoStart, isConnected, isInitializing, initializeWebRTC]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (webrtcServiceRef.current) {
      const newState = !isAudioEnabled;
      webrtcServiceRef.current.toggleAudio(newState);
      setIsAudioEnabled(newState);
      
      toast({
        title: newState ? "Microphone on" : "Microphone off",
        description: newState ? "You are now audible" : "You are now muted",
      });
    }
  }, [isAudioEnabled, toast]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (webrtcServiceRef.current) {
      const newState = !isVideoEnabled;
      webrtcServiceRef.current.toggleVideo(newState);
      setIsVideoEnabled(newState);
      
      toast({
        title: newState ? "Camera on" : "Camera off",
        description: newState ? "Your video is visible" : "Your video is hidden",
      });
    }
  }, [isVideoEnabled, toast]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (webrtcServiceRef.current) {
      await webrtcServiceRef.current.leaveRoom();
      webrtcServiceRef.current = null;
      setLocalStream(null);
      setRemotePeers(new Map());
      setIsConnected(false);
      
      toast({
        title: "Disconnected",
        description: "Video call ended",
      });
    }
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtcServiceRef.current) {
        webrtcServiceRef.current.leaveRoom();
      }
    };
  }, []);

  return {
    localStream,
    remotePeers: Array.from(remotePeers.entries()).map(([peerId, stream]) => ({
      peerId,
      stream,
    })),
    isAudioEnabled,
    isVideoEnabled,
    isConnected,
    isInitializing,
    toggleAudio,
    toggleVideo,
    connect: initializeWebRTC,
    disconnect,
  };
}