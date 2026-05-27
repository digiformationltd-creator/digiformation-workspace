import type {
  Company,
  AddressStatus,
  AuthCodeStatus,
  AvailabilityStatus,
  LifecycleStatus,
  Ad01Status,
  CompanyStatus,
} from "@/types";

export type PrimaryCategory =
  | "ready_to_sell"
  | "auth_missing"
  | "address_default"
  | "strike_off"
  | "sold";

export const PRIMARY_CATEGORY_OPTIONS: { value: PrimaryCategory; label: string; emoji: string }[] = [
  { value: "ready_to_sell", label: "Active / Ready to Sell", emoji: "🟢" },
  { value: "auth_missing", label: "Auth Missing", emoji: "🔑" },
  { value: "address_default", label: "Address Default", emoji: "📍" },
  { value: "strike_off", label: "Strike Off", emoji: "⚠️" },
  { value: "sold", label: "Sold Out", emoji: "💰" },
];

/** Derive the company's primary category from its granular fields. */
export function deriveCategory(c: Company): PrimaryCategory | "active" {
  if (c.availability_status === "sold") return "sold";
  if (c.strike_off_status) return "strike_off";
  if (c.address_status === "Default Address") return "address_default";
  if (c.auth_code_status === "missing" || !c.auth_code || c.auth_code.trim() === "")
    return "auth_missing";
  return "ready_to_sell";
}

export interface CategoryFields {
  lifecycle_status: LifecycleStatus;
  availability_status: AvailabilityStatus;
  auth_code_status: AuthCodeStatus;
  address_status: AddressStatus;
  strike_off_status: boolean;
  ad01_status: Ad01Status;
  status: CompanyStatus;
}

/** Map a primary category to a complete set of underlying field values. */
export function applyCategory(cat: PrimaryCategory): CategoryFields {
  switch (cat) {
    case "ready_to_sell":
      return {
        lifecycle_status: "active",
        availability_status: "available",
        auth_code_status: "available",
        address_status: "Changed/Updated",
        strike_off_status: false,
        // No address/auth issue — AD01 was never needed.
        ad01_status: "not_required",
        status: "Available Company",
      };
    case "auth_missing":
      return {
        lifecycle_status: "active",
        availability_status: "available",
        auth_code_status: "missing",
        address_status: "Changed/Updated",
        strike_off_status: false,
        // Only auth missing — no address change required, so AD01 not required.
        ad01_status: "not_required",
        status: "Active",
      };
    case "address_default":
      return {
        lifecycle_status: "active",
        availability_status: "available",
        auth_code_status: "available",
        address_status: "Default Address",
        strike_off_status: false,
        ad01_status: "pending",
        status: "Active",
      };
    case "strike_off":
      return {
        lifecycle_status: "active",
        availability_status: "available",
        auth_code_status: "available",
        address_status: "Changed/Updated",
        strike_off_status: true,
        ad01_status: "pending",
        status: "Strike Off Notice",
      };
    case "sold":
      return {
        lifecycle_status: "active",
        availability_status: "sold",
        auth_code_status: "available",
        address_status: "Changed/Updated",
        strike_off_status: false,
        ad01_status: "not_required",
        status: "Sold/Transferred",
      };
  }
}

export function categoryBadgeClass(cat: PrimaryCategory | "active"): string {
  switch (cat) {
    case "ready_to_sell":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "auth_missing":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "address_default":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "strike_off":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
    case "sold":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function categoryLabel(cat: PrimaryCategory | "active"): string {
  const found = PRIMARY_CATEGORY_OPTIONS.find((o) => o.value === cat);
  if (found) return `${found.emoji} ${found.label}`;
  return "Active";
}
