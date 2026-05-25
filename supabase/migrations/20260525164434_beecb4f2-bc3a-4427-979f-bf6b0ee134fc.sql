ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS ch_expiry_date date,
  ADD COLUMN IF NOT EXISTS ch_operation_date date,
  ADD COLUMN IF NOT EXISTS ch_filing_rate text;