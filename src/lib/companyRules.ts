/**
 * companyRules.ts — SINGLE SOURCE OF TRUTH for company business logic.
 *
 * Every counter, filter, badge, section-placement, and form derivation MUST
 * import its predicate from this file. Do NOT duplicate any of this logic
 * elsewhere — if a rule needs to change, change it here and every consumer
 * stays consistent automatically.
 */

import type {
  Company,
  CompanyStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Primary category — exactly one per company, used for section placement.
// Priority order (highest first):
//   sold → strike_off → address_default → auth_missing → ad01_processing → ready_to_sell → active
// ---------------------------------------------------------------------------
export const PRIMARY_CATEGORIES = [
  "sold",
  "strike_off",
  "address_default",
  "auth_missing",
  "ad01_processing",
  "ready_to_sell",
  "active",
] as const;
export type PrimaryCategory = (typeof PRIMARY_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Atomic predicates. Every rule below is derived ONLY from raw column values.
// ---------------------------------------------------------------------------
const hasAuthCode = (c: Company) => !!c.auth_code && c.auth_code.trim() !== "";

export const RULES = {
  // Lifecycle / sale
  isActive: (c: Company) => c.lifecycle_status === "active",
  isDissolved: (c: Company) => c.lifecycle_status === "dissolved",
  isAvailable: (c: Company) => c.availability_status === "available",
  isSold: (c: Company) => c.availability_status === "sold",

  // Issues
  isStrikeOff: (c: Company) => c.strike_off_status === true,
  isDefaultAddress: (c: Company) => c.address_status === "Default Address",
  isAuthMissing: (c: Company) =>
    c.auth_code_status === "missing" || !hasAuthCode(c),

  // AD01
  isAd01Required: (c: Company) => c.ad01_status !== "not_required",
  isAd01NotRequired: (c: Company) => c.ad01_status === "not_required",
  isAd01Pending: (c: Company) => c.ad01_status === "pending",
  isAd01Processing: (c: Company) => c.ad01_status === "processing",
  isAd01Complete: (c: Company) => c.ad01_status === "completed",

  // Composite — Ready to Sell means: active, available, no issues, real auth code.
  isReadyToSell: (c: Company) =>
    c.lifecycle_status === "active" &&
    c.availability_status === "available" &&
    c.strike_off_status === false &&
    c.auth_code_status !== "missing" &&
    hasAuthCode(c) &&
    c.address_status !== "Default Address",

  /** Pick exactly one bucket for section placement / primary badge. */
  derivePrimaryCategory(c: Company): PrimaryCategory {
    if (RULES.isSold(c)) return "sold";
    if (RULES.isStrikeOff(c)) return "strike_off";
    if (RULES.isDefaultAddress(c)) return "address_default";
    if (RULES.isAuthMissing(c)) return "auth_missing";
    if (RULES.isAd01Processing(c)) return "ad01_processing";
    if (RULES.isReadyToSell(c)) return "ready_to_sell";
    return "active";
  },

  /** All issues this company has — used for secondary badges. */
  deriveSecondaryTags(c: Company): PrimaryCategory[] {
    const tags: PrimaryCategory[] = [];
    if (RULES.isStrikeOff(c)) tags.push("strike_off");
    if (RULES.isDefaultAddress(c)) tags.push("address_default");
    if (RULES.isAuthMissing(c)) tags.push("auth_missing");
    if (RULES.isAd01Processing(c)) tags.push("ad01_processing");
    return tags;
  },

  /** Derive the legacy `status` enum from atomic flags. */
  deriveLegacyStatus(c: Company): CompanyStatus {
    if (RULES.isDissolved(c)) return "Dissolved";
    if (RULES.isStrikeOff(c)) return "Strike Off Notice";
    if (RULES.isSold(c)) return "Sold/Transferred";
    if (RULES.isAvailable(c)) return "Available Company";
    return "Active";
  },
};

// ---------------------------------------------------------------------------
// Counters — every dashboard card reads from here. No inline counting allowed.
// ---------------------------------------------------------------------------
/** Companies excluded from operational counters once sold (they leave our tracking). */
const internal = (list: Company[]) => list.filter((c) => !RULES.isSold(c));

export const COUNTERS = {
  total: (list: Company[]) => list.length,
  active: (list: Company[]) => list.filter(RULES.isActive).length,
  dissolved: (list: Company[]) => internal(list).filter(RULES.isDissolved).length,
  available: (list: Company[]) => list.filter(RULES.isAvailable).length,
  sold: (list: Company[]) => list.filter(RULES.isSold).length,
  strikeOff: (list: Company[]) => internal(list).filter(RULES.isStrikeOff).length,
  authMissing: (list: Company[]) => internal(list).filter(RULES.isAuthMissing).length,
  defaultAddress: (list: Company[]) => internal(list).filter(RULES.isDefaultAddress).length,
  ad01Pending: (list: Company[]) =>
    internal(list).filter(
      (c) =>
        RULES.isAd01Pending(c) &&
        (RULES.isAuthMissing(c) || RULES.isDefaultAddress(c)),
    ).length,
  ad01Processing: (list: Company[]) => internal(list).filter(RULES.isAd01Processing).length,
  // NEVER counts not_required — those are explicitly excluded.
  ad01Complete: (list: Company[]) => internal(list).filter(RULES.isAd01Complete).length,
  ad01NotRequired: (list: Company[]) => internal(list).filter(RULES.isAd01NotRequired).length,
  readyToSell: (list: Company[]) => list.filter(RULES.isReadyToSell).length,
};

/** Counter lookup by FilterKey — used by segment tabs to stay in sync with FILTERS. */
export const COUNTER_BY_FILTER: Record<FilterKey, (list: Company[]) => number> = {
  "all": COUNTERS.total,
  "active": COUNTERS.active,
  "dissolved": COUNTERS.dissolved,
  "pending-sale": COUNTERS.available,
  "sold": COUNTERS.sold,
  "strike-off": COUNTERS.strikeOff,
  "auth-missing": COUNTERS.authMissing,
  "default-address": COUNTERS.defaultAddress,
  "ad01": COUNTERS.ad01Pending,
  "ad01-processing": COUNTERS.ad01Processing,
  "ad01-filed": COUNTERS.ad01Complete,
  "ad01-not-required": COUNTERS.ad01NotRequired,
  "ready-to-sell": COUNTERS.readyToSell,
};

// ---------------------------------------------------------------------------
// Filters — keyed by URL-search `filter` param. Used by FilterBar + quick links.
// ---------------------------------------------------------------------------
export type FilterKey =
  | "all"
  | "active"
  | "dissolved"
  | "pending-sale"
  | "sold"
  | "strike-off"
  | "auth-missing"
  | "default-address"
  | "ad01"
  | "ad01-processing"
  | "ad01-filed"
  | "ad01-not-required"
  | "ready-to-sell";

export const FILTERS: Record<FilterKey, (c: Company) => boolean> = {
  "all": () => true,
  "active": RULES.isActive,
  "dissolved": RULES.isDissolved,
  "pending-sale": RULES.isAvailable,
  "sold": RULES.isSold,
  "strike-off": (c) => !RULES.isSold(c) && RULES.isStrikeOff(c),
  "auth-missing": (c) => !RULES.isSold(c) && RULES.isAuthMissing(c),
  "default-address": (c) => !RULES.isSold(c) && RULES.isDefaultAddress(c),
  "ad01": (c) =>
    !RULES.isSold(c) &&
    RULES.isAd01Pending(c) &&
    (RULES.isAuthMissing(c) || RULES.isDefaultAddress(c)),
  "ad01-processing": (c) => !RULES.isSold(c) && RULES.isAd01Processing(c),
  "ad01-filed": (c) => !RULES.isSold(c) && RULES.isAd01Complete(c),
  "ad01-not-required": (c) => !RULES.isSold(c) && RULES.isAd01NotRequired(c),
  "ready-to-sell": RULES.isReadyToSell,
};

/** Apply a FilterKey safely; unknown keys = no filtering. */
export function applyFilterKey(list: Company[], key: string | undefined): Company[] {
  if (!key) return list;
  const fn = FILTERS[key as FilterKey];
  return fn ? list.filter(fn) : list;
}

// ---------------------------------------------------------------------------
// Shared write-payload builder.
// Both Add Company and Edit Company forms call this with the same raw fields.
// Guarantees the legacy `status` enum + `ad01_status` are derived identically
// everywhere — no inline duplication, no hidden overrides.
// ---------------------------------------------------------------------------
import type {
  AddressStatus,
  Ad01Status,
  AuthCodeStatus,
  AvailabilityStatus,
  LifecycleStatus,
} from "@/types";

export interface CompanyFormRaw {
  company_name: string;
  company_number: string;
  previous_name?: string;
  previous_address?: string;
  previous_director_name?: string;
  incorporation_date?: string;
  company_address?: string;
  auth_code?: string;
  utr_number?: string;
  sic_codes?: string; // comma-separated
  director_id?: string; // "" or "none" → null
  lifecycle_status: LifecycleStatus;
  availability_status: AvailabilityStatus;
  auth_code_status: AuthCodeStatus;
  address_status: AddressStatus;
  strike_off_status: boolean;
  ad01_required: boolean;          // UI: Yes/No
  ad01_status: Ad01Status;         // only used when ad01_required = true
  ad01_filing_date?: string;
  ch_accounts_next_due?: string;
  ch_confirmation_statement_next_due?: string;
}

const blank = (s?: string) => (s && s.trim() !== "" ? s.trim() : null);

export function buildCompanyWritePayload(raw: CompanyFormRaw) {
  const effectiveAd01: Ad01Status = raw.ad01_required ? raw.ad01_status : "not_required";

  const previewForDerivation: Company = {
    id: "",
    company_name: raw.company_name,
    company_number: raw.company_number,
    previous_name: null,
    previous_address: null,
    previous_director_name: null,
    incorporation_date: null,
    company_address: null,
    sic_codes: null,
    auth_code: blank(raw.auth_code),
    utr_number: null,
    status: "Active",
    address_status: raw.address_status,
    lifecycle_status: raw.lifecycle_status,
    availability_status: raw.availability_status,
    strike_off_status: raw.strike_off_status,
    auth_code_status: raw.auth_code_status,
    ad01_status: effectiveAd01,
    ad01_filing_date: null,
    director_id: null,
    tags: null,
    last_ch_sync: null,
    ch_company_status: null,
    ch_company_profile: null,
    ch_address: null,
    address_match_status: null,
    ch_expiry_date: null,
    ch_operation_date: null,
    ch_filing_rate: null,
    ch_accounts_next_due: null,
    ch_confirmation_statement_next_due: null,
    created_at: "",
    updated_at: "",
  };

  return {
    company_name: raw.company_name.trim() || raw.previous_name?.trim() || "(Unnamed)",
    company_number:
      (raw.company_number?.trim() || `TEMP-${Date.now().toString(36).toUpperCase()}`).toUpperCase(),
    previous_name: blank(raw.previous_name),
    previous_address: blank(raw.previous_address),
    previous_director_name: blank(raw.previous_director_name),
    incorporation_date: blank(raw.incorporation_date),
    company_address:
      blank(raw.company_address) ?? blank(raw.previous_address) ?? null,
    auth_code: blank(raw.auth_code),
    utr_number: blank(raw.utr_number),
    sic_codes: raw.sic_codes
      ? raw.sic_codes.split(",").map((s) => s.trim()).filter(Boolean)
      : null,
    director_id:
      !raw.director_id || raw.director_id === "none" ? null : raw.director_id,
    // raw atomic facts
    address_status: raw.address_status,
    lifecycle_status: raw.lifecycle_status,
    availability_status: raw.availability_status,
    strike_off_status: raw.strike_off_status,
    auth_code_status: raw.auth_code_status,
    ad01_status: effectiveAd01,
    ad01_filing_date: blank(raw.ad01_filing_date),
    ch_accounts_next_due: blank(raw.ch_accounts_next_due),
    ch_confirmation_statement_next_due: blank(raw.ch_confirmation_statement_next_due),
    // derived centrally — never inline
    status: RULES.deriveLegacyStatus(previewForDerivation),
  };
}
