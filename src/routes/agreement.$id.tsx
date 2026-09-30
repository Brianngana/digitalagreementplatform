import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Copy, Download, Mail, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { StudioBackdrop, AppHeader } from "@/components/StudioBackdrop";
import { STATUS_LABEL, type Agreement } from "@/lib/agreements";
import { completeCloudAgreement, deleteCloudAgreement, getCloudAgreement, recordShareEvent, signCloudAgreement } from "@/lib/cloud-agreements";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/agreement/$id")({
  head: () => ({
    meta: [
      { title: "Secure agreement — Digital Agreement Platform" },
      {
        name: "description",
        content:
          "Review the agreement, read the plain-language explanation of each clause, share it, and sign electronically.",
      },
      { property: "og:title", content: "Secure agreement — Digital Agreement Platform" },
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      const email = data.user?.email;
      setCurrentUser(data.user && email ? { id: data.user.id, email: email.toLowerCase() } : null);
      if (!data.user) { setAgreement(null); return; }
      try { setAgreement((await getCloudAgreement(id)) ?? null); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "This agreement could not be loaded."); setAgreement(null); }
    });
  }, [id]);

  const refresh = async () => setAgreement((await getCloudAgreement(id)) ?? null);

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
            {currentUser ? "This record was not found, or your verified email is not listed as a party." : "Sign in with the email address invited to this agreement."}
          </p>
          {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
          <div className="mt-5 flex justify-center gap-2"><Button asChild className="bg-seal text-seal-foreground"><Link to={currentUser ? "/" : "/auth"}>{currentUser ? "Back home" : "Sign in securely"}</Link></Button></div>
        </div>
      </StudioBackdrop>
    );
  }

  const a = agreement;

  const doSign = async () => {
    if (!signName.trim() || !signing) return;
    setBusy(true); setError("");
    try {
      await signCloudAgreement(a, signing, signName);
      await refresh();
      setSignName(""); setSigning(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The signature could not be recorded."); }
    setBusy(false);
  };

  const share = async () => {
    const url = window.location.href;
    const text = `${a.title} — our agreement on Digital Agreement Platform`;
    if (navigator.share) {
      try {
        await navigator.share({ title: a.title, text, url });
        void recordShareEvent(a.id, "device");
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    void recordShareEvent(a.id, "link");
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
        <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-cool/25 bg-cool/10 px-3 py-2">
          <ShieldCheck className="size-4 text-cool" /><span className="font-mono text-xs font-semibold tracking-wider text-cool">{a.agreementCode}</span>
        </div>
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
          <Button variant="outline" onClick={share} className="glass-panel h-11"><Copy />{copied ? "Link copied" : "Copy link"}</Button>
          <Button asChild variant="outline" className="glass-panel h-11"><a
            href={`https://wa.me/?text=${encodeURIComponent(`${a.title} — review and sign our agreement: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Share this agreement on WhatsApp"
            onClick={() => void recordShareEvent(a.id, "whatsapp")}
          >
            <MessageCircle />WhatsApp
          </a></Button>
          <Button asChild variant="outline" className="glass-panel h-11"><a
            href={`mailto:?subject=${encodeURIComponent(a.title)}&body=${encodeURIComponent(`Please review and sign our agreement: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
            aria-label="Share this agreement by email"
            onClick={() => void recordShareEvent(a.id, "email")}
          >
            <Mail />Email
          </a></Button>
          <Button asChild variant="outline" className="glass-panel h-11"><a
            href={`sms:?body=${encodeURIComponent(`Review and sign our agreement: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
            aria-label="Share this agreement by SMS"
            onClick={() => void recordShareEvent(a.id, "sms")}
          >
            <Smartphone />SMS
          </a></Button>
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
                      <Label htmlFor={`signature-${side}`}>Type your full legal name</Label>
                      <Input
                        id={`signature-${side}`}
                        autoFocus
                        value={signName}
                        onChange={(e) => setSignName(e.target.value)}
                        placeholder="Type your full name"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => void doSign()} disabled={busy} className="flex-1 bg-seal text-seal-foreground"><Check />{busy ? "Recording…" : "Sign securely"}</Button>
                        <Button variant="outline"
                          onClick={() => setSigning(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6 w-full border-b border-foreground/25" />
                      {currentUser?.email === (side === "A" ? a.partyAEmail : a.partyBEmail)?.toLowerCase() ? <Button variant="link" onClick={() => setSigning(side)} className="mt-1 px-0 text-cool">Sign as {who} →</Button> : <p className="mt-2 text-[11px] text-muted-foreground">Waiting for {who}'s verified email</p>}
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
                  Sealed {new Date(a.sealedAt).toLocaleString()} · {a.agreementCode}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Manage */}
      <section className="animate-rise mt-6 flex flex-wrap gap-2.5" style={{ animationDelay: "260ms" }}>
        {a.status === "signed" && currentUser?.id === a.ownerId ? (
          <Button onClick={async () => { setBusy(true); setError(""); try { await completeCloudAgreement(a); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete this agreement."); } setBusy(false); }} disabled={busy}>Mark completed</Button>
        ) : null}
        <Button variant="outline"
          onClick={() => window.print()}
          className="glass-panel"
        >
          <Download />Print / save PDF
        </Button>
        {a.status === "draft" && currentUser?.id === a.ownerId ? <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive">Delete draft</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this draft?</AlertDialogTitle><AlertDialogDescription>This permanently removes {a.agreementCode}. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep draft</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { await deleteCloudAgreement(a); await navigate({ to: "/" }); }}>Delete permanently</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : null}
      </section>
      {error ? <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <p className="mt-10 text-center text-[11px] text-muted-foreground">
        Digital Agreement Platform drafts for clarity, not legal advice. Review before you sign.
      </p>
    </StudioBackdrop>
  );
}
