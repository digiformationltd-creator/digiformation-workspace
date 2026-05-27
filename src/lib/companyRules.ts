/**
 * companyRules.ts — SINGLE SOURCE OF TRUTH for company business logic.
 *
 * Most derived values (primary_category, ready_to_sell, status,
 * address_match_status) are now computed by a Postgres trigger on the
 * companies table. The helpers below prefer those DB-derived columns
 * and fall back to client-side derivation only when they are absent
 * (defensive — should never happen in normal reads).
 */

import type {
  Company,
  AddressStatus,
  Ad01Status,
  AuthCodeStatus,
  AvailabilityStatus,
  LifecycleStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Primary category — exactly one per company.
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

const isPrimaryCategory = (v: unknown): v is PrimaryCategory =>
  typeof v === "string" && (PRIMARY_CATEGORIES as readonly string[]).includes(v);

// ---------------------------------------------------------------------------
// Atomic predicates — pure functions over raw column values.
// ---------------------------------------------------------------------------
const hasAuthCode = (c: Company) => !!c.auth_code && c.auth_code.trim() !== "";

export const RULES = {
  isActive: (c: Company) => c.lifecycle_status === "active",
  isDissolved: (c: Company) => c.lifecycle_status === "dissolved",
  isAvailable: (c: Company) => c.availability_status === "available",
  isSold: (c: Company) => c.availability_status === "sold",

  isStrikeOff: (c: Company) => c.strike_off_status === true,
  isDefaultAddress: (c: Company) => c.address_status === "Default Address",
  isAuthMissing: (c: Company) =>
    c.auth_code_status === "missing" || !hasAuthCode(c),

  isAd01Required: (c: Company) => c.ad01_status !== "not_required",
  isAd01NotRequired: (c: Company) => c.ad01_status === "not_required",
  isAd01Pending: (c: Company) => c.ad01_status === "pending",
  isAd01Processing: (c: Company) => c.ad01_status === "processing",
  isAd01Complete: (c: Company) => c.ad01_status === "completed",

  /**
   * Prefer the DB-derived `ready_to_sell` column; fall back to client logic.
   */
  isReadyToSell: (c: Company) => {
    if (typeof c.ready_to_sell === "boolean") return c.ready_to_sell;
    return (
      c.lifecycle_status === "active" &&
      c.availability_status === "available" &&
      c.strike_off_status === false &&
      c.auth_code_status !== "missing" &&
      hasAuthCode(c) &&
      c.address_status !== "Default Address"
    );
  },

  /**
   * Prefer the DB-derived `primary_category` column; fall back to client logic.
   * Use this for section placement and the primary badge.
   */
  getPrimaryCategory(c: Company): PrimaryCategory {
    if (isPrimaryCategory(c.primary_category)) return c.primary_category;
    return RULES.derivePrimaryCategoryFromRaw(c);
  },

  /** Pure client derivation — used as fallback and in form previews. */
  derivePrimaryCategoryFromRaw(c: Company): PrimaryCategory {
    if (RULES.isSold(c)) return "sold";
    if (RULES.isStrikeOff(c)) return "strike_off";
    if (RULES.isDefaultAddress(c)) return "address_default";
    if (RULES.isAuthMissing(c)) return "auth_missing";
    if (RULES.isAd01Processing(c)) return "ad01_processing";
    if (RULES.isReadyToSell(c)) return "ready_to_sell";
    return "active";
  },

  /** All issue tags this company has — used for secondary badges. */
  deriveSecondaryTags(c: Company): PrimaryCategory[] {
    const tags: PrimaryCategory[] = [];
    if (RULES.isStrikeOff(c)) tags.push("strike_off");
    if (RULES.isDefaultAddress(c)) tags.push("address_default");
    if (RULES.isAuthMissing(c)) tags.push("auth_missing");
    if (RULES.isAd01Processing(c)) tags.push("ad01_processing");
    return tags;
  },
};

// ---------------------------------------------------------------------------
// Display helpers — labels, icons, badge styling (used by CompaniesTable etc).
// ---------------------------------------------------------------------------
const CATEGORY_LABELS: Record<PrimaryCategory, string> = {
  ready_to_sell: "🟢 Ready to Sell",
  auth_missing: "🔑 Auth Missing",
  address_default: "📍 Default Address",
  strike_off: "⚠️ Strike Off",
  ad01_processing: "📨 AD01 Processing",
  sold: "💰 Sold Out",
  active: "Active",
};

const CATEGORY_BADGE_CLASS: Record<PrimaryCategory, string> = {
  ready_to_sell: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  auth_missing: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  address_default: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  strike_off: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  ad01_processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  sold: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  active: "bg-muted text-muted-foreground border-border",
};

export const categoryLabel = (cat: PrimaryCategory) => CATEGORY_LABELS[cat];
export const categoryBadgeClass = (cat: PrimaryCategory) => CATEGORY_BADGE_CLASS[cat];

// ---------------------------------------------------------------------------
// Counters — every dashboard card reads from here.
// Counters use ATOMIC flags (not primary_category) because a company can
// appear in multiple issue counters simultaneously (e.g. strike_off AND
// default_address) even though it has only ONE primary category.
// ---------------------------------------------------------------------------
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
  ad01Complete: (list: Company[]) => internal(list).filter(RULES.isAd01Complete).length,
  ad01NotRequired: (list: Company[]) => internal(list).filter(RULES.isAd01NotRequired).length,
  // Prefer DB column via RULES.isReadyToSell (already DB-first).
  readyToSell: (list: Company[]) => list.filter(RULES.isReadyToSell).length,
};

