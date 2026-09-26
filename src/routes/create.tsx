import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StudioBackdrop, AppHeader } from "@/components/StudioBackdrop";
import {
  AGREEMENT_TYPES,
  newId,
  upsertAgreement,
  type Agreement,
  type AgreementType,
} from "@/lib/agreements";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create an agreement — Digital Agreement" },
      {
        name: "description",
        content:
          "Pick an agreement type and answer a few plain questions. We draft the agreement for you.",
      },
      { property: "og:title", content: "Create an agreement — Digital Agreement" },
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

  if (!type) {
    return (
      <StudioBackdrop>
        <AppHeader />
        <section className="animate-rise mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cool">Step 1 of 3</p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95]">What kind of agreement?</h1>
          <p className="mt-2 max-w-[340px] text-sm text-muted-foreground">
            Pick a starting point. You can change every detail afterwards.
          </p>
        </section>

        <div className="animate-rise mt-6 grid grid-cols-2 gap-2.5" style={{ animationDelay: "80ms" }}>
          {AGREEMENT_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setType(t);
                setStep(0);
                setAnswers({});
              }}
              className="glass-panel rounded-xl p-3.5 text-left transition-transform active:scale-[0.98]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cool">{t.tag}</span>
              <p className="mt-1 font-display text-lg uppercase tracking-wide">{t.label}</p>
            </button>
          ))}
        </div>
      </StudioBackdrop>
    );
  }

  const questions = type.questions;
  const q = questions[step]!;
  const total = questions.length;
  const value = answers[q.key] ?? "";
  const setValue = (v: string) => setAnswers((prev) => ({ ...prev, [q.key]: v }));

  const finish = () => {
    const built = type.build(answers);
    const names = Object.values(answers).filter((v) => v && !/^\d/.test(v));
    const now = new Date().toISOString();
    const agreement: Agreement = {
      id: newId(),
      type: type.label,
      title: built.title,
      partyA: names[0] ?? "Party A",
      partyB: names[1] ?? "Party B",
      answers,
      clauses: built.clauses,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    upsertAgreement(agreement);
    navigate({ to: "/agreement/$id", params: { id: agreement.id } });
  };

  return (
    <StudioBackdrop>
      <AppHeader />

      <section className="animate-rise mt-8">
        <button
          onClick={() => (step === 0 ? setType(null) : setStep(step - 1))}
          className="text-[12px] font-medium text-muted-foreground"
        >
          ← Back
        </button>

        <div className="glass-panel mt-4 overflow-hidden rounded-3xl">
          <div className="flex items-start justify-between px-5 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {type.label} · Question {step + 1} of {total}
              </p>
              <h2 className="mt-1 font-display text-2xl uppercase leading-tight">{q.label}</h2>
              {q.hint ? <p className="mt-1 text-[12px] text-muted-foreground">{q.hint}</p> : null}
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-seal/15 font-display text-sm text-seal ring-1 ring-seal/25">
              {step + 1}
            </span>
          </div>

          <div className="flex gap-1.5 px-5 pt-4">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-seal" : "bg-foreground/10"}`}
              />
            ))}
          </div>

          <div className="px-5 pt-5">
            {q.type === "select" ? (
              <div className="grid gap-2">
                {q.options!.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setValue(opt)}
                    className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      value === opt
                        ? "bg-foreground text-background"
                        : "border border-foreground/15 bg-foreground/5 text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : q.type === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={q.placeholder}
                rows={4}
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-cool"
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 focus-within:ring-2 focus-within:ring-cool">
                {q.type === "number" ? (
                  <span className="font-display text-sm text-muted-foreground">KSh</span>
                ) : null}
                <input
                  type={q.type === "number" ? "text" : q.type}
                  inputMode={q.type === "number" ? "numeric" : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 p-5">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-xl border border-foreground/15 px-5 py-3.5 text-sm font-semibold"
              >
                Back
              </button>
            ) : null}
            <button
              onClick={() => (step + 1 < total ? setStep(step + 1) : finish())}
              className="flex-1 rounded-xl bg-seal py-3.5 text-sm font-semibold text-seal-foreground transition-transform active:scale-[0.99]"
            >
              {step + 1 < total ? "Continue →" : "Generate agreement"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          You can skip a question and fill it in later.
        </p>
      </section>
    </StudioBackdrop>
  );
}
