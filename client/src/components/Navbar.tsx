import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";
import { Link } from "wouter";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" data-testid="link-logo">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Film className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">CineSync</span>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" data-testid="link-home">
            <a className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Home</a>
          </Link>
          <Link href="#features" data-testid="link-features">
            <a className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Features</a>
          </Link>
          <Link href="#about" data-testid="link-about">
            <a className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">About</a>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" data-testid="button-login">Login</Button>
          </Link>
          <Link href="/register">
            <Button data-testid="button-get-started">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
