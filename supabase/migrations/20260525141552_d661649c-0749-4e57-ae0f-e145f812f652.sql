
-- Make changed_by nullable (already is, but ensure)
ALTER TABLE public.company_status_logs ALTER COLUMN changed_by DROP NOT NULL;

-- Replace authenticated-only policies with public-access policies
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.directors;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.company_status_logs;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.ad01_filings;

CREATE POLICY "Public full access" ON public.companies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.directors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.company_status_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.ad01_filings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
