import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Loader2, RefreshCw, ShieldAlert, Download, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { exportCompaniesToExcel } from "@/lib/exportExcel";
import { Button } from "@/components/ui/button";
import { useCompanies } from "@/hooks/useCompanies";
import { SummaryCards } from "@/components/SummaryCards";
import { FilterBar } from "@/components/FilterBar";
import { CompaniesTable } from "@/components/CompaniesTable";
import { CompanyCard } from "@/components/CompanyCard";
import { CSVImport } from "@/components/CSVImport";
import { AddCompanyDialog } from "@/components/AddCompanyDialog";
import logo from "@/assets/digiformation-logo.png";
import { isOwnedCompany } from "@/lib/ownership";
import { useUserRole } from "@/hooks/useUserRole";
import { applyFilterKey, RULES, COUNTER_BY_FILTER, type FilterKey, type PrimaryCategory } from "@/lib/companyRules";
import { CompanySections } from "@/components/CompanySections";
import { toast } from "sonner";


type DashSearch = { filter?: string };

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: (search: Record<string, unknown>): DashSearch => ({
    filter: typeof search.filter === "string" ? search.filter : undefined,
  }),
  component: DashboardPage,
});


function DashboardPage() {
  const {
    companies,
    directors,
    loading,
    verifyDirector,
    updateCompany,
    deleteCompany,
    createCompany,
    createDirector,
    refresh,
  } = useCompanies();
  const { isAdmin } = useUserRole();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirector, setSelectedDirector] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [addressFilter, setAddressFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");




  const { filter: quickFilter } = Route.useSearch();
  const navigate = useNavigate();

  const clearQuickFilter = () => {
    if (quickFilter) navigate({ to: "/", search: {} });
  };

  const handleStatusChange = (v: string) => {
    clearQuickFilter();
    setActiveStatus(v);
  };
  const handleAddressChange = (v: string) => {
    clearQuickFilter();
    setAddressFilter(v);
  };
  const handleAuthChange = (v: string) => {
    clearQuickFilter();
    setAuthFilter(v);
  };

  const directorMap = useMemo(() => {
    const m = new Map<string, string>();
    directors.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [directors]);

  const filteredCompanies = useMemo(() => {
    // 1) Quick filter from URL (single source of truth — FILTERS map).
    let filtered = applyFilterKey([...companies], quickFilter);

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

    if (selectedDirector !== "all") {
      filtered = filtered.filter((c) => c.director_id === selectedDirector);
    }

    if (activeStatus !== "all") {
      if (activeStatus === "Ready to Sell") {
        filtered = filtered.filter(RULES.isReadyToSell);
      } else {
        filtered = filtered.filter((c) => c.status === activeStatus);
      }
    }

    if (addressFilter !== "all") {
      filtered = filtered.filter((c) => c.address_status === addressFilter);
    }

    if (authFilter === "has") {
      filtered = filtered.filter((c) => !RULES.isAuthMissing(c));
    } else if (authFilter === "missing") {
      filtered = filtered.filter(RULES.isAuthMissing);
    }

    // Sort tiers:
    //  0 = owned, Active, non-default-address, NOT strike-off, has auth code
    //  1 = owned, Active, non-default-address, NOT strike-off, missing auth code
    //  2 = other owned (default address / strike off / available / pending)
    //  3 = sold / non-owned
    const normalizeAddr = (a: string | null | undefined) =>
      (a ?? "").toLowerCase().replace(/[,.\s]+/g, " ").trim();

    const hasAuth = (c: typeof filtered[number]) =>
      !!c.auth_code &&
      c.auth_code.trim() !== "" &&
      c.auth_code.trim().toLowerCase() !== "pending";

    const tier = (c: typeof filtered[number]) => {
      if (!isOwnedCompany(c)) return 3;
      const cleanActive =
        c.status === "Active" &&
        c.address_status !== "Default Address";
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
  }, [companies, searchTerm, selectedDirector, activeStatus, addressFilter, authFilter, quickFilter, directorMap]);

  // Add Company logic now lives in <AddCompanyDialog />, which uses the
  // centralized buildCompanyWritePayload helper from companyRules.ts.


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const chKeyMissing = false;

  const segmentDefs: { key: FilterKey | "all"; label: string; primary?: boolean }[] = [
    { key: "all", label: "All", primary: true },
    { key: "ready-to-sell", label: "Ready to Sell", primary: true },
    { key: "auth-missing", label: "Auth Missing", primary: true },
    { key: "default-address", label: "Default Addr.", primary: true },
    { key: "strike-off", label: "Strike Off", primary: true },
    { key: "active", label: "Active", primary: true },
    { key: "sold", label: "Sold", primary: true },
    { key: "ad01-processing", label: "AD01 Processing" },
    { key: "pending-sale", label: "Available" },
    { key: "ad01", label: "AD01 Pending" },
    { key: "ad01-filed", label: "AD01 Complete" },
    { key: "ad01-not-required", label: "AD01 Not Req." },
    { key: "dissolved", label: "Dissolved" },
  ];
  const segments = segmentDefs.map((s) => ({
    key: s.key === "all" ? undefined : s.key,
    label: s.label,
    primary: !!s.primary,
    count: COUNTER_BY_FILTER[s.key as FilterKey](companies),
  }));
  const primarySegments = segments.filter((s) => s.primary);
  const overflowSegments = segments.filter((s) => !s.primary);
  const overflowActive = overflowSegments.find((s) => s.key === quickFilter);


  const FILTER_TO_CATEGORY: Partial<Record<FilterKey, PrimaryCategory>> = {
    "ready-to-sell": "ready_to_sell",
    "auth-missing": "auth_missing",
    "default-address": "address_default",
    "strike-off": "strike_off",
    "sold": "sold",
    "ad01-processing": "ad01_processing",
    "active": "active",
  };
  const onlyCategory = quickFilter
    ? FILTER_TO_CATEGORY[quickFilter as FilterKey]
    : undefined;
  const useSectionView = !quickFilter || onlyCategory !== undefined;


  return (
    <div className="space-y-2">
      {/* CONTROL CLUSTER — sticky: header + KPIs + filter pills, always in view */}
      <div className="sticky top-0 z-20 -mx-2 px-2 pt-2 pb-2 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 space-y-2 border-b">
        {/* Row 1: brand + actions */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 shrink-0 flex items-center justify-center">
              <img src={logo} alt="Digiformation" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col justify-center min-w-0 leading-tight">
              <h1 className="text-base font-bold tracking-tight truncate">Tracking Dashboard</h1>
              <p className="text-[10px] text-muted-foreground truncate">UK limited companies · operations</p>
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

        {/* Row 2: KPI strip */}
        <SummaryCards companies={companies} />

        {/* Row 3: primary filter pills + overflow dropdown — no wrap, no scroll */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex gap-1 flex-1 min-w-0 flex-nowrap overflow-hidden">
            {primarySegments.map((s) => {
              const isActive = (quickFilter ?? undefined) === s.key;
              return (
                <Link
                  key={s.label}
                  to="/"
                  search={s.key ? { filter: s.key } : {}}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card hover:bg-muted text-foreground border-border"
                  }`}
                >
                  {s.label}
                  <span
                    className={`tabular-nums text-[10px] rounded-full px-1.5 ${
                      isActive ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.count}
                  </span>
                </Link>
              );
            })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={overflowActive ? "default" : "outline"}
                size="sm"
                className="h-7 shrink-0 text-[11px] gap-1"
              >
                {overflowActive ? overflowActive.label : "More filters"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {overflowSegments.map((s) => {
                const isActive = quickFilter === s.key;
                return (
                  <DropdownMenuItem key={s.label} asChild>
                    <Link
                      to="/"
                      search={s.key ? { filter: s.key } : {}}
                      className={`flex items-center justify-between w-full text-xs ${isActive ? "font-semibold text-primary" : ""}`}
                    >
                      <span>{s.label}</span>
                      <span className="tabular-nums text-[10px] text-muted-foreground">{s.count}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Detail filters (search + director + status) — compact band */}
      <div className="bg-card rounded-lg border p-2">
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedDirector={selectedDirector}
          onDirectorChange={setSelectedDirector}
          directors={directors}
          activeStatus={activeStatus}
          onStatusChange={handleStatusChange}
          addressFilter={addressFilter}
          onAddressFilterChange={handleAddressChange}

          authFilter={authFilter}
          onAuthFilterChange={handleAuthChange}
        />
      </div>

      <div className="space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground tabular-nums">{filteredCompanies.length}</strong> of <span className="tabular-nums">{companies.length}</span> companies
            {selectedDirector !== "all" && <span className="text-primary ml-2">· Filtered by director</span>}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-[11px]"
            disabled={filteredCompanies.length === 0}
            onClick={() => {
              const label = quickFilter === "all" ? "all-companies" : quickFilter;
              exportCompaniesToExcel(filteredCompanies, label);
              toast.success(`Exported ${filteredCompanies.length} companies`);
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </Button>
        </div>



        {/* Section view: companies grouped by DB-derived primary_category.
            Each company appears in EXACTLY ONE section. For technical
            filters (AD01 stages, Dissolved, Available) fall back to flat
            rendering since they cross category boundaries. */}
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
