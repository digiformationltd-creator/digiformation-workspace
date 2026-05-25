export type CompanyStatus = 'Active' | 'Available Company' | 'Sold/Transferred' | 'Strike Off Notice';
export type AddressStatus = 'Default Address' | 'Changed/Updated' | 'Active';

export interface Director {
  id: string;
  name: string;
  verification_status: string;
  created_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  company_number: string;
  incorporation_date: string | null;
  company_address: string | null;
  sic_codes: string[] | null;
  auth_code: string | null;
  utr_number: string | null;
  status: CompanyStatus;
  address_status: AddressStatus;
  ad01_filing_date: string | null;
  director_id: string | null;
  tags: string[] | null;
  last_ch_sync: string | null;
  ch_company_status: string | null;
  ch_company_profile: Record<string, unknown> | null;
  ch_address: string | null;
  address_match_status: string | null;
  ch_expiry_date: string | null;
  ch_operation_date: string | null;
  ch_filing_rate: string | null;
  created_at: string;
  updated_at: string;
  director?: Director | null;
}

export interface CompanyStatusLog {
  id: string;
  company_id: string;
  old_status: CompanyStatus | null;
  new_status: CompanyStatus | null;
  changed_by: string | null;
  changed_at: string;
}

export interface AD01Filing {
  id: string;
  company_id: string;
  filed_date: string;
  notes: string | null;
  created_at: string;
}

export interface CHSyncResult {
  success: boolean;
  ch_status?: string;
  company_name?: string;
  incorporation_date?: string;
  full_profile?: Record<string, unknown>;
  ch_address?: string;
  error?: string;
}
