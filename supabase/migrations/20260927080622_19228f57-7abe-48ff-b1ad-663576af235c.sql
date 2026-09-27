CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.agreement_status AS ENUM ('draft', 'awaiting', 'signed', 'completed', 'cancelled');
CREATE TYPE public.party_side AS ENUM ('A', 'B');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 100),
  phone text CHECK (phone IS NULL OR char_length(phone) BETWEEN 7 AND 30),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are private to their owner" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE TABLE public.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  type text NOT NULL CHECK (char_length(type) BETWEEN 2 AND 80),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  party_a_name text NOT NULL CHECK (char_length(party_a_name) BETWEEN 1 AND 120),
  party_a_email text,
  party_b_name text NOT NULL CHECK (char_length(party_b_name) BETWEEN 1 AND 120),
  party_b_email text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  clauses jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.agreement_status NOT NULL DEFAULT 'draft',
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  content_hash text NOT NULL CHECK (char_length(content_hash) = 64),
  sealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agreements TO authenticated;
GRANT ALL ON public.agreements TO service_role;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agreement parties can view" ON public.agreements FOR SELECT TO authenticated USING (owner_id = auth.uid() OR lower(coalesce(party_a_email, '')) = lower(coalesce(auth.jwt()->>'email', '')) OR lower(coalesce(party_b_email, '')) = lower(coalesce(auth.jwt()->>'email', '')));
CREATE POLICY "Owners can create agreements" ON public.agreements FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update agreements" ON public.agreements FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can delete agreements" ON public.agreements FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX agreements_owner_updated_idx ON public.agreements(owner_id, updated_at DESC);
CREATE INDEX agreements_party_a_email_idx ON public.agreements(lower(party_a_email));
CREATE INDEX agreements_party_b_email_idx ON public.agreements(lower(party_b_email));

CREATE TABLE public.signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL,
  signer_name text NOT NULL CHECK (char_length(signer_name) BETWEEN 2 AND 120),
  signer_email text NOT NULL,
  party public.party_side NOT NULL,
  agreement_hash text NOT NULL CHECK (char_length(agreement_hash) = 64),
  signed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agreement_id, party)
);
GRANT SELECT, INSERT ON public.signatures TO authenticated;
GRANT ALL ON public.signatures TO service_role;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agreement parties can view signatures" ON public.signatures FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.agreements a WHERE a.id = agreement_id));
CREATE POLICY "Named parties can sign once" ON public.signatures FOR INSERT TO authenticated WITH CHECK (signer_id = auth.uid() AND lower(signer_email) = lower(coalesce(auth.jwt()->>'email', '')) AND EXISTS (SELECT 1 FROM public.agreements a WHERE a.id = agreement_id AND a.status IN ('draft', 'awaiting') AND a.content_hash = agreement_hash AND ((party = 'A' AND lower(coalesce(a.party_a_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))) OR (party = 'B' AND lower(coalesce(a.party_b_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))))));

CREATE TABLE public.security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agreement_id uuid NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('created', 'shared', 'signed', 'completed', 'cancelled')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agreement parties can view security events" ON public.security_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.agreements a WHERE a.id = agreement_id));
CREATE POLICY "Agreement parties can add security events" ON public.security_events FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() AND EXISTS (SELECT 1 FROM public.agreements a WHERE a.id = agreement_id));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER agreements_set_updated_at BEFORE UPDATE ON public.agreements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();