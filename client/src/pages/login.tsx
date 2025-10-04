import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Film } from "lucide-react";
import { Link } from "wouter";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  const handleGoogleLogin = () => {
    console.log('Google login triggered');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Film className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl">CineSync</span>
          </div>
          <h1 className="font-display font-bold text-3xl mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to start watching together</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div className="flex justify-end">
            <Link href="/forgot-password">
              <a className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-forgot-password">
                Forgot password?
              </a>
            </Link>
          </div>

          <Button type="submit" className="w-full h-12 rounded-2xl" data-testid="button-login">
            Sign In
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
          onClick={handleGoogleLogin}
          data-testid="button-google-login"
        >
          <SiGoogle className="mr-2 h-5 w-5" />
          Sign in with Google
        </Button>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register">
            <a className="text-primary hover:underline cursor-pointer" data-testid="link-register">
              Sign up
            </a>
          </Link>
        </p>
      </Card>
    </div>
  );
}
