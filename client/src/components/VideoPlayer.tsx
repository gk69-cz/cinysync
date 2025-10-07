// client/src/components/VideoPlayer.tsx
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward } from 'lucide-react';
import { VideoSyncService, VideoState } from '@/services/videoSyncService';
import { ref, get } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import firebaseApp  from '@/lib/firebase';
const realtimeDb = getDatabase(firebaseApp);
interface VideoPlayerProps {
  url: string;
  service?: string;
  roomId: string;
  userId: string;
}

export function VideoPlayer({ url, service, roomId, userId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncServiceRef = useRef<VideoSyncService | null>(null);
  const isSyncingRef = useRef(false);
  const youtubePlayerRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout>();
const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'disconnected'>('synced');

  // Convert URLs to embeddable format
 const getEmbedUrl = (rawUrl: string) => {
    if (rawUrl.includes('drive.google.com')) {
      const fileIdMatch = rawUrl.match(/\/d\/([^\/]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
    let videoId = '';
    if (rawUrl.includes('youtube.com/watch')) {
      videoId = new URL(rawUrl).searchParams.get('v') || '';
    } else if (rawUrl.includes('youtu.be/')) {
      videoId = rawUrl.split('youtu.be/')[1].split('?')[0];
    }
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0&disablekb=1&origin=${window.location.origin}`;
  }
    return rawUrl;
  };

  const embedUrl = getEmbedUrl(url);
  const isGoogleDrive = url.includes('drive.google.com');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isDirectVideo = !isGoogleDrive && !isYouTube;

  // Initialize sync service
  // Add this useEffect for periodic drift correction
useEffect(() => {
  if (!syncServiceRef.current || !isPlaying) return;

  const driftCheckInterval = setInterval(() => {
    // Get current remote state from Firebase
    const videoStateRef = ref(realtimeDb, `rooms/${roomId}/videoState`);
    
    get(videoStateRef).then((snapshot) => {
      const remoteState = snapshot.val() as VideoState | null;
      if (!remoteState || remoteState.updatedBy === userId) return;

      const shouldSync = syncServiceRef.current!.shouldSync(
        isYouTube ? (youtubePlayerRef.current?.getCurrentTime() || 0) : (videoRef.current?.currentTime || 0),
        remoteState
      );

      if (shouldSync) {
        // console.log('Correcting drift...');
        // Calculate time with latency compensation
        const timeSinceUpdate = (Date.now() - remoteState.timestamp) / 1000;
        const predictedTime = remoteState.currentTime + (remoteState.isPlaying ? timeSinceUpdate : 0);

        if (isYouTube && youtubePlayerRef.current && youtubeReady) {
          youtubePlayerRef.current.seekTo(predictedTime, true);
        } else if (videoRef.current) {
          videoRef.current.currentTime = predictedTime;
        }
      }
    });
  }, 3000); // Check every 3 seconds

  return () => clearInterval(driftCheckInterval);
}, [isPlaying, roomId, userId, isYouTube, youtubeReady]);

  // Initialize YouTube player with API
  useEffect(() => {
    if (!isYouTube) return;

    const initYouTubePlayer = () => {
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = () => {
          createYouTubePlayer();
        };
      } else {
        createYouTubePlayer();
      }
    };

    const createYouTubePlayer = () => {
      if (!iframeRef.current) return;
      
      youtubePlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            setYoutubeReady(true);
            timeUpdateIntervalRef.current = setInterval(() => {
              if (youtubePlayerRef.current?.getCurrentTime) {
                setCurrentTime(youtubePlayerRef.current.getCurrentTime());
                setDuration(youtubePlayerRef.current.getDuration());
              }
            }, 500);
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === 1) setIsPlaying(true);
            if (state === 2) setIsPlaying(false);
          },
        },
      });
    };

    const timer = setTimeout(initYouTubePlayer, 500);

    return () => {
      clearTimeout(timer);
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [isYouTube]);

  // Handle remote state changes from other users
  const handleRemoteStateChange = (state: VideoState) => {
  if (isSyncingRef.current) return;
  isSyncingRef.current = true;

  // Calculate predicted time with latency compensation
  const latency = Date.now() - state.timestamp;
  const predictedTime = state.currentTime + (state.isPlaying ? latency / 1000 : 0);

  if (isYouTube && youtubePlayerRef.current && youtubeReady) {
    const currentTime = youtubePlayerRef.current.getCurrentTime();
    
    // Only seek if difference is significant (>2s)
    if (Math.abs(currentTime - predictedTime) > 2) {
      youtubePlayerRef.current.seekTo(predictedTime, true);
    }

    // Sync play state
    const playerState = youtubePlayerRef.current.getPlayerState();
    const isCurrentlyPlaying = playerState === 1; // 1 = playing in YouTube API
    
    if (state.isPlaying && !isCurrentlyPlaying) {
      youtubePlayerRef.current.playVideo();
    } else if (!state.isPlaying && isCurrentlyPlaying) {
      youtubePlayerRef.current.pauseVideo();
    }
  } else if (isDirectVideo && videoRef.current) {
    const video = videoRef.current;
    
    if (Math.abs(video.currentTime - predictedTime) > 1) {
      video.currentTime = predictedTime;
    }

    if (state.isPlaying && video.paused) {
      video.play().catch(console.error);
      setIsPlaying(true);
    } else if (!state.isPlaying && !video.paused) {
      video.pause();
      setIsPlaying(false);
    }
  }

  setTimeout(() => {
    isSyncingRef.current = false;
  }, 200); // Increased to 200ms
};

  // Direct video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('progress', handleProgress);
    };
  }, []);

  const togglePlay = async () => {
    if (!syncServiceRef.current) return;

    if (isYouTube && youtubePlayerRef.current && youtubeReady) {
      const currentTime = youtubePlayerRef.current.getCurrentTime();
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
        await syncServiceRef.current.syncPause(currentTime);
      } else {
        youtubePlayerRef.current.playVideo();
        await syncServiceRef.current.syncPlay(currentTime);
      }
    } else if (videoRef.current) {
      const video = videoRef.current;
      if (isPlaying) {
        video.pause();
        await syncServiceRef.current.syncPause(video.currentTime);
      } else {
        video.play();
        await syncServiceRef.current.syncPlay(video.currentTime);
      }
    }
  };

  const handleSeek = async (newTime: number) => {
    if (!syncServiceRef.current) return;

    if (isYouTube && youtubePlayerRef.current && youtubeReady) {
      youtubePlayerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
      await syncServiceRef.current.syncSeek(newTime, isPlaying);
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      await syncServiceRef.current.syncSeek(newTime, isPlaying);
    }
  };

  const skip = async (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    await handleSeek(newTime);
  };

  const toggleMute = () => {
    if (isYouTube && youtubePlayerRef.current && youtubeReady) {
      if (isMuted) {
        youtubePlayerRef.current.unMute();
      } else {
        youtubePlayerRef.current.mute();
      }
      setIsMuted(!isMuted);
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    
    if (isYouTube && youtubePlayerRef.current && youtubeReady) {
      youtubePlayerRef.current.setVolume(newVolume * 100);
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // For Google Drive - show iframe with warning
  if (isGoogleDrive) {
    return (
      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          frameBorder="0"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          ⚠️ Google Drive videos cannot be synced due to browser security restrictions
        </div>
      </div>
    );
  }

  // For YouTube with controls
  if (isYouTube) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-black rounded-lg overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <div id="youtube-player" className="w-full h-full">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen; accelerometer; gyroscope"
            allowFullScreen
            frameBorder="0"
          />
        </div>

        {/* Sync Indicator */}
        {youtubeReady && (
          <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 pointer-events-none">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Synced
          </div>
        )}

        {/* Custom Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="px-4 pt-4">
            <div className="relative group/progress">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1 appearance-none bg-gray-600 rounded-full cursor-pointer relative z-10
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                  group-hover/progress:[&::-webkit-slider-thumb]:w-4 group-hover/progress:[&::-webkit-slider-thumb]:h-4
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
                }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between px-4 pb-4 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="text-white hover:text-red-600 transition-colors p-2"
                disabled={!youtubeReady}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button
                onClick={() => skip(-10)}
                className="text-white hover:text-red-600 transition-colors p-2"
                disabled={!youtubeReady}
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => skip(10)}
                className="text-white hover:text-red-600 transition-colors p-2"
                disabled={!youtubeReady}
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-red-600 transition-colors p-2"
                disabled={!youtubeReady}
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                disabled={!youtubeReady}
                className="w-20 h-1 appearance-none bg-gray-600 rounded-full cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
              />

              <span className="text-white text-sm font-medium ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-600 transition-colors p-2"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For direct video URLs
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={url}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Sync Indicator */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 pointer-events-none ${
  syncStatus === 'synced' ? 'bg-green-500/90' : 
  syncStatus === 'syncing' ? 'bg-yellow-500/90' : 'bg-red-500/90'
} text-white`}>
  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
  {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Disconnected'}
</div>

      {/* Play/Pause Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          showControls && !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="bg-black/50 rounded-full p-6">
          <Play className="w-16 h-16 text-white" />
        </div>
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="px-4 pt-4">
          <div className="relative group/progress">
            <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-gray-600 rounded-full w-full">
              <div
                className="h-full bg-gray-500 rounded-full transition-all"
                style={{ width: `${buffered}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1 appearance-none bg-transparent cursor-pointer relative z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                group-hover/progress:[&::-webkit-slider-thumb]:w-4 group-hover/progress:[&::-webkit-slider-thumb]:h-4
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / duration) * 100}%, transparent ${(currentTime / duration) * 100}%, transparent 100%)`
              }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="text-white hover:text-red-600 transition-colors p-2"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <button
              onClick={() => skip(-10)}
              className="text-white hover:text-red-600 transition-colors p-2"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => skip(10)}
              className="text-white hover:text-red-600 transition-colors p-2"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={toggleMute}
              className="text-white hover:text-red-600 transition-colors p-2"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 appearance-none bg-gray-600 rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
            />

            <span className="text-white text-sm font-medium ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="text-white hover:text-red-600 transition-colors p-2">
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-red-600 transition-colors p-2"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}