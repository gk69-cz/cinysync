// client/src/services/webrtcService.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PeerConnection {
  peerId: string;
  peerConnection: RTCPeerConnection;
  stream?: MediaStream;
}

export class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private roomId: string;
  private userId: string;
  private onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  private onPeerDisconnected?: (peerId: string) => void;

  // ICE servers configuration (using free STUN servers)
  private iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  constructor(
    roomId: string,
    userId: string,
    onRemoteStream?: (peerId: string, stream: MediaStream) => void,
    onPeerDisconnected?: (peerId: string) => void
  ) {
    this.roomId = roomId;
    this.userId = userId;
    this.onRemoteStream = onRemoteStream;
    this.onPeerDisconnected = onPeerDisconnected;
  }

  /**
   * Initialize local media stream (camera and microphone)
   */
  async initializeLocalStream(audio = true, video = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
        video: video ? { width: 640, height: 480, facingMode: "user" } : false,
      });
      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw new Error("Failed to access camera/microphone");
    }
  }

  /**
   * Toggle audio track
   */
  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle video track
   */
  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Join the room and start listening for other peers
   */
  async joinRoom() {
    // Register this user in the room
    const userRef = doc(db, "rooms", this.roomId, "webrtc", this.userId);
    await setDoc(userRef, {
      userId: this.userId,
      joined: true,
      timestamp: new Date(),
    });

    // Listen for other users joining
    const webrtcRef = collection(db, "rooms", this.roomId, "webrtc");
    onSnapshot(webrtcRef, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const peerId = change.doc.id;
        
        if (change.type === "added" && peerId !== this.userId) {
          // Another user joined, create offer
          await this.createOffer(peerId);
        } else if (change.type === "removed" && peerId !== this.userId) {
          // User left
          this.closePeerConnection(peerId);
          if (this.onPeerDisconnected) {
            this.onPeerDisconnected(peerId);
          }
        }
      });
    });

    // Listen for ICE candidates
    this.listenForICECandidates();
    
    // Listen for offers and answers
    this.listenForSignaling();
  }

  /**
   * Create a peer connection and send offer
   */
  private async createOffer(peerId: string) {
    const peerConnection = this.createPeerConnection(peerId);
    
    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const offerDoc = doc(db, "rooms", this.roomId, "webrtc", this.userId, "offers", peerId);
    await setDoc(offerDoc, {
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
      from: this.userId,
      to: peerId,
      timestamp: new Date(),
    });
  }

  /**
   * Create a peer connection
   */
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.iceServers);
    this.peerConnections.set(peerId, peerConnection);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendICECandidate(peerId, event.candidate);
      }
    };

    // Handle incoming stream
    peerConnection.ontrack = (event) => {
      if (this.onRemoteStream && event.streams[0]) {
        this.onRemoteStream(peerId, event.streams[0]);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "disconnected" || 
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "closed") {
        this.closePeerConnection(peerId);
        if (this.onPeerDisconnected) {
          this.onPeerDisconnected(peerId);
        }
      }
    };

    return peerConnection;
  }

  /**
   * Send ICE candidate to peer
   */
  private async sendICECandidate(peerId: string, candidate: RTCIceCandidate) {
    const candidateDoc = doc(
      db,
      "rooms",
      this.roomId,
      "webrtc",
      this.userId,
      "candidates",
      peerId + "_" + Date.now()
    );
    await setDoc(candidateDoc, {
      candidate: {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid,
      },
      from: this.userId,
      to: peerId,
    });
  }

  /**
   * Listen for incoming ICE candidates
   */
  private listenForICECandidates() {
    const candidatesRef = collection(db, "rooms", this.roomId, "webrtc");
    
    onSnapshot(candidatesRef, (snapshot) => {
      snapshot.docs.forEach((userDoc) => {
        const peerId = userDoc.id;
        if (peerId === this.userId) return;

        const candidatesSubRef = collection(userDoc.ref, "candidates");
        onSnapshot(query(candidatesSubRef, where("to", "==", this.userId)), (candidateSnap) => {
          candidateSnap.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              const peerConnection = this.peerConnections.get(peerId);
              
              if (peerConnection && data.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
            }
          });
        });
      });
    });
  }

  /**
   * Listen for offers and answers
   */
  private listenForSignaling() {
    const webrtcRef = collection(db, "rooms", this.roomId, "webrtc");
    
    onSnapshot(webrtcRef, (snapshot) => {
      snapshot.docs.forEach((userDoc) => {
        const peerId = userDoc.id;
        if (peerId === this.userId) return;

        // Listen for offers
        const offersRef = collection(userDoc.ref, "offers");
        onSnapshot(query(offersRef, where("to", "==", this.userId)), async (offerSnap) => {
          offerSnap.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              await this.handleOffer(peerId, data.offer);
            }
          });
        });

        // Listen for answers
        const answersRef = collection(userDoc.ref, "answers");
        onSnapshot(query(answersRef, where("to", "==", this.userId)), async (answerSnap) => {
          answerSnap.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              await this.handleAnswer(peerId, data.answer);
            }
          });
        });
      });
    });
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    let peerConnection = this.peerConnections.get(peerId);
    
    if (!peerConnection) {
      peerConnection = this.createPeerConnection(peerId);
      
      // Add local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          peerConnection!.addTrack(track, this.localStream!);
        });
      }
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer
    const answerDoc = doc(db, "rooms", this.roomId, "webrtc", this.userId, "answers", peerId);
    await setDoc(answerDoc, {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
      from: this.userId,
      to: peerId,
      timestamp: new Date(),
    });
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  /**
   * Close a peer connection
   */
  private closePeerConnection(peerId: string) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
  }

  /**
   * Leave the room and cleanup
   */
  async leaveRoom() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Remove from Firestore
    const userRef = doc(db, "rooms", this.roomId, "webrtc", this.userId);
    await deleteDoc(userRef);
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}