import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stamp, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — SignStamp" },
      { name: "description", content: "Sign in or create your SignStamp account to sign and stamp PDFs." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/app" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.user && !data.session) {
      setSentTo(email);
      toast.success("Verification email sent");
    } else if (data.session) {
      toast.success("Account created!");
    }
  }

  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand shadow-brand">
            <Stamp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">SignStamp</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          {sentTo ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a verification link to <span className="font-medium text-foreground">{sentTo}</span>.
                Click it to activate your account.
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => setSentTo(null)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="in-email">Email</Label>
                    <Input id="in-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="in-pass">Password</Label>
                    <Input id="in-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-primary-foreground shadow-brand hover:opacity-95">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="up-email">Email</Label>
                    <Input id="up-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="up-pass">Password</Label>
                    <Input id="up-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-primary-foreground shadow-brand hover:opacity-95">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    We'll send a verification link to your email.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
