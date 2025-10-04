import { Button } from "@/components/ui/button";
import { Play, Users } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_collaboration_movie_watching_0783c3b3.png";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background/60 to-accent/40" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-foreground">
          Watch Together, <span className="text-primary">Anywhere</span>
        </h1>
        <p className="text-xl md:text-2xl text-foreground/90 mb-12 max-w-3xl mx-auto">
          Experience movies with friends in perfect sync across Netflix, Prime Video, and Disney+. 
          Real-time chat, video presence, and seamless screen sharing.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            className="text-lg px-8 h-12 rounded-2xl"
            data-testid="button-start-watch-party"
          >
            <Play className="mr-2 h-5 w-5" />
            Start a Watch Party
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 h-12 rounded-2xl bg-background/20 backdrop-blur-md border-foreground/20"
            data-testid="button-join-room"
          >
            <Users className="mr-2 h-5 w-5" />
            Join a Room
          </Button>
        </div>
      </div>
    </section>
  );
}
