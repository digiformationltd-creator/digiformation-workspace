import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Company, Director } from "@/types";
import {
  groupByPrimaryCategory,
  SECTION_ORDER,
  categoryLabel,
  type PrimaryCategory,
} from "@/lib/companyRules";
import {
  BUSINESS_CATEGORY_META,
  BUSINESS_CATEGORY_ORDER,
  resolveBusinessCategory,
  type BusinessCategory,
} from "@/lib/sicCategories";
import { CompaniesTable } from "@/components/CompaniesTable";
import { CompanyCard } from "@/components/CompanyCard";

interface Props {
  companies: Company[];
  directors: Director[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
  /** If set, only this section renders (the visible filter). */
  onlyCategory?: PrimaryCategory;
}

/** Visual priority styling per primary_category — drives header tint + accent rail. */
const SECTION_STYLE: Record<
  PrimaryCategory,
  { rail: string; chip: string; headerBg: string; muted?: boolean }
> = {
  ready_to_sell: {
    rail: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    headerBg: "bg-emerald-500/5",
  },
  auth_missing: {
    rail: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    headerBg: "bg-amber-500/5",
  },
  address_default: {
    rail: "bg-orange-500",
    chip: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
    headerBg: "bg-orange-500/5",
  },
  strike_off: {
    rail: "bg-rose-500",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    headerBg: "bg-rose-500/5",
  },
  active: {
    rail: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    headerBg: "bg-emerald-500/5",
  },
  sold: {
    rail: "bg-sky-500",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
    headerBg: "bg-sky-500/5",
  },
};

export function CompanySections({
  companies,
  directors,
  onUpdate,
  onDelete,
  isAdmin,
  onlyCategory,
}: Props) {
  const grouped = useMemo(() => {
    const g = groupByPrimaryCategory(companies);
    // Sold list: strictly ordered by the moment the company became sold
    // (DB-stamped `sold_at`). Falls back to updated_at only for pre-backfill rows.
    g.sold = [...g.sold].sort((a, b) => {
      const ta = new Date(a.sold_at ?? a.updated_at ?? 0).getTime();
      const tb = new Date(b.sold_at ?? b.updated_at ?? 0).getTime();
      return tb - ta;
    });
    return g;
  }, [companies]);
  const sections = onlyCategory ? [onlyCategory] : SECTION_ORDER;

  // Collapsed by default for archive sections when viewing the full dashboard.
  // Sold is always expanded and visible.
  const [collapsed, setCollapsed] = useState<Set<PrimaryCategory>>(
    () => new Set<PrimaryCategory>(),
  );

  const toggle = (cat: PrimaryCategory) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {sections.map((cat) => {
        const list = grouped[cat];
        if (list.length === 0 && !onlyCategory) return null;
        const style = SECTION_STYLE[cat];
        const isCollapsed = collapsed.has(cat);

        const isSold = cat === "sold";

        return (
          <section
            key={cat}
            id={`section-${cat}`}
            className={`scroll-mt-24 rounded-xl border overflow-hidden ${style.muted ? "opacity-90" : ""}`}
          >
            {/* Tinted header with priority rail */}
            {isSold ? (
              <div
                className={`w-full flex items-center gap-3 px-4 py-2.5 ${style.headerBg} text-left`}
              >
                <span className={`h-5 w-1 rounded-full ${style.rail} shrink-0`} />
                <h3 className="text-sm font-semibold truncate">{categoryLabel(cat)}</h3>
                <span
                  className={`tabular-nums text-[10px] font-semibold rounded-full border px-2 py-0.5 ${style.chip}`}
                >
                  {list.length}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggle(cat)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 ${style.headerBg} hover:bg-muted/40 transition-colors text-left`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-5 w-1 rounded-full ${style.rail} shrink-0`} />
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <h3 className="text-sm font-semibold truncate">{categoryLabel(cat)}</h3>
                  <span
                    className={`tabular-nums text-[10px] font-semibold rounded-full border px-2 py-0.5 ${style.chip}`}
                  >
                    {list.length}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  {isCollapsed ? "Show" : "Hide"}
                </span>
              </button>
            )}

            {(isSold || !isCollapsed) && (
              <div className="border-t bg-background">
                {list.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No companies in this category.
                  </div>
                ) : cat === "ready_to_sell" ? (
                  <ReadyToSellByBusiness
                    list={list}
                    directors={directors}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    isAdmin={isAdmin}
                  />
                ) : (
                  <>
                    <div className="grid gap-3 md:hidden p-3">
                      {list.map((c) => (
                        <CompanyCard
                          key={c.id}
                          company={c}
                          directors={directors}
                          onUpdate={onUpdate}
                          onDelete={onDelete}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                    <div className="hidden md:block">
                      <CompaniesTable
                        companies={list}
                        directors={directors}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        isAdmin={isAdmin}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ready-to-Sell sub-grouping by SIC-derived business category.
// Automatic, dynamic, and scales to every future company (see sicCategories.ts).
// ─────────────────────────────────────────────────────────────────────────────
interface RTSProps {
  list: Company[];
  directors: Director[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
}

function ReadyToSellByBusiness({ list, directors, onUpdate, onDelete, isAdmin }: RTSProps) {
  const grouped = useMemo(() => {
    const map = new Map<BusinessCategory, Company[]>();
    for (const c of list) {
      const cat = resolveBusinessCategory({ manual_category: c.manual_category, sic_codes: c.sic_codes });
      const arr = map.get(cat) ?? [];
      arr.push(c);
      map.set(cat, arr);
    }
    return map;
  }, [list]);

  const orderedCats = BUSINESS_CATEGORY_ORDER.filter((c) => (grouped.get(c)?.length ?? 0) > 0);

  const [collapsed, setCollapsed] = useState<Set<BusinessCategory>>(new Set());
  const toggle = (c: BusinessCategory) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  return (
    <div className="p-3 space-y-3">
      {orderedCats.map((bcat) => {
        const items = grouped.get(bcat)!;
        const meta = BUSINESS_CATEGORY_META[bcat];
        const isCollapsed = collapsed.has(bcat);
        return (
          <div
            key={bcat}
            className="rounded-lg border overflow-hidden bg-card transition-shadow hover:shadow-sm animate-in fade-in-50"
          >
            <button
              type="button"
              onClick={() => toggle(bcat)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 ${meta.headerBg} hover:bg-muted/40 transition-colors text-left`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`h-4 w-1 rounded-full ${meta.rail} shrink-0`} />
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-base leading-none shrink-0" aria-hidden>
                  {meta.icon}
                </span>
                <h4 className="text-xs font-semibold tracking-tight truncate">{meta.label}</h4>
                <span
                  className={`tabular-nums text-[10px] font-semibold rounded-full border px-1.5 py-0.5 ${meta.chip}`}
                >
                  {items.length}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {isCollapsed ? "Show" : "Hide"}
              </span>
            </button>
            {!isCollapsed && (
              <div className="border-t bg-background">
                <div className="grid gap-3 md:hidden p-3">
                  {items.map((c) => (
                    <CompanyCard
                      key={c.id}
                      company={c}
                      directors={directors}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
                <div className="hidden md:block">
                  <CompaniesTable
                    companies={items}
                    directors={directors}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
