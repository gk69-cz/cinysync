import { FeatureCard } from '../FeatureCard';
import { Video } from 'lucide-react';

export default function FeatureCardExample() {
  return (
    <div className="p-8 bg-background">
      <FeatureCard 
        icon={Video}
        title="Video Presence"
        description="See your friends in real-time with WebRTC-powered video tiles. Everyone's reaction makes the experience better."
      />
    </div>
  );
}
