// client/src/components/VideoPlayer.tsx
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  service?: string;
}

export function VideoPlayer({ url, service }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Convert Google Drive URL to embeddable format
  const getEmbedUrl = (rawUrl: string) => {
    if (rawUrl.includes('drive.google.com')) {
      const fileIdMatch = rawUrl.match(/\/d\/([^\/]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    return rawUrl;
  };

  const embedUrl = getEmbedUrl(url);
  const isGoogleDrive = url.includes('drive.google.com');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isDirectVideo = url.match(/\.(mp4|webm|ogg|m3u8)$/i);

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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
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

  // For Google Drive and other iframe-based players
  if (isGoogleDrive || isYouTube) {
    return (
      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          frameBorder="0"
        />
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
            {/* Buffered Bar */}
            <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-gray-600 rounded-full w-full">
              <div
                className="h-full bg-gray-500 rounded-full transition-all"
                style={{ width: `${buffered}%` }}
              />
            </div>
            {/* Progress Bar */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
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