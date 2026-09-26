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

export function AppHeader() {
  return (
    <header className="flex items-center justify-between pt-5">
      <a href="/" className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-seal font-display text-sm text-seal-foreground">
          DA
        </span>
        <span className="font-display text-xl tracking-wide uppercase">Digital Agreement</span>
      </a>
    </header>
  );
}
