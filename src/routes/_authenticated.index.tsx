import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanies } from "@/hooks/useCompanies";
import { SummaryCards } from "@/components/SummaryCards";
import { FilterBar } from "@/components/FilterBar";
import { CompaniesTable } from "@/components/CompaniesTable";
import { CompanyCard } from "@/components/CompanyCard";
import { CSVImport } from "@/components/CSVImport";
import logo from "@/assets/digiformation-logo.png";
import { isOwnedCompany } from "@/lib/ownership";
import { useUserRole } from "@/hooks/useUserRole";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Company } from "@/types";

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
    markAsSold,
    markAd01Filed,
    markAd01Complete,
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
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDirectorName, setNewDirectorName] = useState("");


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
    let filtered = [...companies];

    if (quickFilter === "active") {
      filtered = filtered.filter((c) => c.status === "Active");
    } else if (quickFilter === "ad01") {
      filtered = filtered.filter((c) => isOwnedCompany(c) && c.status === "Active" && !c.ad01_filing_date && ((!c.auth_code || c.auth_code.trim() === "" || c.auth_code.trim().toLowerCase() === "pending") || c.address_status === "Default Address"));
    } else if (quickFilter === "ad01-processing") {
      filtered = filtered.filter((c) => isOwnedCompany(c) && c.status === "Active" && !!c.ad01_filing_date && !(Array.isArray(c.tags) && c.tags.includes("ad01-complete")) && ((!c.auth_code || c.auth_code.trim() === "" || c.auth_code.trim().toLowerCase() === "pending") || c.address_status === "Default Address"));
    } else if (quickFilter === "ad01-filed") {
      filtered = filtered.filter((c) => isOwnedCompany(c) && Array.isArray(c.tags) && c.tags.includes("ad01-complete"));
    } else if (quickFilter === "pending-sale") {
      filtered = filtered.filter((c) => c.status === "Available Company");
    } else if (quickFilter === "sold") {
      filtered = filtered.filter((c) => c.status === "Sold/Transferred" || (c.director ? !c.director.is_owner : true));
    } else if (quickFilter === "default-address") {
      filtered = filtered.filter((c) => c.address_status === "Default Address");
    } else if (quickFilter === "strike-off") {
      filtered = filtered.filter((c) => c.status === "Strike Off Notice" && isOwnedCompany(c));
    } else if (quickFilter === "auth-missing") {
      filtered = filtered.filter((c) => isOwnedCompany(c) && c.status === "Active" && (!c.auth_code || c.auth_code.trim() === "" || c.auth_code.trim().toLowerCase() === "pending"));
    }

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
      filtered = filtered.filter((c) => c.status === activeStatus);
    }

    if (addressFilter !== "all") {
      filtered = filtered.filter((c) => c.address_status === addressFilter);
    }

    if (authFilter === "has") {
      filtered = filtered.filter((c) => !!c.auth_code && c.auth_code.trim() !== "" && c.auth_code.trim().toLowerCase() !== "pending");
    } else if (authFilter === "missing") {
      filtered = filtered.filter((c) => !c.auth_code || c.auth_code.trim() === "" || c.auth_code.trim().toLowerCase() === "pending");
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


  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    try {
      const currentName = ((formData.get("company_name") as string) || "").trim();
      const originalName = ((formData.get("previous_name") as string) || "").trim();
      const currentAddress = ((formData.get("company_address") as string) || "").trim();
      const originalAddress = ((formData.get("previous_address") as string) || "").trim();
      const companyNumber = ((formData.get("company_number") as string) || "").trim();

      await createCompany({
        // Current/New name is primary; fall back to original if only old is filled
        company_name: currentName || originalName || "(Unnamed)",
        company_number: companyNumber.toUpperCase(),
        incorporation_date: (formData.get("incorporation_date") as string) || null,
        company_address: currentAddress || originalAddress || null,
        previous_name: originalName || null,
        previous_address: originalAddress || null,
        previous_director_name: (formData.get("previous_director_name") as string) || null,
        sic_codes: (formData.get("sic_codes") as string)
          ? (formData.get("sic_codes") as string).split(",").map((s) => s.trim())
          : null,
        auth_code: (formData.get("auth_code") as string) || null,
        utr_number: (formData.get("utr_number") as string) || null,
        director_id: (formData.get("director_id") as string) || null,
        status: (formData.get("status") as Company["status"]) || "Active",
        address_status: (formData.get("address_status") as Company["address_status"]) || "Default Address",
        ad01_filing_date: (formData.get("ad01_filing_date") as string) || null,
        ch_expiry_date: (formData.get("ch_expiry_date") as string) || null,
        ch_operation_date: (formData.get("ch_operation_date") as string) || null,
        ch_filing_rate: (formData.get("ch_filing_rate") as string) || null,
        ch_accounts_next_due: (formData.get("ch_accounts_next_due") as string) || null,
        ch_confirmation_statement_next_due: (formData.get("ch_confirmation_statement_next_due") as string) || null,
      });
      form.reset();
      setShowAddForm(false);
    } catch {
      // toast handled in hook
    } finally {
      setSubmitting(false);
    }
  };

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
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-none min-w-0">
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCompany} className="space-y-4">

                <div className="rounded-lg border p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Name</p>
                  <div className="space-y-2">
                    <Label htmlFor="previous_name">Original / Old Company Name</Label>
                    <Input id="previous_name" name="previous_name" placeholder="As originally incorporated" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Current / New Company Name</Label>
                    <Input id="company_name" name="company_name" placeholder="Current trading name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_number">Company Number</Label>
                  <Input id="company_number" name="company_number" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="incorporation_date">Incorporation Date</Label>
                    <Input id="incorporation_date" name="incorporation_date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="Active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Available Company">Available Company</SelectItem>
                        <SelectItem value="Sold/Transferred">Sold/Transferred</SelectItem>
                        <SelectItem value="Strike Off Notice">Strike Off Notice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Registered Address</p>
                  <div className="space-y-2">
                    <Label htmlFor="previous_address">Original Address</Label>
                    <Input id="previous_address" name="previous_address" placeholder="As originally registered" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_address">New / Current Address</Label>
                    <Input id="company_address" name="company_address" placeholder="Current registered address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_status">Address Status</Label>
                    <Select name="address_status" defaultValue="Default Address">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Default Address">Default Address</SelectItem>
                        <SelectItem value="Changed/Updated">Changed/Updated</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad01_filing_date">AD01 Filing Date</Label>
                  <Input id="ad01_filing_date" name="ad01_filing_date" type="date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previous_director_name">Previous / New Director Name</Label>
                  <Input id="previous_director_name" name="previous_director_name" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="auth_code">Auth Code</Label>
                    <Input id="auth_code" name="auth_code" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utr_number">UTR Number</Label>
                    <Input id="utr_number" name="utr_number" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ch_confirmation_statement_next_due">Confirmation Statement Due</Label>
                    <Input id="ch_confirmation_statement_next_due" name="ch_confirmation_statement_next_due" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ch_accounts_next_due">Annual Accounts Due</Label>
                    <Input id="ch_accounts_next_due" name="ch_accounts_next_due" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ch_expiry_date">CH Expiry Date</Label>
                    <Input id="ch_expiry_date" name="ch_expiry_date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ch_operation_date">CH Operation Date</Label>
                    <Input id="ch_operation_date" name="ch_operation_date" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ch_filing_rate">CH Filing Rate</Label>
                  <Input id="ch_filing_rate" name="ch_filing_rate" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sic_codes">SIC Codes (comma separated)</Label>
                  <Input id="sic_codes" name="sic_codes" placeholder="62020, 62090" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director_id">Director</Label>
                  <Select name="director_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select director" />
                    </SelectTrigger>
                    <SelectContent>
                      {directors
                        .filter((d) => d.is_owner)
                        .map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Input
                      placeholder="Or add a new director name..."
                      value={newDirectorName}
                      onChange={(e) => setNewDirectorName(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!newDirectorName.trim()}
                      onClick={() => {
                        const name = newDirectorName.trim();
                        if (!name) return;
                        createDirector(name);
                        setNewDirectorName("");
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Company
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>


      <SummaryCards companies={companies} />

      {/* Segment tabs — match rules used by Summary cards */}
      {(() => {
        const owned = companies.filter(isOwnedCompany);
        const segments = [
          { key: undefined as string | undefined, label: "All", count: companies.length },
          { key: "active", label: "Active", count: owned.filter((c) => c.status === "Active").length },
          { key: "pending-sale", label: "Available", count: owned.filter((c) => c.status === "Available Company").length },
          { key: "sold", label: "Sold", count: companies.filter((c) => c.status === "Sold/Transferred" || (c.director ? !c.director.is_owner : true)).length },
          { key: "strike-off", label: "Strike Off", count: owned.filter((c) => c.status === "Strike Off Notice").length },
          { key: "default-address", label: "Default Addr.", count: owned.filter((c) => c.address_status === "Default Address").length },
          { key: "ad01", label: "AD01 Pending", count: owned.filter((c) => c.status === "Active" && !c.ad01_filing_date && ((!c.auth_code || c.auth_code.trim() === "" || c.auth_code.trim().toLowerCase() === "pending") || c.address_status === "Default Address")).length },
          { key: "ad01-processing", label: "AD01 Processing", count: owned.filter((c) => c.status === "Active" && !!c.ad01_filing_date && !(Array.isArray(c.tags) && c.tags.includes("ad01-complete")) && ((!c.auth_code || c.auth_code.trim() === "" || c.auth_code.trim().toLowerCase() === "pending") || c.address_status === "Default Address")).length },
          { key: "ad01-filed", label: "AD01 Filed", count: owned.filter((c) => Array.isArray(c.tags) && c.tags.includes("ad01-complete")).length },
        ];
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

        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground">{filteredCompanies.length}</strong> of {companies.length} companies
          </span>
          {selectedDirector !== "all" && (
            <span className="text-primary">Filtered by director</span>
          )}
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
                onMarkSold={markAsSold}
                onMarkAd01={markAd01Filed}
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
              onMarkSold={markAsSold}
              onMarkAd01={markAd01Filed}
              onMarkAd01Complete={markAd01Complete}
              onUpdate={updateCompany}
              isAdmin={isAdmin}
            />
          </div>
        </div>




      <div className="bg-card rounded-xl border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Bulk Import</h2>
        <CSVImport onSuccess={refresh} />
      </div>
    </div>
  );
}
