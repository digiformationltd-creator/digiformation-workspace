CREATE TYPE company_status AS ENUM ('Active', 'Pending Sale', 'Sold/Transferred', 'Strike Off Pending', 'Struck Off');
CREATE TYPE address_status AS ENUM ('Default Address', 'Changed/Updated');

CREATE TABLE directors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    verification_status TEXT DEFAULT 'Pending Verification',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_number TEXT UNIQUE NOT NULL,
    incorporation_date DATE,
    company_address TEXT,
    sic_codes TEXT[],
    auth_code TEXT,
    utr_number TEXT,
    status company_status DEFAULT 'Active',
    address_status address_status DEFAULT 'Default Address',
    ad01_filing_date DATE,
    director_id UUID REFERENCES directors(id) ON DELETE SET NULL,
    tags TEXT[],
    last_ch_sync TIMESTAMPTZ,
    ch_company_status TEXT,
    ch_company_profile JSONB,
    ch_address TEXT,
    address_match_status TEXT DEFAULT 'Unknown',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE company_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    old_status company_status,
    new_status company_status,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ad01_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    filed_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad01_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for authenticated users" ON directors
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users" ON companies
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users" ON company_status_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users" ON ad01_filings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_companies_number ON companies(company_number);
CREATE INDEX idx_companies_name ON companies(company_name);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_director ON companies(director_id);
CREATE INDEX idx_companies_address_status ON companies(address_status);

ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.directors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad01_filings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_status_logs;