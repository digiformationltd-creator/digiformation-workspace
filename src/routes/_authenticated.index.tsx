import { createFileRoute } from "@tanstack/react-router";
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
    verifyDirector,
    updateCompany,
    deleteCompany,
    createCompany,
    createDirector,
    refresh,
  } = useCompanies();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirector, setSelectedDirector] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [addressFilter, setAddressFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDirectorName, setNewDirectorName] = useState("");


  const { filter: quickFilter } = Route.useSearch();

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
      filtered = filtered.filter((c) => !c.ad01_filing_date);
    } else if (quickFilter === "pending-sale") {
      filtered = filtered.filter((c) => c.status === "Available Company");
    } else if (quickFilter === "sold") {
      filtered = filtered.filter((c) => c.status === "Sold/Transferred" || (c.director ? !c.director.is_owner : true));
    } else if (quickFilter === "default-address") {
      filtered = filtered.filter((c) => c.address_status === "Default Address");
    } else if (quickFilter === "ad01-filed") {
      filtered = filtered.filter((c) => !!c.ad01_filing_date);
    } else if (quickFilter === "strike-off") {
      filtered = filtered.filter((c) => c.status === "Strike Off Notice");
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
      filtered = filtered.filter((c) => !!c.auth_code && c.auth_code.trim() !== "");
    } else if (authFilter === "missing") {
      filtered = filtered.filter((c) => !c.auth_code || c.auth_code.trim() === "");
    }

    return filtered;
  }, [companies, searchTerm, selectedDirector, activeStatus, addressFilter, authFilter, quickFilter, directorMap]);


  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    try {
      await createCompany({
        company_name: formData.get("company_name") as string,
        company_number: (formData.get("company_number") as string).toUpperCase(),
        incorporation_date: (formData.get("incorporation_date") as string) || null,
        company_address: (formData.get("company_address") as string) || null,
        sic_codes: (formData.get("sic_codes") as string)
          ? (formData.get("sic_codes") as string).split(",").map((s) => s.trim())
          : null,
        auth_code: (formData.get("auth_code") as string) || null,
        utr_number: (formData.get("utr_number") as string) || null,
        director_id: (formData.get("director_id") as string) || null,
        status: (formData.get("status") as Company["status"]) || "Active",
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
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input id="company_name" name="company_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_number">Company Number *</Label>
                  <Input id="company_number" name="company_number" required />
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
                <div className="space-y-2">
                  <Label htmlFor="company_address">Registered Address</Label>
                  <Input id="company_address" name="company_address" />
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
        </div>
      </div>


      <SummaryCards companies={companies} />

      <div className="space-y-3 min-w-0">
        <div className="bg-card rounded-lg border p-3">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedDirector={selectedDirector}
            onDirectorChange={setSelectedDirector}
            directors={directors}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            addressFilter={addressFilter}
            onAddressFilterChange={setAddressFilter}
            authFilter={authFilter}
            onAuthFilterChange={setAuthFilter}
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
              onUpdate={updateCompany}
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
