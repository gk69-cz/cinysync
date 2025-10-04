import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Video, MessageSquare, Share2, Users, Play, Lock } from "lucide-react";
import screenShareImage from "@assets/generated_images/Cross-platform_screen_sharing_demo_06015f82.png";
import videoGridImage from "@assets/generated_images/Video_grid_participant_tiles_db8323f0.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <HeroSection />
      
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
              Everything You Need to <span className="text-primary">Watch Together</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade features for the ultimate collaborative streaming experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            <FeatureCard
              icon={Video}
              title="Video Presence"
              description="See your friends in real-time with WebRTC-powered video tiles. Everyone's reaction makes the experience better."
            />
            <FeatureCard
              icon={Share2}
              title="Screen Sharing"
              description="Share your screen across any device. Works seamlessly on desktop, tablet, and mobile browsers."
            />
            <FeatureCard
              icon={MessageSquare}
              title="Live Chat"
              description="React and chat in real-time with emoji reactions, typing indicators, and smooth message delivery."
            />
            <FeatureCard
              icon={Play}
              title="Synced Playback"
              description="Perfect synchronization across all devices. Everyone watches at the same time, every time."
            />
            <FeatureCard
              icon={Users}
              title="Friend System"
              description="Add friends, create private rooms, and discover public watch parties from the community."
            />
            <FeatureCard
              icon={Lock}
              title="Privacy Controls"
              description="Choose between public and private rooms. You decide who joins your watch party."
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <h3 className="font-display font-bold text-3xl mb-4">Cross-Platform Screen Sharing</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Share your screen from any device to any device. Our WebRTC technology ensures low latency 
                and high quality streaming whether you're on desktop, tablet, or mobile.
              </p>
              <Button size="lg" className="rounded-2xl">Learn More</Button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border">
              <img src={screenShareImage} alt="Screen sharing demo" className="w-full" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden border border-border">
              <img src={videoGridImage} alt="Video grid" className="w-full" />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="font-display font-bold text-3xl mb-4">See Everyone's Reactions</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Video tiles show all participants in real-time. Watch your friends laugh, cry, and react 
                alongside you for a truly social viewing experience.
              </p>
              <Button size="lg" className="rounded-2xl">Get Started</Button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Ready to Start Watching Together?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users already enjoying movies with friends across the globe
          </p>
          <Button size="lg" className="text-lg px-12 h-14 rounded-2xl" data-testid="button-cta-start">
            <Play className="mr-2 h-5 w-5" />
            Start Your First Watch Party
          </Button>
        </div>
      </section>
      
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 CineSync. Watch together, anywhere.</p>
        </div>
      </footer>
    </div>
  );
}