// ---------------------------------------------------------------------------
// Filter map — keyed by URL `filter` param.
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

export function applyFilterKey(list: Company[], key: string | undefined): Company[] {
  if (!key) return list;
  const fn = FILTERS[key as FilterKey];
  return fn ? list.filter(fn) : list;
}

// ---------------------------------------------------------------------------
// AD01 helper: derive whether AD01 is required from raw facts.
// Used by forms to keep ad01_required toggle in sync with reality.
// ---------------------------------------------------------------------------
export interface AD01Context {
  address_status: AddressStatus;
  auth_code_status: AuthCodeStatus;
  auth_code?: string | null;
}
export function isAD01Required(ctx: AD01Context): boolean {
  const noAuth =
    ctx.auth_code_status === "missing" ||
    !ctx.auth_code ||
    ctx.auth_code.trim() === "";
  return ctx.address_status === "Default Address" || noAuth;
}

// ---------------------------------------------------------------------------
// Shared write-payload builder for Add Company + Edit Company.
// Sends ONLY raw atomic facts. The DB trigger derives status,
// primary_category, ready_to_sell and address_match_status.
// ---------------------------------------------------------------------------
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
  sic_codes?: string;
  director_id?: string;
  lifecycle_status: LifecycleStatus;
  availability_status: AvailabilityStatus;
  auth_code_status: AuthCodeStatus;
  address_status: AddressStatus;
  strike_off_status: boolean;
  ad01_required: boolean;
  ad01_status: Ad01Status;
  ad01_filing_date?: string;
  ch_accounts_next_due?: string;
  ch_confirmation_statement_next_due?: string;
}

const blank = (s?: string) => (s && s.trim() !== "" ? s.trim() : null);

export function buildCompanyWritePayload(raw: CompanyFormRaw) {
  // PHASE 5 safety: if AD01 is not required, force the status to not_required
  // so the dashboard never counts it as Completed.
  const effectiveAd01: Ad01Status = raw.ad01_required ? raw.ad01_status : "not_required";

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
    // raw atomic facts — DB trigger derives everything else
    address_status: raw.address_status,
    lifecycle_status: raw.lifecycle_status,
    availability_status: raw.availability_status,
    strike_off_status: raw.strike_off_status,
    auth_code_status: raw.auth_code_status,
    ad01_status: effectiveAd01,
    ad01_filing_date: blank(raw.ad01_filing_date),
    ch_accounts_next_due: blank(raw.ch_accounts_next_due),
    ch_confirmation_statement_next_due: blank(raw.ch_confirmation_statement_next_due),
    // NOTE: `status`, `primary_category`, `ready_to_sell` and
    // `address_match_status` are intentionally omitted — owned by DB trigger.
  };
}
