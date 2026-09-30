import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { StudioBackdrop, AppHeader } from "@/components/StudioBackdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().max(300).optional() }),
  head: () => ({ meta: [
    { title: "Secure sign in — Digital Agreement Platform" },
    { name: "description", content: "Sign in securely to create and manage private digital agreements." },
    { property: "og:title", content: "Secure sign in — Digital Agreement Platform" },
    { property: "og:description", content: "Secure account access for your private agreements." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!z.string().email().safeParse(cleanEmail).success) { setMessage("Enter a valid email address."); setBusy(false); return; }
    if (mode === "signup" && name.trim().length < 2) { setMessage("Enter your full name."); setBusy(false); return; }
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } } });
      setMessage(error?.message ?? "Check your email to confirm your account, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      const destination = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
      if (error) setMessage(error.message); else await navigate({ to: destination });
    }
    setBusy(false);
  }

  async function googleSignIn() {
    setBusy(true); setMessage("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setMessage(result.error.message); else if (!result.redirected) await navigate({ to: "/" });
    setBusy(false);
  }

  return <StudioBackdrop><AppHeader />
    <main className="mx-auto mt-10 max-w-md">
      <div className="mb-6 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-lg bg-cool/15 text-cool"><ShieldCheck /></span><div><h1 className="font-display text-3xl uppercase">Secure access</h1><p className="text-xs text-muted-foreground">Your agreements stay private to verified parties.</p></div></div>
      <div className="glass-panel rounded-2xl p-5">
        <div className="mb-5 grid grid-cols-2 rounded-lg bg-foreground/5 p-1">
          <Button type="button" variant={mode === "signin" ? "secondary" : "ghost"} onClick={() => setMode("signin")}>Sign in</Button>
          <Button type="button" variant={mode === "signup" ? "secondary" : "ghost"} onClick={() => setMode("signup")}>Create account</Button>
        </div>
        <Button type="button" variant="outline" className="h-11 w-full" onClick={googleSignIn} disabled={busy}>Continue with Google</Button>
        <div className="my-5 flex items-center gap-3 text-[10px] uppercase text-muted-foreground"><span className="h-px flex-1 bg-foreground/10"/>or use email<span className="h-px flex-1 bg-foreground/10"/></div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && <div><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required className="mt-2 h-11" autoComplete="name" /></div>}
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 h-11" autoComplete="email" /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className="mt-2 h-11" autoComplete={mode === "signin" ? "current-password" : "new-password"} /></div>
          {message && <p role="status" className="rounded-lg bg-foreground/5 p-3 text-xs text-muted-foreground">{message}</p>}
          <Button className="h-11 w-full bg-seal text-seal-foreground" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in securely" : "Create secure account"}</Button>
        </form>
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">Leaked-password checks and email verification are enabled.</p>
    </main>
  </StudioBackdrop>;
}