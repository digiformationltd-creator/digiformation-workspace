import { useMemo } from "react";
import type { Company, Director } from "@/types";
import {
  groupByPrimaryCategory,
  SECTION_ORDER,
  categoryLabel,
  categoryBadgeClass,
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

/**
 * Renders companies grouped by `primary_category` (DB-derived).
 * Each company appears in EXACTLY ONE section.
 *
 * Counters and sections cannot disagree because both read from the same
 * grouped map — section count = bucket.length.
 */
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

  return (
    <div className="space-y-6">
      {sections.map((cat) => {
        const list = grouped[cat];
        if (list.length === 0 && !onlyCategory) return null;
        return (
          <section key={cat} id={`section-${cat}`} className="space-y-2 scroll-mt-24">
            <header className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {categoryLabel(cat)}
                </h3>
                <span
                  className={`tabular-nums text-[10px] rounded-full border px-1.5 py-0.5 ${categoryBadgeClass(
                    cat,
                  )}`}
                >
                  {list.length}
                </span>
              </div>
            </header>

            {list.length === 0 ? (
              <div className="rounded-lg border bg-card p-6 text-center text-xs text-muted-foreground">
                No companies in this category.
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="grid gap-3 md:hidden">
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
                {/* Desktop table */}
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
          </section>
        );
      })}
    </div>
  );
}
