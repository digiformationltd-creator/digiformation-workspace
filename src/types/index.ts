export type CompanyStatus = 'Active' | 'Available Company' | 'Sold/Transferred' | 'Strike Off Notice' | 'Dissolved';
export type AddressStatus = 'Default Address' | 'Changed/Updated' | 'Active';

export type LifecycleStatus = 'active' | 'dissolved';
export type AvailabilityStatus = 'available' | 'sold';
export type AuthCodeStatus = 'available' | 'missing';
export type Ad01Status = 'pending' | 'processing' | 'completed' | 'not_required';

export interface Director {
  id: string;
  name: string;
  verification_status: string;
  is_owner: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  company_number: string;
  previous_name: string | null;
  previous_address: string | null;
  previous_director_name: string | null;
  incorporation_date: string | null;
  company_address: string | null;
  sic_codes: string[] | null;
  auth_code: string | null;
  utr_number: string | null;
  status: CompanyStatus;
  address_status: AddressStatus;
  lifecycle_status: LifecycleStatus;
  availability_status: AvailabilityStatus;
  strike_off_status: boolean;
  auth_code_status: AuthCodeStatus;
  ad01_status: Ad01Status;
  ad01_filing_date: string | null;
  director_id: string | null;
  tags: string[] | null;
  last_ch_sync: string | null;
  ch_company_status: string | null;
  ch_company_profile: Record<string, unknown> | null;
  ch_address: string | null;
  address_match_status: string | null;
  /** DB-derived: single-bucket category, computed by trigger. */
  primary_category: string | null;
  /** DB-derived: true only for clean, sellable companies. */
  ready_to_sell: boolean;
  ch_expiry_date: string | null;
  ch_operation_date: string | null;
  ch_filing_rate: string | null;
  ch_accounts_next_due: string | null;
  ch_confirmation_statement_next_due: string | null;
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
