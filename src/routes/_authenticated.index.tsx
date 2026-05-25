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
    syncCompanyCH,
    verifyDirector,
    updateCompany,
    deleteCompany,
    createCompany,
    refresh,
    isSyncing,
  } = useCompanies();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirector, setSelectedDirector] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const { filter: quickFilter } = Route.useSearch();

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Apply sidebar quick filter
    if (quickFilter === "active") {
      filtered = filtered.filter((c) => c.status === "Active");
    } else if (quickFilter === "ad01") {
      filtered = filtered.filter((c) => !c.ad01_filing_date);
    } else if (quickFilter === "pending-sale") {
      filtered = filtered.filter((c) => c.status === "Pending Sale");
    } else if (quickFilter === "address") {
      filtered = filtered.filter(
        (c) => c.address_match_status === "Mismatched" || c.address_status === "Changed/Updated"
      );
    } else if (quickFilter === "strike-off") {
      filtered = filtered.filter(
        (c) => c.status === "Strike Off Pending" || c.status === "Struck Off"
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.company_name.toLowerCase().includes(term) ||
          c.company_number.toLowerCase().includes(term) ||
          (c.utr_number?.toLowerCase().includes(term) ?? false)
      );
    }

    if (selectedDirector !== "all") {
      filtered = filtered.filter((c) => c.director_id === selectedDirector);
    }

    if (activeStatus !== "all") {
      filtered = filtered.filter((c) => c.status === activeStatus);
    }

    return filtered;
  }, [companies, searchTerm, selectedDirector, activeStatus, quickFilter]);


  const handleAddCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    createMutation.mutate({
      data: {
        company: {
          company_name: formData.get("company_name") as string,
          company_number: formData.get("company_number") as string,
          incorporation_date: (formData.get("incorporation_date") as string) || null,
          company_address: (formData.get("company_address") as string) || null,
          sic_codes: (formData.get("sic_codes") as string)
            ? (formData.get("sic_codes") as string).split(",").map((s) => s.trim())
            : null,
          auth_code: (formData.get("auth_code") as string) || null,
          utr_number: (formData.get("utr_number") as string) || null,
          director_id: (formData.get("director_id") as string) || null,
          status: (formData.get("status") as Company["status"]) || "Active",
        },
      },
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all your UK limited companies
          </p>
        </div>
        <div className="flex items-center gap-2">
          {chKeyMissing && (
            <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 px-3 py-1.5 rounded-lg">
              <ShieldAlert className="h-3.5 w-3.5" />
              CH API key not configured
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-2 gap-3">
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
                        <SelectItem value="Pending Sale">Pending Sale</SelectItem>
                        <SelectItem value="Sold/Transferred">Sold/Transferred</SelectItem>
                        <SelectItem value="Strike Off Pending">Strike Off Pending</SelectItem>
                        <SelectItem value="Struck Off">Struck Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_address">Registered Address</Label>
                  <Input id="company_address" name="company_address" />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                      {directors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
                onSyncCH={syncCompanyCH}
                onDelete={deleteCompany}
                onVerifyDirector={verifyDirector}
                isSyncing={isSyncing}
              />
            ))
          )}
        </div>

        {/* Desktop: compact table */}
        <div className="hidden md:block">

            <CompaniesTable
              companies={filteredCompanies}
              onMarkSold={markAsSold}
              onMarkAd01={markAd01Filed}
              onSyncCH={syncCompanyCH}
              onDelete={deleteCompany}
              onVerifyDirector={verifyDirector}
              isSyncing={isSyncing}
            />
          </div>
        </div>


      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Bulk Import</h2>
        <CSVImport onSuccess={refresh} />
      </div>
    </div>
  );
}
