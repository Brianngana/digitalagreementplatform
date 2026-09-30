ALTER TABLE public.agreements
ALTER COLUMN party_a_email SET NOT NULL,
ALTER COLUMN party_b_email SET NOT NULL;

ALTER TABLE public.agreements
ADD CONSTRAINT agreements_distinct_party_emails CHECK (lower(party_a_email) <> lower(party_b_email));