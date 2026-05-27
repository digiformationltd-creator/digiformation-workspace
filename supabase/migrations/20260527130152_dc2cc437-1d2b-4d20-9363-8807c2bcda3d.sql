
CREATE OR REPLACE FUNCTION public.normalize_address(addr text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    lower(regexp_replace(coalesce(addr, ''), '[[:space:],\.]+', ' ', 'g')),
    ''
  );
$$;
