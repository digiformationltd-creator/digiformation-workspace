import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Footer } from "@/components/Footer";

async function sendReset(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    toast.error("Enter your email above first, then click Forgot password.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    toast.error("Enter a valid email address.");
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) {
    if (error.message?.toLowerCase().includes("rate limit") || (error as any).status === 429) {
      toast.error("Please wait a moment before requesting another reset email.");
    } else {
      toast.error(error.message);
    }
    return;
  }
  toast.success(`Reset link sent to ${trimmed}. Check your inbox and spam folder.`);
}


export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Invalid email or password");
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Access your company portfolio dashboard.
            </p>
          </div>

          <form onSubmit={onSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Password</Label>
                <button
                  type="button"
                  onClick={() => sendReset(email)}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
