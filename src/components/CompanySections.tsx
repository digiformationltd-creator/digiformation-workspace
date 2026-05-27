import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Company, Director } from "@/types";
import {
  groupByPrimaryCategory,
  SECTION_ORDER,
  categoryLabel,
  type PrimaryCategory,
} from "@/lib/companyRules";
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
  ad01_processing: {
    rail: "bg-blue-500",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    headerBg: "bg-blue-500/5",
  },
  active: {
    rail: "bg-slate-400",
    chip: "bg-muted text-muted-foreground border-border",
    headerBg: "bg-transparent",
  },
  sold: {
    rail: "bg-slate-300 dark:bg-slate-700",
    chip: "bg-muted text-muted-foreground border-border",
    headerBg: "bg-muted/30",
    muted: true,
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
  const grouped = useMemo(() => groupByPrimaryCategory(companies), [companies]);
  const sections = onlyCategory ? [onlyCategory] : SECTION_ORDER;

  // Collapsed by default for archive sections (Sold) when viewing the full dashboard.
  const [collapsed, setCollapsed] = useState<Set<PrimaryCategory>>(
    () => new Set<PrimaryCategory>(onlyCategory ? [] : ["sold"]),
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

        return (
          <section
            key={cat}
            id={`section-${cat}`}
            className={`scroll-mt-24 rounded-xl border overflow-hidden ${style.muted ? "opacity-90" : ""}`}
          >
            {/* Tinted header with priority rail */}
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

            {!isCollapsed && (
              <div className="border-t bg-background">
                {list.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No companies in this category.
                  </div>
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
