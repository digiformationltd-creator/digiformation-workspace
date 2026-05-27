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
  ad01Complete: (list: Company[]) => internal(list).filter(RULES.isAd01Complete).length,
  readyToSell: (list: Company[]) => list.filter(RULES.isReadyToSell).length,
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
  "ready-to-sell": RULES.isReadyToSell,
};
