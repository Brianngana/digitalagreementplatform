export function StudioBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-bg relative min-h-screen w-full overflow-hidden font-body text-foreground">
      {/* drifting frosted glass panels */}
      <div className="animate-glass-drift pointer-events-none absolute -top-24 -right-20 h-[420px] w-[420px] rounded-[36px] border border-foreground/10 bg-foreground/5" />
      <div
        className="animate-glass-drift pointer-events-none absolute -top-16 -right-12 h-[380px] w-[380px] rounded-[36px] border border-foreground/10 bg-foreground/[0.07]"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="animate-glass-drift pointer-events-none absolute -bottom-24 -left-16 h-[300px] w-[300px] rounded-[36px] border border-cool/20 bg-cool/10"
        style={{ animationDelay: "-8s" }}
      />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-16">{children}</div>
    </div>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="flex items-center justify-between pt-5">
      <Link to="/" className="flex min-w-0 items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-seal font-display text-sm text-seal-foreground">
          DAP
        </span>
        <span className="truncate font-display text-base uppercase sm:text-xl">Digital Agreement Platform</span>
      </Link>
      {email ? <div className="flex items-center gap-1"><span className="hidden max-w-44 truncate text-xs text-muted-foreground sm:block">{email}</span><Button type="button" size="icon" variant="ghost" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut /></Button></div> : <Button asChild size="sm" variant="outline"><Link to="/auth"><ShieldCheck />Sign in</Link></Button>}
    </header>
  );
}
