ALTER TABLE public.agreements
ADD COLUMN agreement_code text NOT NULL DEFAULT ('DAP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));

ALTER TABLE public.agreements
ADD CONSTRAINT agreements_agreement_code_format CHECK (agreement_code ~ '^DAP-[A-F0-9]{10}$');

ALTER TABLE public.agreements
ADD CONSTRAINT agreements_agreement_code_key UNIQUE (agreement_code);

CREATE INDEX agreements_code_lookup_idx ON public.agreements (agreement_code);