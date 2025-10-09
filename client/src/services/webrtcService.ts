// client/src/services/WebRTCService.ts
import {
  doc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  collection,
  deleteDoc,
  getDocs,
  arrayUnion,
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
    const userRef = doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`);
    await setDoc(userRef, {
      userId: this.userId,
      joined: true,
      timestamp: new Date(),
    });

    const unsub = onSnapshot(collection(db, `rooms/${this.roomId}/webrtc`), async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const peerId = change.doc.id;
        if (peerId === this.userId) continue;

        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data();
          await this.handleSignaling(peerId, data);
        } else if (change.type === "removed") {
          this.disconnectPeer(peerId);
        }
      }
    });

    this.unsubscribers.push(unsub);

    // Optionally create an offer to start connection attempts
    // (You may choose to only create an offer when you detect a peer)
    // await this.createOffer();
  }

  private async handleSignaling(peerId: string, data: any) {
    if (!this.peers.has(peerId)) this.createPeerConnection(peerId);
    const pc = this.peers.get(peerId)!;

    if (data.offer && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await this.sendAnswer(peerId, answer);
    }

    if (data.answer && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.candidates && Array.isArray(data.candidates)) {
      for (const c of data.candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (err) {
          console.warn("Error adding candidate:", err);
        }
      }
    }
  }

  private async createOfferForPeer(peerId: string) {
    const pc = this.createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.sendOffer(peerId, offer);
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => pc.addTrack(t, this.localStream!));
    }

    pc.ontrack = (ev) => {
      const [remoteStream] = ev.streams;
      if (remoteStream) this.onRemoteStream(peerId, remoteStream);
    };

    pc.onicecandidate = async (ev) => {
      if (ev.candidate) {
        await this.addCandidate(peerId, ev.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        this.disconnectPeer(peerId);
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

 // ✅ CORRECT - Write to YOUR OWN document
private async sendOffer(peerId: string, offer: RTCSessionDescriptionInit) {
  // Store YOUR offer in YOUR document, addressed TO the peer
  const ref = doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`);
  await setDoc(ref, { 
    offer,
    targetPeerId: peerId,  // Who this offer is for
    userId: this.userId,
    timestamp: new Date()
  }, { merge: true });
}

private async sendAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
  // Store YOUR answer in YOUR document
  const ref = doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`);
  await setDoc(ref, { 
    answer,
    targetPeerId: peerId,
    userId: this.userId,
    timestamp: new Date()
  }, { merge: true });
}

private async addCandidate(peerId: string, candidate: RTCIceCandidate) {
  // Add YOUR candidate to YOUR document
  const ref = doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`);
  await setDoc(ref, { 
    candidates: arrayUnion(candidate.toJSON()),
    targetPeerId: peerId
  }, { merge: true });
}

  private disconnectPeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
      this.onPeerDisconnected(peerId);
    }
  }

  async leaveRoom() {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];

    this.peers.forEach((pc) => pc.close());
    this.peers.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    await deleteDoc(doc(db, `rooms/${this.roomId}/webrtc/${this.userId}`));
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }
}

// Export a convenient instance type so hooks/components can use it as a type.
export type WebRTCServiceInstance = InstanceType<typeof WebRTCService>;
