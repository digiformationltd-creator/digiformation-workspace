import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Loader2, RefreshCw, ShieldAlert, Download } from "lucide-react";
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
import { applyFilterKey, RULES, COUNTER_BY_FILTER, type FilterKey } from "@/lib/companyRules";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 rounded-xl px-2 sm:px-4 py-2 sm:py-3 -ml-2 min-w-0">
          <div className="h-16 w-16 sm:h-28 sm:w-28 shrink-0 flex items-center justify-center -mt-2">
            <img
              src={logo}
              alt="Digiformation"
              className="h-full w-full object-contain opacity-90"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight leading-tight truncate">
              Tracking Dashboard
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
              Manage and track all your UK limited companies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0">
          {chKeyMissing && (
            <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 px-3 py-1.5 rounded-lg">
              <ShieldAlert className="h-3.5 w-3.5" />
              CH API key not configured
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refresh} className="flex-1 sm:flex-none min-w-0">
            <RefreshCw className="mr-2 h-4 w-4" />
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


      <SummaryCards companies={companies} />

      {/* Segment tabs — match rules used by Summary cards */}
      {(() => {
        const segmentDefs: { key: FilterKey | "all"; label: string }[] = [
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "dissolved", label: "Dissolved" },
          { key: "pending-sale", label: "Available" },
          { key: "sold", label: "Sold" },
          { key: "strike-off", label: "Strike Off" },
          { key: "default-address", label: "Default Addr." },
          { key: "auth-missing", label: "Auth Missing" },
          { key: "ad01", label: "AD01 Pending" },
          { key: "ad01-processing", label: "AD01 Processing" },
          { key: "ad01-filed", label: "AD01 Complete" },
          { key: "ad01-not-required", label: "AD01 Not Required" },
        ];
        const segments = segmentDefs.map((s) => ({
          key: s.key === "all" ? undefined : s.key,
          label: s.label,
          count: COUNTER_BY_FILTER[s.key as FilterKey](companies),
        }));
        return (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {segments.map((s) => {
              const isActive = (quickFilter ?? undefined) === s.key;
              return (
                <Link
                  key={s.label}
                  to="/"
                  search={s.key ? { filter: s.key } : {}}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-muted text-foreground border-border"
                  }`}
                >
                  {s.label}
                  <span
                    className={`tabular-nums text-[10px] rounded-full px-1.5 py-0.5 ${
                      isActive ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.count}
                  </span>
                </Link>
              );
            })}
          </div>
        );
      })()}

      <div className="space-y-3 min-w-0">
        <div className="bg-card rounded-lg border p-3">
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

        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground">{filteredCompanies.length}</strong> of {companies.length} companies
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

        {/* Mobile: cards */}
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

        {/* Desktop: compact table */}
        <div className="hidden md:block">

            <CompaniesTable
              companies={filteredCompanies}
              directors={directors}
              onUpdate={updateCompany}
              onDelete={isAdmin ? deleteCompany : undefined}
              isAdmin={isAdmin}
            />
          </div>
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
