import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Loader2,
  RefreshCw,
  ShieldAlert,
  Download,
  ChevronDown,
  Search,
  X,
  MoreHorizontal,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { exportCompaniesToExcel } from "@/lib/exportExcel";
import { Button } from "@/components/ui/button";
import { useCompanies } from "@/hooks/useCompanies";
import { SummaryCards } from "@/components/SummaryCards";
import { CompaniesTable } from "@/components/CompaniesTable";
import { CompanyCard } from "@/components/CompanyCard";
import { CSVImport } from "@/components/CSVImport";
import { AddCompanyDialog } from "@/components/AddCompanyDialog";
import logo from "@/assets/digiformation-logo.png";
import { isOwnedCompany } from "@/lib/ownership";
import { useUserRole } from "@/hooks/useUserRole";
import { applyFilterKey, COUNTER_BY_FILTER, type FilterKey, type PrimaryCategory } from "@/lib/companyRules";
import { CompanySections } from "@/components/CompanySections";
import { toast } from "sonner";


type DashSearch = { filter?: string };

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: (search: Record<string, unknown>): DashSearch => ({
    filter: typeof search.filter === "string" ? search.filter : undefined,
  }),
  component: DashboardPage,
});


// ─── Filter taxonomy (single source of truth for the unified bar) ───
type FilterDef = { key: FilterKey | "all"; label: string };

// Always-visible priority chips (operational critical).
const PRIMARY_CHIPS: FilterDef[] = [
  { key: "ready-to-sell", label: "Ready to Sell" },
  { key: "auth-missing", label: "Auth Missing" },
  { key: "default-address", label: "Default Address" },
  { key: "strike-off", label: "Strike Off" },
  { key: "ad01", label: "AD01 Pending" },
];

// Secondary filters — collapsed under "More Filters".
const SECONDARY_FILTERS: FilterDef[] = [
  { key: "all", label: "All Companies" },
  { key: "active", label: "Active" },
  { key: "pending-sale", label: "Available" },
  { key: "ad01-processing", label: "AD01 Processing" },
  { key: "ad01-filed", label: "AD01 Complete" },
  { key: "ad01-not-required", label: "AD01 Not Required" },
  { key: "sold", label: "Sold" },
  { key: "dissolved", label: "Dissolved" },
];

const FILTER_TO_CATEGORY: Partial<Record<FilterKey, PrimaryCategory>> = {
  "ready-to-sell": "ready_to_sell",
  "auth-missing": "auth_missing",
  "default-address": "address_default",
  "strike-off": "strike_off",
  "sold": "sold",
  "ad01-processing": "ad01_processing",
  "active": "active",
};

const ALL_FILTERS: FilterDef[] = [...PRIMARY_CHIPS, ...SECONDARY_FILTERS];

// Named exports surfaced in the export dropdown.
const EXPORT_SEGMENTS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Companies" },
  { key: "pending-sale", label: "Available Companies" },
  { key: "ready-to-sell", label: "Ready to Sell" },
  { key: "auth-missing", label: "Auth Missing" },
  { key: "default-address", label: "Default Address" },
  { key: "strike-off", label: "Strike Off" },
  { key: "sold", label: "Sold" },
  { key: "ad01", label: "AD01 Pending" },
  { key: "ad01-processing", label: "AD01 Processing" },
  { key: "ad01-filed", label: "AD01 Complete" },
];

