CREATE OR REPLACE FUNCTION public.derive_company_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_auth_present boolean;
  v_addr_a text;
  v_addr_b text;
BEGIN
  v_auth_present := NEW.auth_code IS NOT NULL
                AND btrim(NEW.auth_code) <> ''
                AND lower(btrim(NEW.auth_code)) <> 'pending';

  IF NOT v_auth_present THEN
    NEW.auth_code_status := 'missing';
  ELSIF NEW.auth_code_status IS NULL OR NEW.auth_code_status = 'missing' THEN
    NEW.auth_code_status := 'available';
  END IF;

  NEW.ready_to_sell := (
    NEW.lifecycle_status = 'active'
    AND NEW.availability_status = 'available'
    AND COALESCE(NEW.strike_off_status, false) = false
    AND NEW.auth_code_status = 'available'
    AND v_auth_present
    AND NEW.address_status <> 'Default Address'
  );

  NEW.primary_category := CASE
    WHEN NEW.availability_status = 'sold'         THEN 'sold'
    WHEN COALESCE(NEW.strike_off_status,false)    THEN 'strike_off'
    WHEN NEW.address_status = 'Default Address'   THEN 'address_default'
    WHEN NEW.auth_code_status = 'missing' OR NOT v_auth_present THEN 'auth_missing'
    WHEN NEW.ad01_status = 'processing'           THEN 'ad01_processing'
    WHEN NEW.ready_to_sell                        THEN 'ready_to_sell'
    ELSE 'active'
  END;

  NEW.status := CASE
    WHEN NEW.lifecycle_status = 'dissolved'   THEN 'Dissolved'::company_status
    WHEN NEW.availability_status = 'sold'     THEN 'Sold/Transferred'::company_status
    WHEN COALESCE(NEW.strike_off_status,false) THEN 'Strike Off Notice'::company_status
    WHEN NEW.availability_status = 'available' THEN 'Available Company'::company_status
    ELSE 'Active'::company_status
  END;

  v_addr_a := public.normalize_address(NEW.company_address);
  v_addr_b := public.normalize_address(NEW.ch_address);
  NEW.address_match_status := CASE
    WHEN v_addr_a IS NULL OR v_addr_b IS NULL THEN 'Unknown'
    WHEN v_addr_a = v_addr_b                  THEN 'Matched'
    ELSE 'Mismatched'
  END;

  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill: any existing row with an auth code but status still 'missing'
UPDATE public.companies
SET auth_code_status = 'available'
WHERE auth_code IS NOT NULL
  AND btrim(auth_code) <> ''
  AND lower(btrim(auth_code)) <> 'pending'
  AND auth_code_status = 'missing';