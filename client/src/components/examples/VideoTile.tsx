import { VideoTile } from '../VideoTile';

export default function VideoTileExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-sm">
        <VideoTile 
          name="Sarah Chen"
          isMuted={false}
          isScreenSharing={false}
        />
      </div>
    </div>
  );
}
