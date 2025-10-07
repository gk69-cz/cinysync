// client/src/services/webrtcService.ts
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // adjust this import to your Firebase config

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type OnRemoteStreamCallback = (peerId: string, stream: MediaStream) => void;
type OnPeerDisconnectedCallback = (peerId: string) => void;

export class  useWebRTC {
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

  // 🔹 Initialize local media
  async initializeLocalStream(enableAudio = true, enableVideo = true) {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: enableAudio,
      video: enableVideo,
    });
    return this.localStream;
  }

  // 🔹 Join Firestore-based signaling room
 
  async joinRoom() {
     const userRef = doc(db, "rooms", this.roomId, "webrtc", this.userId);
await setDoc(userRef, {
  userId: this.userId,
  joined: true,
  timestamp: new Date(),
});
    const roomRef = doc(db, "rooms", this.roomId);
    const candidatesRef = collection(roomRef, "candidates");

    // Watch for other users’ offers/answers
    const unsub = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.offer && data.offer.userId !== this.userId && !this.peers.has(data.offer.userId)) {
        await this.handleOffer(data.offer, data.offer.userId, candidatesRef);
      }

      // Someone else’s answer
      if (data.answer && data.answer.userId !== this.userId) {
        const pc = this.peers.get(data.answer.userId);
        if (pc && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      }
    });

    this.unsubscribers.push(unsub);

    // Create and send offer
    await this.createOffer(candidatesRef);
  }

  // 🔹 Create peer connection & offer
  private async createOffer(candidatesRef: any) {
    const pc = this.createPeerConnection(this.userId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await setDoc(doc(db, "rooms", this.roomId), {
      offer: {
        sdp: offer.sdp,
        type: offer.type,
        userId: this.userId,
      },
    });
  }

  // 🔹 Handle received offer
  private async handleOffer(offer: any, peerId: string, candidatesRef: any) {
    const pc = this.createPeerConnection(peerId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(doc(db, "rooms", this.roomId), {
      answer: {
        sdp: answer.sdp,
        type: answer.type,
        userId: this.userId,
      },
    });
  }

  // 🔹 Create peer connection
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    // Send local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote track
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.onRemoteStream(peerId, remoteStream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        const roomRef = doc(db, "rooms", this.roomId);
        const candidateDoc = collection(roomRef, "candidates");
        await addDoc(candidateDoc, {
          candidate: event.candidate.toJSON(),
          userId: this.userId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        this.onPeerDisconnected(peerId);
        this.peers.delete(peerId);
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  // 🔹 Toggle audio
  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  // 🔹 Toggle video
  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  // 🔹 Leave room & cleanup
  async leaveRoom() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    this.peers.forEach((pc) => pc.close());
    this.peers.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    await deleteDoc(doc(db, "rooms", this.roomId));
  }
}
