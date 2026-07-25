/**
 * sicCategories.ts — SINGLE SOURCE OF TRUTH for SIC → Business Category.
 *
 * UK SIC 2007 codes are 5 digits. We categorise primarily by the
 * 2-digit division (first two digits), with a few 5-digit overrides
 * for common cases (e.g. holding companies, e-commerce).
 *
 * Fully dynamic: every current & future company is categorised from
 * its `sic_codes` array automatically. No hardcoded company lists.
 */

export type BusinessCategory =
  | "it_software"
  | "digital_marketing"
  | "education"
  | "ecommerce"
  | "consultancy"
  | "finance"
  | "healthcare"
  | "retail_wholesale"
  | "manufacturing"
  | "construction"
  | "property"
  | "logistics"
  | "import_export"
  | "hospitality"
  | "food_beverage"
  | "beauty"
  | "travel"
  | "media"
  | "cleaning"
  | "security"
  | "recruitment"
  | "engineering"
  | "automotive"
  | "agriculture"
  | "general_trading"
  | "holding"
  | "other";

interface CategoryMeta {
  label: string;
  icon: string; // emoji so we don't add icon deps
  /** Tailwind classes for the section header background tint. */
  headerBg: string;
  /** Tailwind classes for the coloured accent rail. */
  rail: string;
  /** Tailwind classes for the count chip. */
  chip: string;
}

