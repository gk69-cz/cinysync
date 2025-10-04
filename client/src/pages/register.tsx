import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Film } from "lucide-react";
import { Link } from "wouter";
import { SiGoogle } from "react-icons/si";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register:', { name, email, password, confirmPassword });
  };

  const handleGoogleRegister = () => {
    console.log('Google register triggered');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Film className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl">CineSync</span>
          </div>
          <h1 className="font-display font-bold text-3xl mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join the best way to watch together</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="input-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="input-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="input-confirm-password"
            />
          </div>

          <Button type="submit" className="w-full h-12 rounded-2xl" data-testid="button-register">
            Create Account
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full h-12 rounded-2xl" 
          onClick={handleGoogleRegister}
          data-testid="button-google-register"
        >
          <SiGoogle className="mr-2 h-5 w-5" />
          Sign up with Google
        </Button>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login">
            <a className="text-primary hover:underline cursor-pointer" data-testid="link-login">
              Sign in
            </a>
          </Link>
        </p>
      </Card>
    </div>
  );
}
