// client/src/hooks/useWebRTC.ts
import { useState, useEffect, useRef } from "react";
import { WebRTCService, WebRTCServiceInstance} from "../services/webrtcService";

interface PeerStream {
  peerId: string;
  stream: MediaStream;
}

export function useWebRTC(roomId: string, userId: string) {
  const [webrtc, setWebRTC] = useState<WebRTCServiceInstance | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<PeerStream[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  // Use ref to prevent duplicate connections
  const isConnectingRef = useRef(false);

  const connect = async () => {
    if (webrtc || isConnectingRef.current) {
      console.log("Already connected or connecting");
      return;
    }
    
    isConnectingRef.current = true;
    setIsInitializing(true);
    
    try {
      const service = new WebRTCService(
        roomId,
        userId,
        (peerId: string, stream: MediaStream) => {
          console.log("Remote peer connected:", peerId);
          setRemotePeers((prev) => {
            if (prev.find((p) => p.peerId === peerId)) return prev;
            return [...prev, { peerId, stream }];
          });
        },
        (peerId: string) => {
          console.log("Remote peer disconnected:", peerId);
          setRemotePeers((prev) => prev.filter((p) => p.peerId !== peerId));
        }
      );

      // Initialize with current audio/video state
      const stream = await service.initializeLocalStream(isAudioEnabled, isVideoEnabled);
      setLocalStream(stream);
      
      // Join the room
      await service.joinRoom();

      setWebRTC(service);
      setIsConnected(true);
      console.log("WebRTC connected successfully");
    } catch (err) {
      console.error("Error connecting WebRTC:", err);
      setIsConnected(false);
      setWebRTC(null);
      setLocalStream(null);
    } finally {
      setIsInitializing(false);
      isConnectingRef.current = false;
    }
  };

  const disconnect = async () => {
    if (!webrtc) return;
    
    try {
      await webrtc.leaveRoom();
      console.log("WebRTC disconnected");
    } catch (err) {
      console.error("Error disconnecting WebRTC:", err);
    } finally {
      setWebRTC(null);
      setIsConnected(false);
      setRemotePeers([]);
      setLocalStream(null);
      isConnectingRef.current = false;
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    webrtc?.toggleAudio(newState);
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    webrtc?.toggleVideo(newState);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtc) {
        webrtc.leaveRoom().catch((err) => {
          console.error("Cleanup error:", err);
        });
      }
    };
  }, [webrtc]);

  return {
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
  };
}

export default useWebRTC;
export { WebRTCService };