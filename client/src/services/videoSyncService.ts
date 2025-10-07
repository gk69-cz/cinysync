import { ref, onValue, set, off, getDatabase } from 'firebase/database';
import firebaseApp, { auth } from '@/lib/firebase';
import { requireAuth } from '@/lib/auth';

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
  private lastUpdateTime = 0;
  private updateDebounceMs = 200; // Debounce seek updates
  private syncThreshold = 2; // Sync if difference > 2 seconds

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
    this.videoStateRef = ref(realtimeDb, `rooms/${roomId}/videoState`);
  }

  // Subscribe to video state changes
  subscribeToVideoState(
    onStateChange: (state: VideoState) => void
  ): () => void {
    requireAuth(); // Check authentication

    const callback = onValue(this.videoStateRef, (snapshot) => {
      const state = snapshot.val() as VideoState | null;
      
      if (state && state.updatedBy !== this.userId) {
        // Only sync if timestamp is recent (within 5 seconds)
        const timeDiff = Date.now() - state.timestamp;
        if (timeDiff < 5000) {
          onStateChange(state);
        }
      }
    });

    this.unsubscribe = () => off(this.videoStateRef);
    return this.unsubscribe;
  }

  // Update video state (with debouncing for seeks)
  private async updateVideoState(state: Partial<VideoState>): Promise<void> {
    requireAuth();

    const now = Date.now();
    
    // Debounce updates (except play/pause which should be immediate)
    if (state.isPlaying === undefined) {
      if (now - this.lastUpdateTime < this.updateDebounceMs) {
        return; // Skip this update
      }
    }
    
    this.lastUpdateTime = now;

    try {
      await set(this.videoStateRef, {
        ...state,
        timestamp: now,
        updatedBy: this.userId,
      });
    } catch (error) {
      console.error('Error updating video state:', error);
      // Redirect if auth error
      if (error instanceof Error && error.message.includes('permission')) {
        window.location.href = '/login';
      }
      throw error;
    }
  }

  // Sync play state
  async syncPlay(currentTime: number): Promise<void> {
    await this.updateVideoState({
      isPlaying: true,
      currentTime: Math.floor(currentTime * 10) / 10, // Round to 1 decimal
    });
  }

  // Sync pause state
  async syncPause(currentTime: number): Promise<void> {
    await this.updateVideoState({
      isPlaying: false,
      currentTime: Math.floor(currentTime * 10) / 10,
    });
  }

  // Sync seek (debounced)
  async syncSeek(currentTime: number, isPlaying: boolean): Promise<void> {
    await this.updateVideoState({
      currentTime: Math.floor(currentTime * 10) / 10,
      isPlaying,
    });
  }

  // Check if local video needs sync (call this periodically if playing)
  shouldSync(localTime: number, remoteState: VideoState): boolean {
    if (!remoteState.isPlaying) return false;
    
    // Calculate expected remote time based on timestamp
    const timeSinceUpdate = (Date.now() - remoteState.timestamp) / 1000;
    const expectedRemoteTime = remoteState.currentTime + timeSinceUpdate;
    
    // Sync if difference exceeds threshold
    return Math.abs(localTime - expectedRemoteTime) > this.syncThreshold;
  }

  // Cleanup
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}