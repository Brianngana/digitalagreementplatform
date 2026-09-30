import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudioBackdrop, AppHeader } from "@/components/StudioBackdrop";
import {
  AGREEMENT_TYPES,
  getPartyNames,
  type AgreementType,
} from "@/lib/agreements";
import { createCloudAgreement } from "@/lib/cloud-agreements";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create an agreement — Digital Agreement Platform" },
      {
        name: "description",
        content:
          "Pick an agreement type and answer a few plain questions. We draft the agreement for you.",
      },
      { property: "og:title", content: "Create an agreement — Digital Agreement Platform" },
      {
        property: "og:description",
        content: "Pick a type, answer simple questions, and get a clear agreement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const [type, setType] = useState<AgreementType | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [partyAEmail, setPartyAEmail] = useState("");
  const [partyBEmail, setPartyBEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) void navigate({ to: "/auth", search: { redirect: "/create" } });
    });
  }, [navigate]);

  if (!type) {
    return (
      <StudioBackdrop>
        <AppHeader />
        <section className="animate-rise mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cool">Step 1 of 3</p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95]">What kind of agreement?</h1>
          <p className="mt-2 max-w-[340px] text-sm text-muted-foreground">
            Pick a starting point, then answer each required question in plain language.
          </p>
        </section>

        <div className="animate-rise mt-6 grid grid-cols-2 gap-2.5" style={{ animationDelay: "80ms" }}>
          {AGREEMENT_TYPES.map((t) => (
            <Button
              key={t.id}
              onClick={() => {
                setType(t);
                setStep(0);
                setAnswers({});
              }}
              variant="ghost"
              className="glass-panel h-auto min-h-24 justify-start rounded-lg p-3.5 text-left transition-transform active:scale-[0.98]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cool">{t.tag}</span>
              <p className="mt-1 font-display text-lg uppercase tracking-wide">{t.label}</p>
            </Button>
          ))}
        </div>
      </StudioBackdrop>
    );
  }

  const questions = type.questions;
  const total = questions.length;
  const isContactStep = step === total;
  const q = questions[step];
  const value = q ? answers[q.key] ?? "" : "";
  const setValue = (v: string) => {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.key]: v }));
  };

  const finish = async () => {
    if (!type || !partyAEmail.trim() || !partyBEmail.trim()) {
      setError("Enter a valid email address for both parties.");
      return;
    }
    setSaving(true);
    setError("");
    const built = type.build(answers);
    const [partyA, partyB] = getPartyNames(type.id, answers);
    try {
      const id = await createCloudAgreement({
        agreementCode: "",
        type: type.label,
        title: built.title,
        partyA,
        partyAEmail: partyAEmail.trim(),
        partyB,
        partyBEmail: partyBEmail.trim(),
        answers,
        clauses: built.clauses,
        status: "draft",
      });
      await navigate({ to: "/agreement/$id", params: { id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not save this agreement.");
      setSaving(false);
    }
  };

  return (
    <StudioBackdrop>
      <AppHeader />

      <section className="animate-rise mt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step === 0 ? setType(null) : setStep(step - 1))}
          className="text-[12px] font-medium text-muted-foreground"
        >
          ← Back
        </Button>

        <div className="glass-panel mt-4 overflow-hidden rounded-3xl">
          <div className="flex items-start justify-between px-5 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {type.label} · Step {step + 1} of {total + 1}
              </p>
              <h2 className="mt-1 font-display text-2xl uppercase leading-tight">{isContactStep ? "Who can sign this agreement?" : q?.label}</h2>
              {isContactStep ? <p className="mt-1 text-[12px] text-muted-foreground">Only these verified email addresses can sign.</p> : q?.hint ? <p className="mt-1 text-[12px] text-muted-foreground">{q.hint}</p> : null}
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-seal/15 font-display text-sm text-seal ring-1 ring-seal/25">
              {step + 1}
            </span>
          </div>

          <div className="flex gap-1.5 px-5 pt-4">
            {Array.from({ length: total + 1 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-seal" : "bg-foreground/10"}`}
              />
            ))}
          </div>

          <div className="px-5 pt-5">
            {isContactStep ? (
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium">{getPartyNames(type.id, answers)[0]}'s email<Input type="email" value={partyAEmail} onChange={(e) => setPartyAEmail(e.target.value)} required autoComplete="email" /></label>
                <label className="grid gap-2 text-sm font-medium">{getPartyNames(type.id, answers)[1]}'s email<Input type="email" value={partyBEmail} onChange={(e) => setPartyBEmail(e.target.value)} required autoComplete="email" /></label>
              </div>
            ) : q?.type === "select" ? (
              <div className="grid gap-2">
                {(q.options ?? []).map((opt) => (
                  <Button
                    key={opt}
                    onClick={() => setValue(opt)}
                    variant="outline"
                    className={`h-auto justify-start rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      value === opt
                        ? "bg-foreground text-background"
                        : "border border-foreground/15 bg-foreground/5 text-foreground"
                    }`}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            ) : q?.type === "textarea" ? (
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={q.placeholder}
                rows={4}
                className="min-h-28"
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 focus-within:ring-2 focus-within:ring-cool">
                  {q?.type === "number" ? (
                  <span className="font-display text-sm text-muted-foreground">KSh</span>
                ) : null}
                <Input
                  type={q?.type === "number" ? "text" : q?.type}
                  inputMode={q?.type === "number" ? "numeric" : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={q?.placeholder}
                  className="h-auto border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 p-5">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="rounded-xl border border-foreground/15 px-5 py-3.5 text-sm font-semibold"
              >
                Back
              </Button>
            ) : null}
            <Button
              onClick={() => {
                if (!isContactStep && !value.trim()) { setError("Please answer this question before continuing."); return; }
                setError("");
                if (step < total) setStep(step + 1); else void finish();
              }}
              disabled={saving}
              className="h-12 flex-1 bg-seal text-seal-foreground transition-transform active:scale-[0.99]"
            >
              {saving ? "Securing agreement…" : step < total ? "Continue →" : "Create secure agreement"}
            </Button>
          </div>
          {error ? <p role="alert" className="px-5 pb-5 text-sm text-destructive">{error}</p> : null}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Your answers are secured to your account when the agreement is created.
        </p>
      </section>
    </StudioBackdrop>
  );
}
