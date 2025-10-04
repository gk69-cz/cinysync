import { ref, onValue, set, off, serverTimestamp, getDatabase } from 'firebase/database';
import firebaseApp from '@/lib/firebase';

const realtimeDb = getDatabase(firebaseApp);

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  timestamp: number;
  updatedBy: string;
}

export class VideoSyncService {
  private roomId: string;
  private userId: string;
  private videoStateRef: any;
  private unsubscribe: (() => void) | null = null;
  private isLocalUpdate = false;

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
    this.videoStateRef = ref(realtimeDb, `rooms/${roomId}/videoState`);
  }

  // Subscribe to video state changes
  subscribeToVideoState(
    onStateChange: (state: VideoState) => void
  ): () => void {
    const callback = onValue(this.videoStateRef, (snapshot) => {
      const state = snapshot.val() as VideoState | null;
      if (state && !this.isLocalUpdate && state.updatedBy !== this.userId) {
        onStateChange(state);
      }
      // Reset the flag after processing
      this.isLocalUpdate = false;
    });

    this.unsubscribe = () => off(this.videoStateRef);
    return this.unsubscribe;
  }

  // Update video state (called by the user making changes)
  async updateVideoState(state: Partial<VideoState>): Promise<void> {
    this.isLocalUpdate = true;
    try {
      await set(this.videoStateRef, {
        ...state,
        timestamp: Date.now(),
        updatedBy: this.userId,
      });
    } catch (error) {
      console.error('Error updating video state:', error);
      this.isLocalUpdate = false;
      throw error;
    }
  }

  // Sync play state
  async syncPlay(currentTime: number): Promise<void> {
    await this.updateVideoState({
      isPlaying: true,
      currentTime,
    });
  }

  // Sync pause state
  async syncPause(currentTime: number): Promise<void> {
    await this.updateVideoState({
      isPlaying: false,
      currentTime,
    });
  }

  // Sync seek
  async syncSeek(currentTime: number, isPlaying: boolean): Promise<void> {
    await this.updateVideoState({
      currentTime,
      isPlaying,
    });
  }

  // Cleanup
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}