export const BUSINESS_CATEGORY_META: Record<BusinessCategory, CategoryMeta> = {
  it_software: {
    label: "IT & Software",
    icon: "💻",
    headerBg: "bg-sky-500/5",
    rail: "bg-sky-500",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  digital_marketing: {
    label: "Digital Marketing",
    icon: "📣",
    headerBg: "bg-fuchsia-500/5",
    rail: "bg-fuchsia-500",
    chip: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/30",
  },
  education: {
    label: "Education & Training",
    icon: "🎓",
    headerBg: "bg-indigo-500/5",
    rail: "bg-indigo-500",
    chip: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  },
  ecommerce: {
    label: "E-commerce",
    icon: "🛒",
    headerBg: "bg-emerald-500/5",
    rail: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  consultancy: {
    label: "Consultancy",
    icon: "💼",
    headerBg: "bg-violet-500/5",
    rail: "bg-violet-500",
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
  },
  finance: {
    label: "Finance & Accounting",
    icon: "💰",
    headerBg: "bg-amber-500/5",
    rail: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  healthcare: {
    label: "Healthcare",
    icon: "🩺",
    headerBg: "bg-rose-500/5",
    rail: "bg-rose-500",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  retail_wholesale: {
    label: "Retail & Wholesale",
    icon: "🏬",
    headerBg: "bg-teal-500/5",
    rail: "bg-teal-500",
    chip: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30",
  },
  manufacturing: {
    label: "Manufacturing",
    icon: "🏭",
    headerBg: "bg-zinc-500/5",
    rail: "bg-zinc-500",
    chip: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/30",
  },
  construction: {
    label: "Construction",
    icon: "🏗️",
    headerBg: "bg-orange-500/5",
    rail: "bg-orange-500",
    chip: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
  },
  property: {
    label: "Property & Real Estate",
    icon: "🏠",
    headerBg: "bg-lime-500/5",
    rail: "bg-lime-500",
    chip: "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/30",
  },
  logistics: {
    label: "Logistics & Courier",
    icon: "🚚",
    headerBg: "bg-blue-500/5",
    rail: "bg-blue-500",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  import_export: {
    label: "Import & Export",
    icon: "🌍",
    headerBg: "bg-cyan-500/5",
    rail: "bg-cyan-500",
    chip: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
  },
  hospitality: {
    label: "Hospitality",
    icon: "🏨",
    headerBg: "bg-pink-500/5",
    rail: "bg-pink-500",
    chip: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30",
  },
  food_beverage: {
    label: "Food & Beverage",
    icon: "🍽️",
    headerBg: "bg-red-500/5",
    rail: "bg-red-500",
    chip: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  },
  beauty: {
    label: "Beauty & Salon",
    icon: "💅",
    headerBg: "bg-pink-400/5",
    rail: "bg-pink-400",
    chip: "bg-pink-400/10 text-pink-700 dark:text-pink-300 border-pink-400/30",
  },
  travel: {
    label: "Travel & Tourism",
    icon: "✈️",
    headerBg: "bg-sky-400/5",
    rail: "bg-sky-400",
    chip: "bg-sky-400/10 text-sky-700 dark:text-sky-300 border-sky-400/30",
  },
  media: {
    label: "Media & Advertising",
    icon: "🎬",
    headerBg: "bg-purple-500/5",
    rail: "bg-purple-500",
    chip: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },
  cleaning: {
    label: "Cleaning Services",
    icon: "🧽",
    headerBg: "bg-emerald-400/5",
    rail: "bg-emerald-400",
    chip: "bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/30",
  },
  security: {
    label: "Security Services",
    icon: "🛡️",
    headerBg: "bg-slate-500/5",
    rail: "bg-slate-500",
    chip: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30",
  },
  recruitment: {
    label: "Recruitment & HR",
    icon: "🧑‍💼",
    headerBg: "bg-indigo-400/5",
    rail: "bg-indigo-400",
    chip: "bg-indigo-400/10 text-indigo-700 dark:text-indigo-300 border-indigo-400/30",
  },
  engineering: {
    label: "Engineering",
    icon: "⚙️",
    headerBg: "bg-stone-500/5",
    rail: "bg-stone-500",
    chip: "bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-500/30",
  },
  automotive: {
    label: "Automotive",
    icon: "🚗",
    headerBg: "bg-red-400/5",
    rail: "bg-red-400",
    chip: "bg-red-400/10 text-red-700 dark:text-red-300 border-red-400/30",
  },
  agriculture: {
    label: "Agriculture",
    icon: "🌾",
    headerBg: "bg-green-500/5",
    rail: "bg-green-500",
    chip: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
  },
  general_trading: {
    label: "General Trading",
    icon: "📦",
    headerBg: "bg-yellow-500/5",
    rail: "bg-yellow-500",
    chip: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  },
  holding: {
    label: "Holding Companies",
    icon: "🏛️",
    headerBg: "bg-neutral-500/5",
    rail: "bg-neutral-500",
    chip: "bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border-neutral-500/30",
  },
  other: {
    label: "Other",
    icon: "📁",
    headerBg: "bg-muted/40",
    rail: "bg-slate-400",
    chip: "bg-muted text-muted-foreground border-border",
  },
};

/** Display priority — sections render top-to-bottom in this order. */
export const BUSINESS_CATEGORY_ORDER: BusinessCategory[] = [
  "it_software",
  "digital_marketing",
  "ecommerce",
  "media",
  "consultancy",
  "finance",
  "property",
  "construction",
  "engineering",
  "manufacturing",
  "retail_wholesale",
  "import_export",
  "general_trading",
  "logistics",
  "automotive",
  "healthcare",
  "education",
  "recruitment",
  "hospitality",
  "food_beverage",
  "beauty",
  "travel",
  "cleaning",
  "security",
  "agriculture",
  "holding",
  "other",
];

/** Full-code overrides (5-digit UK SIC 2007) — take precedence over division. */
const CODE_OVERRIDES: Record<string, BusinessCategory> = {
  "47910": "ecommerce", // Retail sale via mail order houses or via Internet
  "64209": "holding",
  "64200": "holding",
  "70100": "holding", // Activities of head offices
  "73110": "digital_marketing", // Advertising agencies
  "73120": "digital_marketing", // Media representation services
  "82990": "general_trading",
  "74909": "consultancy",
  "62012": "it_software",
  "62020": "it_software",
  "62090": "it_software",
  "63110": "it_software",
  "63120": "it_software",
  "96020": "beauty",
  "96040": "beauty",
  "96090": "other",
};

/** Division → category (2-digit prefix). Broad, scalable coverage. */
const DIVISION_MAP: Record<string, BusinessCategory> = {
  // Agriculture / mining
  "01": "agriculture", "02": "agriculture", "03": "agriculture",
  "05": "manufacturing", "06": "manufacturing", "07": "manufacturing",
  "08": "manufacturing", "09": "manufacturing",
  // Food & beverage manufacturing
  "10": "food_beverage", "11": "food_beverage", "12": "manufacturing",
  // Manufacturing
  "13": "manufacturing", "14": "manufacturing", "15": "manufacturing",
  "16": "manufacturing", "17": "manufacturing", "18": "manufacturing",
  "19": "manufacturing", "20": "manufacturing", "21": "healthcare",
  "22": "manufacturing", "23": "manufacturing", "24": "manufacturing",
  "25": "manufacturing", "26": "manufacturing", "27": "manufacturing",
  "28": "manufacturing", "29": "automotive", "30": "manufacturing",
  "31": "manufacturing", "32": "manufacturing", "33": "manufacturing",
  // Utilities
  "35": "other", "36": "other", "37": "other", "38": "other", "39": "other",
  // Construction
  "41": "construction", "42": "construction", "43": "construction",
  // Wholesale / retail / automotive trade
  "45": "automotive",
  "46": "import_export",
  "47": "retail_wholesale",
  // Transport & logistics
  "49": "logistics", "50": "logistics", "51": "logistics",
  "52": "logistics", "53": "logistics",
  // Hospitality
  "55": "hospitality", "56": "food_beverage",
  // Media / publishing / IT
  "58": "media", "59": "media", "60": "media",
  "61": "it_software", "62": "it_software", "63": "it_software",
  // Finance
  "64": "finance", "65": "finance", "66": "finance",
  // Property
  "68": "property",
  // Professional services
  "69": "consultancy", "70": "consultancy", "71": "engineering",
  "72": "education", "73": "digital_marketing", "74": "consultancy",
  "75": "healthcare",
  // Admin & support
  "77": "retail_wholesale", "78": "recruitment", "79": "travel",
  "80": "security", "81": "cleaning", "82": "consultancy",
  // Public / education / health
  "84": "other", "85": "education",
  "86": "healthcare", "87": "healthcare", "88": "healthcare",
  // Arts / recreation
  "90": "media", "91": "media", "92": "hospitality", "93": "hospitality",
  // Other services
  "94": "other", "95": "other", "96": "beauty",
  "97": "other", "98": "other", "99": "other",
};

const normalise = (raw: string): string => raw.replace(/\D/g, "").padStart(5, "0").slice(-5);

/**
 * Determine the business category for a company from its SIC codes.
 * Uses the FIRST valid SIC code as the primary business activity.
 */
export function getBusinessCategory(sicCodes: string[] | null | undefined): BusinessCategory {
  if (!sicCodes || sicCodes.length === 0) return "other";
  for (const raw of sicCodes) {
    if (!raw) continue;
    const code = normalise(String(raw));
    if (!code || code === "00000") continue;
    if (CODE_OVERRIDES[code]) return CODE_OVERRIDES[code];
    const div = code.slice(0, 2);
    if (DIVISION_MAP[div]) return DIVISION_MAP[div];
  }
  return "other";
}

const isBusinessCategory = (v: unknown): v is BusinessCategory =>
  typeof v === "string" && v in BUSINESS_CATEGORY_META;

/**
 * Resolve a company's business category.
 * Manual override (admin-selected) ALWAYS wins over SIC-derived category.
 */
export function resolveBusinessCategory(input: {
  manual_category?: string | null;
  sic_codes?: string[] | null;
}): BusinessCategory {
  if (isBusinessCategory(input.manual_category)) return input.manual_category;
  return getBusinessCategory(input.sic_codes ?? null);
}

export const businessCategoryLabel = (c: BusinessCategory) => BUSINESS_CATEGORY_META[c].label;
