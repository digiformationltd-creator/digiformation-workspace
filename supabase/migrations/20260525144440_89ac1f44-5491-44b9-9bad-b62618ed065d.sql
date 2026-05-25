-- Drop existing public-access policies
DROP POLICY IF EXISTS "Public full access" ON public.companies;
DROP POLICY IF EXISTS "Public full access" ON public.directors;
DROP POLICY IF EXISTS "Public full access" ON public.ad01_filings;
DROP POLICY IF EXISTS "Public full access" ON public.company_status_logs;

-- Authenticated-only access
CREATE POLICY "Authenticated full access" ON public.companies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON public.directors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON public.ad01_filings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON public.company_status_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);