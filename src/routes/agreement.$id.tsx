import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudioBackdrop, AppHeader } from "@/components/StudioBackdrop";
import {
  deleteAgreement,
  getAgreement,
  STATUS_LABEL,
  upsertAgreement,
  type Agreement,
} from "@/lib/agreements";

export const Route = createFileRoute("/agreement/$id")({
  head: () => ({
    meta: [
      { title: "Your agreement — Digital Agreement" },
      {
        name: "description",
        content:
          "Review the agreement, read the plain-language explanation of each clause, share it, and sign electronically.",
      },
      { property: "og:title", content: "Your agreement — Digital Agreement" },
      {
        property: "og:description",
        content: "Review, understand, share, and sign your agreement.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgreementPage,
});

function AgreementPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<Agreement | null | undefined>(undefined);
  const [signName, setSignName] = useState("");
  const [signing, setSigning] = useState<"A" | "B" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAgreement(getAgreement(id) ?? null);
  }, [id]);

  const update = (next: Agreement) => {
    next.updatedAt = new Date().toISOString();
    upsertAgreement(next);
    setAgreement({ ...next });
  };

  if (agreement === undefined) {
    return (
      <StudioBackdrop>
        <AppHeader />
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      </StudioBackdrop>
    );
  }

  if (agreement === null) {
    return (
      <StudioBackdrop>
        <AppHeader />
        <div className="glass-panel mt-10 rounded-2xl p-6 text-center">
          <h1 className="font-display text-2xl uppercase">Agreement not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This agreement isn't saved on this device. Agreements are stored privately in the browser
            that created them.
          </p>
          <Link to="/" className="mt-4 inline-block rounded-xl bg-seal px-5 py-3 text-sm font-semibold text-seal-foreground">
            Back home
          </Link>
        </div>
      </StudioBackdrop>
    );
  }

  const a = agreement;

  const doSign = () => {
    if (!signName.trim() || !signing) return;
    const stamp = { name: signName.trim(), at: new Date().toISOString() };
    const next = { ...a };
    if (signing === "A") next.signatureA = stamp;
    else next.signatureB = stamp;
    if (next.signatureA && next.signatureB) {
      next.status = "signed";
      next.sealedAt = new Date().toISOString();
    } else {
      next.status = "awaiting";
    }
    update(next);
    setSignName("");
    setSigning(null);
  };

  const share = async () => {
    const url = window.location.href;
    const text = `${a.title} — our agreement on Digital Agreement`;
    if (navigator.share) {
      try {
        await navigator.share({ title: a.title, text, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <StudioBackdrop>
      <AppHeader />

      <section className="animate-rise mt-6">
        <Link to="/" className="text-[12px] font-medium text-muted-foreground">
          ← All agreements
        </Link>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-cool">
          {a.type} · {STATUS_LABEL[a.status]}
        </p>
        <h1 className="mt-1 font-display text-3xl uppercase leading-[0.95]">{a.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Between {a.partyA} and {a.partyB} · created{" "}
          {new Date(a.createdAt).toLocaleDateString()}
        </p>
      </section>

      {/* Clauses: legal + plain */}
      <section className="animate-rise mt-6 space-y-3" style={{ animationDelay: "80ms" }}>
        {a.clauses.map((c) => (
          <div key={c.title} className="glass-panel overflow-hidden rounded-2xl">
            <div className="border-b border-foreground/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                As written
              </p>
              <p className="mt-2 font-display text-base uppercase tracking-wide">{c.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/80">{c.legal}</p>
            </div>
            <div className="bg-cool/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cool">
                In plain language
              </p>
              <p className="mt-2 text-[14px] font-medium leading-relaxed">{c.plain}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Send / share */}
      <section className="animate-rise mt-6" style={{ animationDelay: "140ms" }}>
        <h2 className="font-display text-lg uppercase tracking-wide">Send to the other party</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button onClick={share} className="glass-panel rounded-xl py-3 text-sm font-semibold">
            {copied ? "Link copied" : "Share link"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${a.title} — review and sign our agreement: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
            target="_blank"
            rel="noreferrer"
            className="glass-panel grid place-items-center rounded-xl py-3 text-sm font-semibold"
          >
            WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(`Please review and sign our agreement: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
            className="glass-panel grid place-items-center rounded-xl py-3 text-sm font-semibold"
          >
            Email
          </a>
          <a
            href={`sms:?body=${encodeURIComponent(`Review and sign our agreement: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
            className="glass-panel grid place-items-center rounded-xl py-3 text-sm font-semibold"
          >
            SMS
          </a>
        </div>
      </section>

      {/* Signatures */}
      <section className="animate-rise mt-6" style={{ animationDelay: "200ms" }}>
        <h2 className="font-display text-lg uppercase tracking-wide">Signatures</h2>
        <div className="glass-panel mt-3 rounded-3xl p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {(["A", "B"] as const).map((side) => {
              const sig = side === "A" ? a.signatureA : a.signatureB;
              const who = side === "A" ? a.partyA : a.partyB;
              return (
                <div key={side}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {who}
                  </p>
                  {sig ? (
                    <>
                      <p className="mt-2 font-display text-xl text-cool">{sig.name}</p>
                      <div className="mt-1 w-full border-b border-foreground/40" />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Signed {new Date(sig.at).toLocaleString()}
                      </p>
                    </>
                  ) : signing === side ? (
                    <div className="mt-2 space-y-2">
                      <input
                        autoFocus
                        value={signName}
                        onChange={(e) => setSignName(e.target.value)}
                        placeholder="Type your full name"
                        className="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cool"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={doSign}
                          className="flex-1 rounded-lg bg-seal py-2 text-sm font-semibold text-seal-foreground"
                        >
                          Sign
                        </button>
                        <button
                          onClick={() => setSigning(null)}
                          className="rounded-lg border border-foreground/15 px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6 w-full border-b border-foreground/25" />
                      <button
                        onClick={() => setSigning(side)}
                        className="mt-2 text-[12px] font-semibold text-cool"
                      >
                        Sign as {who} →
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {a.sealedAt ? (
            <div className="mt-6 flex items-center gap-4 border-t border-foreground/10 pt-5">
              <div className="grid size-16 shrink-0 place-items-center rounded-full bg-seal text-center font-display text-[11px] leading-none text-seal-foreground ring-4 ring-seal/20">
                SEALED
                <br />
                {new Date(a.sealedAt).getFullYear()}
              </div>
              <div>
                <p className="text-sm font-semibold">Both parties have signed</p>
                <p className="text-[11px] text-muted-foreground">
                  Sealed {new Date(a.sealedAt).toLocaleString()} · record ref {a.id}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Manage */}
      <section className="animate-rise mt-6 flex flex-wrap gap-2.5" style={{ animationDelay: "260ms" }}>
        {a.status === "signed" ? (
          <button
            onClick={() => update({ ...a, status: "completed" })}
            className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background"
          >
            Mark completed
          </button>
        ) : null}
        <button
          onClick={() => window.print()}
          className="glass-panel rounded-xl px-5 py-3 text-sm font-semibold"
        >
          Print / save PDF
        </button>
        <button
          onClick={() => {
            deleteAgreement(a.id);
            navigate({ to: "/" });
          }}
          className="rounded-xl border border-destructive/40 px-5 py-3 text-sm font-semibold text-destructive"
        >
          Delete
        </button>
      </section>

      <p className="mt-10 text-center text-[11px] text-muted-foreground">
        Digital Agreement drafts for clarity, not legal advice. Review before you sign.
      </p>
    </StudioBackdrop>
  );
}
