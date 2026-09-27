import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Agreement, AgreementStatus, Clause } from "@/lib/agreements";

type AgreementRow = {
  id: string;
  owner_id: string;
  type: string;
  title: string;
  party_a_name: string;
  party_a_email: string | null;
  party_b_name: string;
  party_b_email: string | null;
  answers: unknown;
  clauses: unknown;
  status: AgreementStatus | "cancelled";
  revision: number;
  content_hash: string;
  sealed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function requireUser(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in to continue.");
  return data.user;
}

export async function agreementHash(input: {
  type: string;
  title: string;
  partyA: string;
  partyAEmail?: string;
  partyB: string;
  partyBEmail?: string;
  answers: Record<string, string>;
  clauses: Clause[];
}): Promise<string> {
  const stable = JSON.stringify({
    type: input.type,
    title: input.title,
    partyA: input.partyA,
    partyAEmail: input.partyAEmail?.trim().toLowerCase() ?? "",
    partyB: input.partyB,
    partyBEmail: input.partyBEmail?.trim().toLowerCase() ?? "",
    answers: Object.keys(input.answers).sort().map((key) => [key, input.answers[key]]),
    clauses: input.clauses,
  });
  const bytes = new TextEncoder().encode(stable);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function rowToAgreement(row: AgreementRow): Agreement {
  return {
    id: row.id,
    ownerId: row.owner_id,
    type: row.type,
    title: row.title,
    partyA: row.party_a_name,
    ...(row.party_a_email ? { partyAEmail: row.party_a_email } : {}),
    partyB: row.party_b_name,
    ...(row.party_b_email ? { partyBEmail: row.party_b_email } : {}),
    answers: row.answers as Record<string, string>,
    clauses: row.clauses as Clause[],
    status: row.status === "cancelled" ? "draft" : row.status,
    revision: row.revision,
    contentHash: row.content_hash,
    ...(row.sealed_at ? { sealedAt: row.sealed_at } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCloudAgreements(): Promise<Agreement[]> {
  await requireUser();
  const { data, error } = await supabase.from("agreements").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as AgreementRow[]).map(rowToAgreement);
}

export async function getCloudAgreement(id: string): Promise<Agreement | undefined> {
  await requireUser();
  const { data, error } = await supabase.from("agreements").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToAgreement(data as AgreementRow) : undefined;
}

export async function createCloudAgreement(agreement: Omit<Agreement, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const user = await requireUser();
  const contentHash = await agreementHash(agreement);
  const { data, error } = await supabase.from("agreements").insert({
    owner_id: user.id,
    type: agreement.type,
    title: agreement.title,
    party_a_name: agreement.partyA,
    party_a_email: agreement.partyAEmail?.trim().toLowerCase() || user.email,
    party_b_name: agreement.partyB,
    party_b_email: agreement.partyBEmail?.trim().toLowerCase() || null,
    answers: agreement.answers,
    clauses: agreement.clauses as unknown as Json,
    status: "draft",
    content_hash: contentHash,
  }).select("id").single();
  if (error) throw error;
  await supabase.from("security_events").insert({ agreement_id: data.id, actor_id: user.id, event_type: "created" });
  return data.id;
}

export async function signCloudAgreement(agreement: Agreement, party: "A" | "B", signerName: string): Promise<void> {
  const user = await requireUser();
  const email = user.email?.toLowerCase();
  const expected = party === "A" ? agreement.partyAEmail?.toLowerCase() : agreement.partyBEmail?.toLowerCase();
  if (!email || email !== expected) throw new Error(`Sign in with ${expected ?? "the invited email"} to sign as this party.`);
  const { error } = await supabase.from("signatures").insert({
    agreement_id: agreement.id,
    signer_id: user.id,
    signer_name: signerName.trim(),
    signer_email: email,
    party,
    agreement_hash: agreement.contentHash ?? "",
  });
  if (error) throw error;
}

export async function completeCloudAgreement(agreement: Agreement): Promise<void> {
  const user = await requireUser();
  if (user.id !== agreement.ownerId) throw new Error("Only the agreement owner can complete it.");
  const { error } = await supabase.from("agreements").update({ status: "completed" }).eq("id", agreement.id);
  if (error) throw error;
  await supabase.from("security_events").insert({ agreement_id: agreement.id, actor_id: user.id, event_type: "completed" });
}

export async function deleteCloudAgreement(agreement: Agreement): Promise<void> {
  const user = await requireUser();
  if (user.id !== agreement.ownerId || agreement.status !== "draft") throw new Error("Only an unsigned draft can be deleted by its owner.");
  const { error } = await supabase.from("agreements").delete().eq("id", agreement.id);
  if (error) throw error;
}