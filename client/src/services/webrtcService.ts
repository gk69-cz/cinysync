// client/src/services/WebRTCService.ts
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  deleteDoc,
  arrayUnion,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type OnRemoteStreamCallback = (peerId: string, stream: MediaStream) => void;
type OnPeerDisconnectedCallback = (peerId: string) => void;

export class WebRTCService {
  private roomId: string;
  private userId: string;
  private localStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private onRemoteStream: OnRemoteStreamCallback;
  private onPeerDisconnected: OnPeerDisconnectedCallback;
  private unsubscribers: (() => void)[] = [];
  private pendingCandidates: Map<string, RTCIceCandidate[]> = new Map();

  constructor(
    roomId: string,
    userId: string,
    onRemoteStream: OnRemoteStreamCallback,
    onPeerDisconnected: OnPeerDisconnectedCallback
  ) {
    this.roomId = roomId;
    this.userId = userId;
    this.onRemoteStream = onRemoteStream;
    this.onPeerDisconnected = onPeerDisconnected;
  }

  // Initialize camera / mic
  async initializeLocalStream(audio = true, video = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
        video: video ? { width: 640, height: 480, facingMode: "user" } : false,
      });
      this.localStream = stream;
      return stream;
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        alert("Please allow camera and microphone access.");
      }
      console.error("Media device error:", err);
      throw err;
    }
  }

  // Join room & start listening
  async joinRoom() {
    // Write to OUR OWN document
    const myRef = doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`);
    await setDoc(myRef, {
      userId: this.userId,
      joined: true,
      timestamp: new Date(),
    });

    console.log(`[WebRTC] Joined room ${this.roomId} as ${this.userId}`);

    // Listen to ALL users in the webrtc collection
    const unsub = onSnapshot(
      collection(db, `rooms/${this.roomId}/webrtc`),
      async (snapshot) => {
        console.log(`[WebRTC] Snapshot received: ${snapshot.docs.length} documents`);
        
        snapshot.docs.forEach(doc => {
          console.log(`[WebRTC] Document: ${doc.id}`, doc.data());
        });

        for (const change of snapshot.docChanges()) {
          const peerId = change.doc.id;
          const data = change.doc.data();
          
          console.log(`[WebRTC] Change type: ${change.type}, peer: ${peerId}`);
          
          // Skip our own document
          if (peerId === this.userId) {
            console.log(`[WebRTC] Skipping own document`);
            continue;
          }

          if (change.type === "added") {
            console.log(`[WebRTC] Peer joined: ${peerId}`);
            // Create offer for new peer
            await this.createOfferForPeer(peerId);
          } else if (change.type === "modified") {
            console.log(`[WebRTC] Peer modified: ${peerId}`, data);
            await this.handleSignaling(peerId, data);
          } else if (change.type === "removed") {
            console.log(`[WebRTC] Peer left: ${peerId}`);
            this.disconnectPeer(peerId);
          }
        }
      },
      (error) => {
        console.error(`[WebRTC] Snapshot error:`, error);
      }
    );

    this.unsubscribers.push(unsub);
  }

  private async handleSignaling(peerId: string, data: any) {
    let pc = this.peers.get(peerId);

    // Handle offer from peer
    if (data.offer && data.targetPeerId === this.userId) {
      console.log(`[WebRTC] Received offer from ${peerId}`);
      
      if (!pc) {
        pc = this.createPeerConnection(peerId);
      }

      if (!pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Process any pending candidates
        const pending = this.pendingCandidates.get(peerId) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(candidate);
        }
        this.pendingCandidates.delete(peerId);
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await this.sendAnswer(peerId, answer);
      }
    }

    // Handle answer from peer
    if (data.answer && data.targetPeerId === this.userId) {
      console.log(`[WebRTC] Received answer from ${peerId}`);
      
      if (pc && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        
        // Process any pending candidates
        const pending = this.pendingCandidates.get(peerId) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(candidate);
        }
        this.pendingCandidates.delete(peerId);
      }
    }

    // Handle ICE candidates
    if (data.candidates && Array.isArray(data.candidates)) {
      for (const c of data.candidates) {
        if (c.targetPeerId === this.userId) {
          try {
            if (pc && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(c.candidate));
            } else {
              // Store candidate for later
              if (!this.pendingCandidates.has(peerId)) {
                this.pendingCandidates.set(peerId, []);
              }
              this.pendingCandidates.get(peerId)!.push(new RTCIceCandidate(c.candidate));
            }
          } catch (err) {
            console.warn(`[WebRTC] Error adding candidate from ${peerId}:`, err);
          }
        }
      }
    }
  }

  private async createOfferForPeer(peerId: string) {
    console.log(`[WebRTC] Creating offer for ${peerId}`);
    const pc = this.createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.sendOffer(peerId, offer);
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    console.log(`[WebRTC] Creating peer connection for ${peerId}`);
    const pc = new RTCPeerConnection(ICE_CONFIG);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        pc.addTrack(t, this.localStream!);
        console.log(`[WebRTC] Added ${t.kind} track to ${peerId}`);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (ev) => {
      console.log(`[WebRTC] Received ${ev.track.kind} track from ${peerId}`);
      const [remoteStream] = ev.streams;
      if (remoteStream) {
        this.onRemoteStream(peerId, remoteStream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = async (ev) => {
      if (ev.candidate) {
        console.log(`[WebRTC] Sending ICE candidate to ${peerId}`);
        await this.addCandidate(peerId, ev.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        this.disconnectPeer(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state with ${peerId}: ${pc.iceConnectionState}`);
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  private async sendOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    // Write to OUR document with targetPeerId
    const myRef = doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`);
    await updateDoc(myRef, {
      offer,
      targetPeerId: peerId,
      timestamp: new Date(),
    });
    console.log(`[WebRTC] Sent offer to ${peerId}`);
  }

  private async sendAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    // Write to OUR document with targetPeerId
    const myRef = doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`);
    await updateDoc(myRef, {
      answer,
      targetPeerId: peerId,
      timestamp: new Date(),
    });
    console.log(`[WebRTC] Sent answer to ${peerId}`);
  }

  private async addCandidate(peerId: string, candidate: RTCIceCandidate) {
    // Add to OUR candidates array with targetPeerId
    const myRef = doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`);
    await updateDoc(myRef, {
      candidates: arrayUnion({
        candidate: candidate.toJSON(),
        targetPeerId: peerId,
      }),
    });
  }

  private disconnectPeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
      this.pendingCandidates.delete(peerId);
      this.onPeerDisconnected(peerId);
      console.log(`[WebRTC] Disconnected from ${peerId}`);
    }
  }

  async leaveRoom() {
    console.log(`[WebRTC] Leaving room ${this.roomId}`);
    
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];

    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.pendingCandidates.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    await deleteDoc(doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`));
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    console.log(`[WebRTC] Audio ${enabled ? "enabled" : "disabled"}`);
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    console.log(`[WebRTC] Video ${enabled ? "enabled" : "disabled"}`);
  }
}

export type WebRTCServiceInstance = InstanceType<typeof WebRTCService>;