function DashboardPage() {
  const {
    companies,
    directors,
    loading,
    updateCompany,
    deleteCompany,
    createCompany,
    createDirector,
    refresh,
  } = useCompanies();
  const { isAdmin } = useUserRole();

  // Only TWO local filter dims — both orthogonal to the URL `filter` (category/issue).
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirector, setSelectedDirector] = useState("all");

  const { filter: quickFilter } = Route.useSearch();
  const navigate = useNavigate();

  const setQuickFilter = (key: FilterKey | undefined) => {
    navigate({ to: "/", search: key ? { filter: key } : {} });
  };

  const directorMap = useMemo(() => {
    const m = new Map<string, string>();
    directors.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [directors]);

  const filteredCompanies = useMemo(() => {
    // 1) URL quickFilter is the sole category/issue filter.
    let filtered = applyFilterKey([...companies], quickFilter);

    // 2) Search (orthogonal text dim).
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => {
        const directorName = c.director_id ? directorMap.get(c.director_id) ?? "" : "";
        const sic = (c.sic_codes ?? []).join(" ");
        return (
          c.company_name.toLowerCase().includes(term) ||
          c.company_number.toLowerCase().includes(term) ||
          (c.utr_number?.toLowerCase().includes(term) ?? false) ||
          (c.auth_code?.toLowerCase().includes(term) ?? false) ||
          (c.company_address?.toLowerCase().includes(term) ?? false) ||
          (c.ch_address?.toLowerCase().includes(term) ?? false) ||
          directorName.toLowerCase().includes(term) ||
          c.status.toLowerCase().includes(term) ||
          sic.toLowerCase().includes(term)
        );
      });
    }

    // 3) Director (orthogonal owner dim).
    if (selectedDirector !== "all") {
      filtered = filtered.filter((c) => c.director_id === selectedDirector);
    }

    // Sort tiers (unchanged):
    //  0 owned-Active-clean-with-auth, 1 missing-auth, 2 other owned, 3 sold/non-owned
    const normalizeAddr = (a: string | null | undefined) =>
      (a ?? "").toLowerCase().replace(/[,.\s]+/g, " ").trim();

    const hasAuth = (c: typeof filtered[number]) =>
      !!c.auth_code &&
      c.auth_code.trim() !== "" &&
      c.auth_code.trim().toLowerCase() !== "pending";

    const tier = (c: typeof filtered[number]) => {
      if (!isOwnedCompany(c)) return 3;
      const cleanActive = c.status === "Active" && c.address_status !== "Default Address";
      if (!cleanActive) return 2;
      return hasAuth(c) ? 0 : 1;
    };

    filtered.sort((a, b) => {
      const ta = tier(a);
      const tb = tier(b);
      if (ta !== tb) return ta - tb;
      const addrA = normalizeAddr(a.company_address);
      const addrB = normalizeAddr(b.company_address);
      if (!addrA && addrB) return 1;
      if (addrA && !addrB) return -1;
      if (addrA !== addrB) return addrA.localeCompare(addrB);
      return a.company_name.localeCompare(b.company_name);
    });

    return filtered;
  }, [companies, searchTerm, selectedDirector, quickFilter, directorMap]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const chKeyMissing = false;

  // Resolve the active filter once for labelling.
  const activeFilter = quickFilter
    ? ALL_FILTERS.find((f) => f.key === quickFilter)
    : undefined;
  const activeIsSecondary = quickFilter
    ? SECONDARY_FILTERS.some((f) => f.key === quickFilter && f.key !== "all")
    : false;

  const onlyCategory = quickFilter ? FILTER_TO_CATEGORY[quickFilter as FilterKey] : undefined;
  const useSectionView = !quickFilter || onlyCategory !== undefined;

  const countOf = (key: FilterKey | "all") => COUNTER_BY_FILTER[key as FilterKey](companies);

  const activeDirectorName =
    selectedDirector !== "all" ? directorMap.get(selectedDirector) : undefined;

  const hasAnyFilter = !!quickFilter || !!searchTerm || selectedDirector !== "all";

  const clearAll = () => {
    setSearchTerm("");
    setSelectedDirector("all");
    if (quickFilter) navigate({ to: "/", search: {} });
  };

  return (
    <div className="space-y-3">
      {/* ───── STICKY CONTROL CLUSTER — single source of all primary UI ───── */}
      <div className="sticky top-0 z-20 -mx-2 px-2 pt-2 pb-2 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 space-y-3 border-b">
        {/* Row 1: brand + actions */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 shrink-0 flex items-center justify-center">
              <img src={logo} alt="Digiformation" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <h1 className="text-lg font-semibold tracking-tight truncate">Tracking Dashboard</h1>
              <p className="text-[11px] text-muted-foreground truncate">
                UK limited companies · operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {chKeyMissing && (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-warning bg-warning/10 px-2 py-1 rounded-md">
                <ShieldAlert className="h-3 w-3" />
                CH API key missing
              </div>
            )}
            <Button variant="outline" size="sm" onClick={refresh} className="h-8 text-xs">
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>
            {isAdmin && (
              <AddCompanyDialog
                directors={directors}
                createCompany={createCompany}
                createDirector={createDirector}
              />
            )}
          </div>
        </div>

        {/* Row 2: KPI strip (visual summary, not a filter UI) */}
        <SummaryCards companies={companies} />

        {/* Row 3: THE unified filter bar — only filter interface in the app */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap xl:flex-nowrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Search name, number, director, address, UTR, auth code…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs rounded-md"
            />
            {searchTerm && (
              <button
                aria-label="Clear search"
                onClick={() => setSearchTerm("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Priority filter chips — always visible, scroll horizontally on narrow screens */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0 flex-1">
            {PRIMARY_CHIPS.map((f) => {
              const isActive = quickFilter === f.key;
              const count = countOf(f.key);
              return (
                <Button
                  key={f.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickFilter(isActive ? undefined : (f.key as FilterKey))}
                  className="h-8 shrink-0 text-[11px] gap-1.5 px-2.5"
                >
                  <span>{f.label}</span>
                  <span className={`tabular-nums text-[10px] rounded px-1 ${isActive ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"}`}>
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* More Filters — secondary/low-priority only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeIsSecondary ? "default" : "outline"}
                size="sm"
                className="h-8 shrink-0 text-[11px] gap-1"
              >
                <MoreHorizontal className="h-3 w-3" />
                {activeIsSecondary ? activeFilter!.label : "More"}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                More Filters
              </DropdownMenuLabel>
              {SECONDARY_FILTERS.map((f) => {
                const isActive =
                  f.key === "all" ? !quickFilter : quickFilter === f.key;
                return (
                  <DropdownMenuItem
                    key={f.key}
                    onSelect={() => setQuickFilter(f.key === "all" ? undefined : (f.key as FilterKey))}
                    className={`text-xs flex items-center justify-between ${isActive ? "font-semibold text-primary" : ""}`}
                  >
                    <span>{f.label}</span>
                    <span className="tabular-nums text-[10px] text-muted-foreground">
                      {countOf(f.key)}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Director dropdown (local, orthogonal owner dim) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedDirector !== "all" ? "default" : "outline"}
                size="sm"
                className="h-8 shrink-0 text-[11px] gap-1 max-w-[160px]"
              >
                <Users className="h-3 w-3" />
                <span className="truncate">{activeDirectorName ?? "Director"}</span>
                <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-72 overflow-y-auto">
              <DropdownMenuItem
                onSelect={() => setSelectedDirector("all")}
                className={`text-xs ${selectedDirector === "all" ? "font-semibold text-primary" : ""}`}
              >
                All Directors
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {directors
                .filter((d) => d.is_owner)
                .map((d) => (
                  <DropdownMenuItem
                    key={d.id}
                    onSelect={() => setSelectedDirector(d.id)}
                    className={`text-xs ${selectedDirector === d.id ? "font-semibold text-primary" : ""}`}
                  >
                    {d.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-8 shrink-0 text-[11px] text-muted-foreground hover:text-destructive gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Result count + export */}
      <div className="space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground px-1">
          <span>
            Showing{" "}
            <strong className="text-foreground tabular-nums">{filteredCompanies.length}</strong> of{" "}
            <span className="tabular-nums">{companies.length}</span> companies
            {activeFilter && (
              <span className="text-primary ml-2">· {activeFilter.label}</span>
            )}
            {activeDirectorName && (
              <span className="text-primary ml-2">· {activeDirectorName}</span>
            )}
          </span>
          <div className="flex items-center">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-[11px] rounded-r-none border-r-0"
              disabled={filteredCompanies.length === 0}
              onClick={() => {
                const label = quickFilter ?? "current-view";
                exportCompaniesToExcel(filteredCompanies, label);
                toast.success(`Exported ${filteredCompanies.length} companies`);
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Export view
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-1.5 rounded-l-none"
                  aria-label="Export by segment"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Export by Segment
                </DropdownMenuLabel>
                {EXPORT_SEGMENTS.map((seg) => {
                  const subset = applyFilterKey([...companies], seg.key);
                  return (
                    <DropdownMenuItem
                      key={seg.key}
                      disabled={subset.length === 0}
                      onSelect={() => {
                        exportCompaniesToExcel(subset, seg.key);
                        toast.success(`Exported ${subset.length} · ${seg.label}`);
                      }}
                      className="text-xs flex items-center justify-between gap-3"
                    >
                      <span className="flex items-center gap-1.5">
                        <Download className="h-3 w-3 opacity-60" />
                        {seg.label}
                      </span>
                      <span className="tabular-nums text-[10px] text-muted-foreground">
                        {subset.length}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>


        {/* Section view (DB-derived primary_category) vs flat for technical filters */}
        {useSectionView ? (
          filteredCompanies.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              No companies match your filters.
            </div>
          ) : (
            <CompanySections
              companies={filteredCompanies}
              directors={directors}
              onUpdate={updateCompany}
              onDelete={isAdmin ? deleteCompany : undefined}
              isAdmin={isAdmin}
              onlyCategory={onlyCategory}
            />
          )
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredCompanies.length === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                  No companies match your filters.
                </div>
              ) : (
                filteredCompanies.map((c) => (
                  <CompanyCard
                    key={c.id}
                    company={c}
                    directors={directors}
                    onUpdate={updateCompany}
                    onDelete={isAdmin ? deleteCompany : undefined}
                    isAdmin={isAdmin}
                  />
                ))
              )}
            </div>
            <div className="hidden md:block">
              <CompaniesTable
                companies={filteredCompanies}
                directors={directors}
                onUpdate={updateCompany}
                onDelete={isAdmin ? deleteCompany : undefined}
                isAdmin={isAdmin}
              />
            </div>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Bulk Import</h2>
          <CSVImport onSuccess={refresh} />
        </div>
      )}
    </div>
  );
}
