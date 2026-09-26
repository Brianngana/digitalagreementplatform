// Digital Agreement — data model, templates, and local persistence.

export type AgreementStatus = "draft" | "awaiting" | "signed" | "completed";

export interface Question {
  key: string;
  label: string;
  hint?: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
}

export interface Clause {
  title: string;
  legal: string;
  plain: string;
}

export interface Agreement {
  id: string;
  type: string;
  title: string;
  partyA: string;
  partyB: string;
  answers: Record<string, string>;
  clauses: Clause[];
  status: AgreementStatus;
  createdAt: string;
  updatedAt: string;
  signatureA?: { name: string; at: string };
  signatureB?: { name: string; at: string };
  sealedAt?: string;
}

export interface AgreementType {
  id: string;
  label: string;
  tag: string;
  questions: Question[];
  build: (a: { [key: string]: any }) => { title: string; clauses: Clause[] };
}

const money = (v: string) => (v?.trim() ? `KSh ${v.trim()}` : "the agreed amount");
const or = (v: string | undefined, fallback: string) => (v?.trim() ? v.trim() : fallback);

export const AGREEMENT_TYPES: AgreementType[] = [
  {
    id: "loan",
    label: "Loan",
    tag: "Popular",
    questions: [
      { key: "lender", label: "Who is lending the money?", type: "text", placeholder: "Full name" },
      { key: "borrower", label: "Who is borrowing?", type: "text", placeholder: "Full name" },
      { key: "amount", label: "How much is being lent?", type: "number", placeholder: "e.g. 50,000" },
      { key: "repayment", label: "How will it be repaid?", type: "select", options: ["Lump sum", "Monthly instalments", "Weekly instalments"] },
      { key: "dueDate", label: "Final repayment date", type: "date" },
      { key: "late", label: "What happens if payment is late?", type: "text", placeholder: "e.g. 5% penalty per month" },
    ],
    build: (a) => ({
      title: `Loan — ${or(a.borrower, "Borrower")}`,
      clauses: [
        {
          title: "1. The Loan",
          legal: `The Lender, ${or(a.lender, "the Lender")}, agrees to lend ${or(a.borrower, "the Borrower")} the principal sum of ${money(a.amount)}.`,
          plain: `${or(a.lender, "The lender")} is lending ${or(a.borrower, "the borrower")} ${money(a.amount)}.`,
        },
        {
          title: "2. Repayment",
          legal: `The Borrower shall repay the full principal by ${or(a.dueDate, "the agreed date")}, via ${or(a.repayment, "the agreed schedule").toLowerCase()}.`,
          plain: `The money must be fully paid back by ${or(a.dueDate, "the agreed date")}, paid as: ${or(a.repayment, "agreed schedule").toLowerCase()}.`,
        },
        {
          title: "3. Late Payment",
          legal: `In the event of late payment, the following consequence shall apply: ${or(a.late, "as agreed by both parties")}.`,
          plain: `If payment is late: ${or(a.late, "the consequence you both agreed on")}.`,
        },
      ],
    }),
  },
  {
    id: "partnership",
    label: "Business Partnership",
    tag: "Common",
    questions: [
      { key: "partnerA", label: "First partner's name", type: "text" },
      { key: "partnerB", label: "Second partner's name", type: "text" },
      { key: "business", label: "What is the business?", type: "text", placeholder: "e.g. Poultry supply in Nakuru" },
      { key: "split", label: "How are profits split?", type: "select", options: ["50 / 50", "60 / 40", "70 / 30", "Other (describe in notes)"] },
      { key: "roles", label: "Who does what?", type: "textarea", placeholder: "Each partner's responsibilities" },
      { key: "exit", label: "What happens if a partner leaves?", type: "text", placeholder: "e.g. 30 days notice, buyout at valuation" },
    ],
    build: (a) => ({
      title: `Partnership — ${or(a.business, "Business venture")}`,
      clauses: [
        {
          title: "1. The Partnership",
          legal: `${or(a.partnerA, "Partner A")} and ${or(a.partnerB, "Partner B")} hereby enter into a business partnership for: ${or(a.business, "the described venture")}.`,
          plain: `You two are going into business together: ${or(a.business, "the venture")}.`,
        },
        {
          title: "2. Profit Sharing",
          legal: `Net profits shall be distributed between the partners as follows: ${or(a.split, "as agreed")}.`,
          plain: `Profits are split ${or(a.split, "as agreed")}.`,
        },
        {
          title: "3. Responsibilities",
          legal: `Each partner shall perform the responsibilities set out herein: ${or(a.roles, "as agreed by the partners")}.`,
          plain: `Who does what: ${or(a.roles, "as agreed")}.`,
        },
        {
          title: "4. Exit",
          legal: `Should either partner wish to exit the partnership, the following terms apply: ${or(a.exit, "as agreed by both partners")}.`,
          plain: `If someone wants out: ${or(a.exit, "the agreed exit terms")}.`,
        },
      ],
    }),
  },
  {
    id: "employment",
    label: "Employment",
    tag: "Common",
    questions: [
      { key: "employer", label: "Employer name", type: "text" },
      { key: "employee", label: "Employee name", type: "text" },
      { key: "role", label: "Job title / role", type: "text", placeholder: "e.g. Shop attendant" },
      { key: "salary", label: "Salary (per month)", type: "number", placeholder: "e.g. 35,000" },
      { key: "start", label: "Start date", type: "date" },
      { key: "notice", label: "Notice period to end employment", type: "select", options: ["1 week", "2 weeks", "1 month", "3 months"] },
    ],
    build: (a) => ({
      title: `Employment — ${or(a.role, "Role")}`,
      clauses: [
        {
          title: "1. Position",
          legal: `${or(a.employer, "The Employer")} employs ${or(a.employee, "the Employee")} in the position of ${or(a.role, "the agreed role")}, commencing ${or(a.start, "on the agreed start date")}.`,
          plain: `${or(a.employee, "The employee")} starts work as ${or(a.role, "the role")} on ${or(a.start, "the start date")}.`,
        },
        {
          title: "2. Pay",
          legal: `The Employee shall receive a gross salary of ${money(a.salary)} per month, payable on the agreed payday.`,
          plain: `Pay is ${money(a.salary)} every month.`,
        },
        {
          title: "3. Ending Employment",
          legal: `Either party may terminate this agreement by giving ${or(a.notice, "the agreed notice period")} written notice.`,
          plain: `Either side can end the job with ${or(a.notice, "the agreed notice")} notice.`,
        },
      ],
    }),
  },
  {
    id: "rental",
    label: "Rental",
    tag: "Common",
    questions: [
      { key: "landlord", label: "Landlord name", type: "text" },
      { key: "tenant", label: "Tenant name", type: "text" },
      { key: "property", label: "Property / unit", type: "text", placeholder: "e.g. House No. 12, Kayole" },
      { key: "rent", label: "Monthly rent", type: "number", placeholder: "e.g. 18,000" },
      { key: "deposit", label: "Deposit amount", type: "number", placeholder: "e.g. 18,000" },
      { key: "duration", label: "Lease duration", type: "select", options: ["6 months", "1 year", "2 years", "Month-to-month"] },
    ],
    build: (a) => ({
      title: `Rental — ${or(a.property, "Property")}`,
      clauses: [
        {
          title: "1. The Property",
          legal: `${or(a.landlord, "The Landlord")} lets to ${or(a.tenant, "the Tenant")} the property known as ${or(a.property, "the described property")} for a term of ${or(a.duration, "the agreed duration")}.`,
          plain: `${or(a.tenant, "The tenant")} rents ${or(a.property, "the property")} for ${or(a.duration, "the agreed time")}.`,
        },
        {
          title: "2. Rent & Deposit",
          legal: `Rent of ${money(a.rent)} is payable monthly in advance. A refundable deposit of ${money(a.deposit)} is held against damages.`,
          plain: `Rent is ${money(a.rent)} each month, plus a ${money(a.deposit)} deposit you get back if nothing is damaged.`,
        },
      ],
    }),
  },
  {
    id: "sale",
    label: "Sale",
    tag: "Popular",
    questions: [
      { key: "seller", label: "Seller name", type: "text" },
      { key: "buyer", label: "Buyer name", type: "text" },
      { key: "item", label: "What is being sold?", type: "text", placeholder: "e.g. 500 bags of maize" },
      { key: "price", label: "Total price", type: "number", placeholder: "e.g. 150,000" },
      { key: "delivery", label: "Delivery date / terms", type: "text", placeholder: "e.g. 20 September, seller delivers" },
      { key: "payment", label: "Payment terms", type: "select", options: ["Full payment upfront", "50% before, 50% after delivery", "Payment on delivery", "Instalments"] },
    ],
    build: (a) => ({
      title: `Sale — ${or(a.item, "Goods")}`,
      clauses: [
        {
          title: "1. The Sale",
          legal: `${or(a.seller, "The Seller")} agrees to sell and ${or(a.buyer, "the Buyer")} agrees to buy ${or(a.item, "the described goods")} for the total price of ${money(a.price)}.`,
          plain: `${or(a.seller, "The seller")} sells ${or(a.item, "the goods")} to ${or(a.buyer, "the buyer")} for ${money(a.price)}.`,
        },
        {
          title: "2. Payment",
          legal: `Payment shall be made as follows: ${or(a.payment, "as agreed")}.`,
          plain: `Payment: ${or(a.payment, "as agreed").toLowerCase()}.`,
        },
        {
          title: "3. Delivery",
          legal: `Delivery terms: ${or(a.delivery, "as agreed by both parties")}.`,
          plain: `Delivery: ${or(a.delivery, "as agreed")}.`,
        },
      ],
    }),
  },
  {
    id: "service",
    label: "Service",
    tag: "Common",
    questions: [
      { key: "provider", label: "Service provider name", type: "text" },
      { key: "client", label: "Client name", type: "text" },
      { key: "service", label: "What service will be provided?", type: "textarea", placeholder: "e.g. Build a 5-page business website" },
      { key: "fee", label: "Total fee", type: "number", placeholder: "e.g. 80,000" },
      { key: "deadline", label: "Completion deadline", type: "date" },
    ],
    build: (a) => ({
      title: `Service — ${or(a.service, "Service").slice(0, 40)}`,
      clauses: [
        {
          title: "1. The Service",
          legal: `${or(a.provider, "The Provider")} shall provide to ${or(a.client, "the Client")} the following service: ${or(a.service, "the described service")}.`,
          plain: `${or(a.provider, "The provider")} will do this for ${or(a.client, "the client")}: ${or(a.service, "the service")}.`,
        },
        {
          title: "2. Fee & Deadline",
          legal: `The Client shall pay a total fee of ${money(a.fee)}. The service shall be completed by ${or(a.deadline, "the agreed deadline")}.`,
          plain: `The job costs ${money(a.fee)} and must be finished by ${or(a.deadline, "the deadline")}.`,
        },
      ],
    }),
  },
  {
    id: "freelance",
    label: "Freelance",
    tag: "Common",
    questions: [
      { key: "freelancer", label: "Freelancer name", type: "text" },
      { key: "client", label: "Client name", type: "text" },
      { key: "scope", label: "Project scope", type: "textarea", placeholder: "What exactly will be delivered?" },
      { key: "fee", label: "Project fee", type: "number" },
      { key: "revisions", label: "How many revision rounds are included?", type: "select", options: ["1", "2", "3", "Unlimited"] },
    ],
    build: (a) => ({
      title: `Freelance — ${or(a.scope, "Project").slice(0, 40)}`,
      clauses: [
        {
          title: "1. Scope of Work",
          legal: `${or(a.freelancer, "The Freelancer")} shall deliver to ${or(a.client, "the Client")}: ${or(a.scope, "the agreed scope")}.`,
          plain: `The work to be delivered: ${or(a.scope, "the scope")}.`,
        },
        {
          title: "2. Fee & Revisions",
          legal: `The fee is ${money(a.fee)}, inclusive of ${or(a.revisions, "the agreed number of")} revision round(s). Additional revisions may be charged separately.`,
          plain: `Costs ${money(a.fee)} with ${or(a.revisions, "the agreed")} round(s) of changes included.`,
        },
      ],
    }),
  },
  {
    id: "investment",
    label: "Investment",
    tag: "Serious",
    questions: [
      { key: "investor", label: "Investor name", type: "text" },
      { key: "recipient", label: "Who receives the investment?", type: "text" },
      { key: "amount", label: "Investment amount", type: "number" },
      { key: "stake", label: "What does the investor get?", type: "text", placeholder: "e.g. 20% ownership, or 15% annual return" },
      { key: "term", label: "Investment term", type: "select", options: ["6 months", "1 year", "3 years", "5 years", "Open-ended"] },
    ],
    build: (a) => ({
      title: `Investment — ${money(a.amount)}`,
      clauses: [
        {
          title: "1. The Investment",
          legal: `${or(a.investor, "The Investor")} shall invest ${money(a.amount)} in ${or(a.recipient, "the Recipient")} for a term of ${or(a.term, "the agreed term")}.`,
          plain: `${or(a.investor, "The investor")} puts in ${money(a.amount)} for ${or(a.term, "the agreed time")}.`,
        },
        {
          title: "2. Return",
          legal: `In consideration of the investment, the Investor shall receive: ${or(a.stake, "the agreed return")}.`,
          plain: `In return, the investor gets: ${or(a.stake, "the agreed return")}.`,
        },
      ],
    }),
  },
  {
    id: "nda",
    label: "NDA",
    tag: "Privacy",
    questions: [
      { key: "discloser", label: "Who is sharing the secret?", type: "text" },
      { key: "receiver", label: "Who must keep it secret?", type: "text" },
      { key: "subject", label: "What information is covered?", type: "textarea", placeholder: "e.g. Business plans, customer lists, recipes" },
      { key: "duration", label: "How long must it stay secret?", type: "select", options: ["1 year", "2 years", "5 years", "Indefinitely"] },
    ],
    build: (a) => ({
      title: `NDA — ${or(a.receiver, "Confidentiality")}`,
      clauses: [
        {
          title: "1. Confidential Information",
          legal: `${or(a.discloser, "The Disclosing Party")} shall disclose to ${or(a.receiver, "the Receiving Party")} certain confidential information concerning: ${or(a.subject, "the described subject matter")}.`,
          plain: `The secret being shared: ${or(a.subject, "the described information")}.`,
        },
        {
          title: "2. Obligation",
          legal: `The Receiving Party shall not disclose, copy, or use the confidential information for any purpose other than the agreed purpose, for a period of ${or(a.duration, "the agreed duration")}.`,
          plain: `${or(a.receiver, "The receiver")} must not share or misuse it for ${or(a.duration, "the agreed time").toLowerCase()}.`,
        },
      ],
    }),
  },
  {
    id: "custom",
    label: "Custom",
    tag: "Flexible",
    questions: [
      { key: "partyA", label: "First party", type: "text" },
      { key: "partyB", label: "Second party", type: "text" },
      { key: "subject", label: "What is this agreement about?", type: "text" },
      { key: "terms", label: "The terms, in your own words", type: "textarea", placeholder: "Write what you both agreed. We'll keep it as the record." },
    ],
    build: (a) => ({
      title: or(a.subject, "Custom agreement"),
      clauses: [
        {
          title: "1. The Agreement",
          legal: `This agreement is entered into between ${or(a.partyA, "Party A")} and ${or(a.partyB, "Party B")} concerning: ${or(a.subject, "the described matter")}.`,
          plain: `This is between ${or(a.partyA, "party A")} and ${or(a.partyB, "party B")}, about: ${or(a.subject, "the matter")}.`,
        },
        {
          title: "2. Terms",
          legal: `The parties agree to the following terms: ${or(a.terms, "as recorded")}.`,
          plain: `What you both agreed: ${or(a.terms, "the recorded terms")}.`,
        },
      ],
    }),
  },
];

export const STATUS_LABEL: Record<AgreementStatus, string> = {
  draft: "Draft",
  awaiting: "Awaiting signature",
  signed: "Signed",
  completed: "Completed",
};

// ---------- persistence (localStorage) ----------

const KEY = "digital-agreement.v1";

export function loadAgreements(): Agreement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Agreement[]) : [];
  } catch {
    return [];
  }
}

export function saveAgreements(list: Agreement[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAgreement(id: string): Agreement | undefined {
  return loadAgreements().find((a) => a.id === id);
}

export function upsertAgreement(agreement: Agreement) {
  const list = loadAgreements();
  const i = list.findIndex((a) => a.id === agreement.id);
  if (i >= 0) list[i] = agreement;
  else list.unshift(agreement);
  saveAgreements(list);
}

export function deleteAgreement(id: string) {
  saveAgreements(loadAgreements().filter((a) => a.id !== id));
}

export function newId(): string {
  return `agr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function shareUrl(id: string): string {
  return `${window.location.origin}/agreement/${id}`;
}
