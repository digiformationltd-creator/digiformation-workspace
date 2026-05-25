ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS ch_accounts_next_due date,
  ADD COLUMN IF NOT EXISTS ch_confirmation_statement_next_due date;