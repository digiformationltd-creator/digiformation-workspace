ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS previous_name text,
  ADD COLUMN IF NOT EXISTS previous_address text;

ALTER TABLE public.directors
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

UPDATE public.directors
SET is_owner = true
WHERE name ILIKE '%saima%'
   OR name ILIKE '%sikandar%'
   OR name ILIKE '%zeeshan%'
   OR name ILIKE '%haroon%';