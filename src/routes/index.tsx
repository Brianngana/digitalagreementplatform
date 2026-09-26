import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudioBackdrop, AppHeader } from "@/components/StudioBackdrop";
import {
  loadAgreements,
  STATUS_LABEL,
  type Agreement,
  type AgreementStatus,
} from "@/lib/agreements";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Agreement — Agreements Made Simple. Trust Made Strong." },
      {
        name: "description",
        content:
          "Create, understand, sign, and secure agreements in plain language — loans, rentals, sales, employment, partnerships and more.",
      },
      { property: "og:title", content: "Digital Agreement" },
      {
        property: "og:description",
        content: "Create, understand, sign, and secure agreements in plain language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const chipClass: Record<AgreementStatus, string> = {
  draft: "bg-foreground/5 text-foreground/70 ring-foreground/15",
  awaiting: "bg-seal/15 text-seal ring-seal/30",
  signed: "bg-cool/15 text-cool ring-cool/30",
  completed: "bg-foreground text-background ring-foreground",
};

function Index() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  useEffect(() => {
    setAgreements(loadAgreements());
  }, []);

  const active = agreements.filter((a) => a.status !== "completed").length;
  const signed = agreements.filter((a) => a.status === "signed" || a.status === "completed").length;

  return (
    <StudioBackdrop>
      <AppHeader />

      {/* Hero */}
      <section className="animate-rise mt-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-cool">
          Create · Understand · Sign · Secure
        </span>
        <h1 className="mt-3 font-display uppercase leading-[0.9] text-foreground" style={{ fontSize: "clamp(44px, 12vw, 72px)" }}>
          Put it<br />in writing
        </h1>
        <p className="mt-3 max-w-[320px] text-sm leading-relaxed text-muted-foreground">
          No more "we agreed verbally." Answer a few plain questions, get a clear agreement, and both
          parties sign — all from your phone.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            to="/create"
            className="rounded-xl bg-seal px-5 py-3 text-sm font-semibold text-seal-foreground transition-transform active:scale-[0.98]"
          >
            Create agreement
          </Link>
          <a
            href="#my-agreements"
            className="rounded-xl border border-foreground/15 bg-foreground/5 px-5 py-3 text-sm font-semibold text-foreground"
          >
            My agreements
          </a>
        </div>
      </section>

      {/* Stats */}
      <div className="animate-rise mt-6 grid grid-cols-3 gap-2" style={{ animationDelay: "80ms" }}>
        <div className="glass-panel rounded-xl p-3">
          <div className="font-display text-2xl text-foreground">{agreements.length}</div>
          <div className="text-[11px] font-medium text-muted-foreground">Total</div>
        </div>
        <div className="glass-panel rounded-xl p-3">
          <div className="font-display text-2xl text-seal">{active}</div>
          <div className="text-[11px] font-medium text-muted-foreground">Active</div>
        </div>
        <div className="glass-panel rounded-xl p-3">
          <div className="font-display text-2xl text-cool">{signed}</div>
          <div className="text-[11px] font-medium text-muted-foreground">Signed</div>
        </div>
      </div>

      {/* How it works */}
      <div className="animate-rise mt-6 space-y-2" style={{ animationDelay: "140ms" }}>
        <div className="glass-panel flex items-center gap-3 rounded-xl p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-seal font-display text-sm text-seal-foreground">01</span>
          <div>
            <div className="text-sm font-semibold">Answer plain questions</div>
            <div className="text-[11px] text-muted-foreground">No legal language needed — we draft it for you</div>
          </div>
        </div>
        <div className="glass-panel flex items-center gap-3 rounded-xl p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cool font-display text-sm text-primary-foreground">02</span>
          <div>
            <div className="text-sm font-semibold">Every clause, explained</div>
            <div className="text-[11px] text-muted-foreground">Legal text side by side with plain language</div>
          </div>
        </div>
        <div className="glass-panel flex items-center gap-3 rounded-xl p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-foreground font-display text-sm text-background">03</span>
          <div>
            <div className="text-sm font-semibold">Sign &amp; seal</div>
            <div className="text-[11px] text-muted-foreground">Both parties sign electronically — tamper-evident record</div>
          </div>
        </div>
      </div>

      {/* My agreements */}
      <section id="my-agreements" className="animate-rise mt-8" style={{ animationDelay: "200ms" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg uppercase tracking-wide">My agreements</h2>
          <span className="text-[11px] font-medium text-muted-foreground">{agreements.length} total</span>
        </div>

        {agreements.length === 0 ? (
          <div className="glass-panel mt-3 rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No agreements yet. Create your first one — it takes about two minutes.
            </p>
            <Link
              to="/create"
              className="mt-4 inline-block rounded-xl bg-seal px-5 py-3 text-sm font-semibold text-seal-foreground"
            >
              Create agreement
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {agreements.map((a) => (
              <Link
                key={a.id}
                to="/agreement/$id"
                params={{ id: a.id }}
                className="glass-panel block rounded-2xl p-4 transition-transform active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-muted-foreground">{a.type}</p>
                    <p className="mt-0.5 truncate text-[15px] font-semibold">{a.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {a.partyA} · {a.partyB}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ring-1 ${chipClass[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 text-center text-[11px] text-muted-foreground">
        Digital Agreement drafts for clarity, not legal advice. Review before you sign.
      </p>
    </StudioBackdrop>
  );
}
