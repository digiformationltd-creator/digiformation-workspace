
-- 1. Add new explicit status columns
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_status IN ('active','dissolved')),
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available','sold')),
  ADD COLUMN IF NOT EXISTS strike_off_status boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auth_code_status text NOT NULL DEFAULT 'missing'
    CHECK (auth_code_status IN ('available','missing')),
  ADD COLUMN IF NOT EXISTS ad01_status text NOT NULL DEFAULT 'pending'
    CHECK (ad01_status IN ('pending','processing','completed'));

-- 2. Backfill from existing data
UPDATE public.companies
SET
  lifecycle_status = CASE WHEN status = 'Dissolved' THEN 'dissolved' ELSE 'active' END,
  availability_status = CASE WHEN status = 'Sold/Transferred' THEN 'sold' ELSE 'available' END,
  strike_off_status = (status = 'Strike Off Notice'),
  auth_code_status = CASE
    WHEN auth_code IS NULL OR trim(auth_code) = '' OR lower(trim(auth_code)) = 'pending'
      THEN 'missing'
    ELSE 'available'
  END,
  ad01_status = CASE
    WHEN tags IS NOT NULL AND 'ad01-complete' = ANY(tags) THEN 'completed'
    WHEN tags IS NOT NULL AND 'ad01-processing' = ANY(tags) THEN 'processing'
    ELSE 'pending'
  END;
