CREATE OR REPLACE FUNCTION public.protect_agreement_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  signature_count integer;
BEGIN
  SELECT count(*) INTO signature_count FROM public.signatures WHERE agreement_id = OLD.id;
  IF signature_count > 0 AND (
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.type IS DISTINCT FROM OLD.type OR
    NEW.party_a_name IS DISTINCT FROM OLD.party_a_name OR
    NEW.party_a_email IS DISTINCT FROM OLD.party_a_email OR
    NEW.party_b_name IS DISTINCT FROM OLD.party_b_name OR
    NEW.party_b_email IS DISTINCT FROM OLD.party_b_email OR
    NEW.answers IS DISTINCT FROM OLD.answers OR
    NEW.clauses IS DISTINCT FROM OLD.clauses OR
    NEW.content_hash IS DISTINCT FROM OLD.content_hash OR
    NEW.revision IS DISTINCT FROM OLD.revision
  ) THEN
    RAISE EXCEPTION 'Signed agreement content cannot be changed';
  END IF;
  IF NEW.status IN ('signed', 'completed') AND signature_count < 2 THEN
    RAISE EXCEPTION 'Both verified signatures are required';
  END IF;
  IF OLD.status = 'completed' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Completed agreements cannot be reopened';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER agreements_protect_integrity BEFORE UPDATE ON public.agreements FOR EACH ROW EXECUTE FUNCTION public.protect_agreement_integrity();

CREATE OR REPLACE FUNCTION public.apply_verified_signature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signature_count integer;
BEGIN
  SELECT count(*) INTO signature_count FROM public.signatures WHERE agreement_id = NEW.agreement_id;
  UPDATE public.agreements
  SET status = CASE WHEN signature_count >= 2 THEN 'signed'::public.agreement_status ELSE 'awaiting'::public.agreement_status END,
      sealed_at = CASE WHEN signature_count >= 2 THEN now() ELSE NULL END
  WHERE id = NEW.agreement_id;
  INSERT INTO public.security_events (agreement_id, actor_id, event_type, details)
  VALUES (NEW.agreement_id, NEW.signer_id, 'signed', jsonb_build_object('party', NEW.party, 'agreement_hash', NEW.agreement_hash));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_verified_signature() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER signatures_apply_verified AFTER INSERT ON public.signatures FOR EACH ROW EXECUTE FUNCTION public.apply_verified_signature();