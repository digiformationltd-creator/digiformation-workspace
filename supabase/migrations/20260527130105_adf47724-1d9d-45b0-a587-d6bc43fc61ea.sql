
-- ============================================================
-- Phase: Backend automation + realtime sync for companies
-- ============================================================

-- ------------------------------------------------------------
-- 1. LEGACY DATA NORMALIZATION (run BEFORE constraints/triggers)
-- ------------------------------------------------------------

-- Trim whitespace on text columns
UPDATE public.companies
SET auth_code = NULLIF(btrim(auth_code), '');

-- Coerce ad01_status to the canonical 4 values
UPDATE public.companies
SET ad01_status = 'pending'
WHERE ad01_status IS NULL
   OR ad01_status NOT IN ('pending','processing','completed','not_required');

-- Reconcile auth_code_status with actual auth_code presence
UPDATE public.companies
SET auth_code_status = CASE
  WHEN auth_code IS NULL OR btrim(auth_code) = '' OR lower(btrim(auth_code)) = 'pending'
    THEN 'missing'
  ELSE 'available'
END
WHERE auth_code_status NOT IN ('available','missing')
   OR (auth_code_status = 'available' AND (auth_code IS NULL OR btrim(auth_code) = ''));

-- Coerce lifecycle/availability to canonical values
UPDATE public.companies SET lifecycle_status = 'active'
  WHERE lifecycle_status NOT IN ('active','dissolved');
UPDATE public.companies SET availability_status = 'available'
  WHERE availability_status NOT IN ('available','sold');

-- ------------------------------------------------------------
-- 2. AD01 CONSISTENCY CONSTRAINT
-- ------------------------------------------------------------
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS ad01_status_valid;
ALTER TABLE public.companies
  ADD CONSTRAINT ad01_status_valid
  CHECK (ad01_status IN ('pending','processing','completed','not_required'));

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS auth_code_status_valid;
ALTER TABLE public.companies
  ADD CONSTRAINT auth_code_status_valid
  CHECK (auth_code_status IN ('available','missing'));

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS lifecycle_status_valid;
ALTER TABLE public.companies
  ADD CONSTRAINT lifecycle_status_valid
  CHECK (lifecycle_status IN ('active','dissolved'));

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS availability_status_valid;
ALTER TABLE public.companies
  ADD CONSTRAINT availability_status_valid
  CHECK (availability_status IN ('available','sold'));

-- ------------------------------------------------------------
-- 3. DERIVED COLUMNS (regular columns, kept in sync via trigger
--    so existing client writes don't break — values are simply
--    overwritten with the canonical derivation on every write.)
-- ------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS primary_category text,
  ADD COLUMN IF NOT EXISTS ready_to_sell boolean NOT NULL DEFAULT false;

-- Normalize address comparison
CREATE OR REPLACE FUNCTION public.normalize_address(addr text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    lower(regexp_replace(coalesce(addr, ''), '[[:space:],\.]+', ' ', 'g')),
    ''
  );
$$;

-- Single source of truth for derived fields
CREATE OR REPLACE FUNCTION public.derive_company_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_auth_present boolean;
  v_addr_a text;
  v_addr_b text;
BEGIN
  v_auth_present := NEW.auth_code IS NOT NULL
                AND btrim(NEW.auth_code) <> ''
                AND lower(btrim(NEW.auth_code)) <> 'pending';

  -- Force auth_code_status to mirror reality
  IF NOT v_auth_present THEN
    NEW.auth_code_status := 'missing';
  END IF;

  -- ready_to_sell: active + available + no issues + has auth
  NEW.ready_to_sell := (
    NEW.lifecycle_status = 'active'
    AND NEW.availability_status = 'available'
    AND COALESCE(NEW.strike_off_status, false) = false
    AND NEW.auth_code_status = 'available'
    AND v_auth_present
    AND NEW.address_status <> 'Default Address'
  );

  -- primary_category: priority order matches src/lib/companyRules.ts
  NEW.primary_category := CASE
    WHEN NEW.availability_status = 'sold'         THEN 'sold'
    WHEN COALESCE(NEW.strike_off_status,false)    THEN 'strike_off'
    WHEN NEW.address_status = 'Default Address'   THEN 'address_default'
    WHEN NEW.auth_code_status = 'missing' OR NOT v_auth_present THEN 'auth_missing'
    WHEN NEW.ad01_status = 'processing'           THEN 'ad01_processing'
    WHEN NEW.ready_to_sell                        THEN 'ready_to_sell'
    ELSE 'active'
  END;

  -- address_match_status: compare normalized company_address vs ch_address
  v_addr_a := public.normalize_address(NEW.company_address);
  v_addr_b := public.normalize_address(NEW.ch_address);
  NEW.address_match_status := CASE
    WHEN v_addr_a IS NULL OR v_addr_b IS NULL THEN 'Unknown'
    WHEN v_addr_a = v_addr_b                  THEN 'Matched'
    ELSE 'Mismatched'
  END;

  -- Keep updated_at fresh on any UPDATE
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_derive_company_fields ON public.companies;
CREATE TRIGGER trg_derive_company_fields
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.derive_company_fields();

-- Backfill existing rows (touches every row once; trigger fills derived cols)
UPDATE public.companies SET updated_at = updated_at;

-- ------------------------------------------------------------
-- 4. AUTOMATIC STATUS-CHANGE HISTORY
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_company_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.company_status_logs (company_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_company_status_change ON public.companies;
CREATE TRIGGER trg_log_company_status_change
  AFTER UPDATE OF status ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.log_company_status_change();

-- ------------------------------------------------------------
-- 5. REALTIME
-- ------------------------------------------------------------
ALTER TABLE public.companies REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'companies'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.companies';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 6. INDEXES for the new derived columns (faster dashboard filters)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_companies_primary_category
  ON public.companies (primary_category);
CREATE INDEX IF NOT EXISTS idx_companies_ready_to_sell
  ON public.companies (ready_to_sell) WHERE ready_to_sell = true;
