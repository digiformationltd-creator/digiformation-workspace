import { useState, useEffect } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Company, Director, CompanyStatus, LifecycleStatus, AvailabilityStatus, AuthCodeStatus, Ad01Status, AddressStatus } from "@/types";

interface Props {
  company: Company;
  directors: Director[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void | Promise<void>;
  triggerStyle?: "icon" | "compact";
}

export function EditCompanyDialog({ company, directors, onUpdate, triggerStyle = "icon" }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: company.company_name ?? "",
    company_number: company.company_number ?? "",
    previous_name: company.previous_name ?? "",
    previous_address: company.previous_address ?? "",
    incorporation_date: company.incorporation_date ?? "",
    company_address: company.company_address ?? "",
    auth_code: company.auth_code ?? "",
    utr_number: company.utr_number ?? "",
    sic_codes: (company.sic_codes ?? []).join(", "),
    director_id: company.director_id ?? "none",
    status: company.status as CompanyStatus,
    address_status: (company.address_status ?? "Default Address") as AddressStatus,
    lifecycle_status: (company.lifecycle_status ?? "active") as LifecycleStatus,
    availability_status: (company.availability_status ?? "available") as AvailabilityStatus,
    strike_off_status: company.strike_off_status ?? false,
    auth_code_status: (company.auth_code_status ?? "missing") as AuthCodeStatus,
    ad01_status: (company.ad01_status ?? "pending") as Ad01Status,
    ad01_filing_date: company.ad01_filing_date ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        company_name: company.company_name ?? "",
        company_number: company.company_number ?? "",
        previous_name: company.previous_name ?? "",
        previous_address: company.previous_address ?? "",
        incorporation_date: company.incorporation_date ?? "",
        company_address: company.company_address ?? "",
        auth_code: company.auth_code ?? "",
        utr_number: company.utr_number ?? "",
        sic_codes: (company.sic_codes ?? []).join(", "),
        director_id: company.director_id ?? "none",
        status: company.status as CompanyStatus,
        address_status: (company.address_status ?? "Default Address") as AddressStatus,
        lifecycle_status: (company.lifecycle_status ?? "active") as LifecycleStatus,
        availability_status: (company.availability_status ?? "available") as AvailabilityStatus,
        strike_off_status: company.strike_off_status ?? false,
        auth_code_status: (company.auth_code_status ?? "missing") as AuthCodeStatus,
        ad01_status: (company.ad01_status ?? "pending") as Ad01Status,
        ad01_filing_date: company.ad01_filing_date ?? "",
      });
    }
  }, [open, company]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Keep legacy `status` in sync with explicit fields
      const legacyStatus: CompanyStatus =
        form.lifecycle_status === "dissolved"
          ? "Dissolved"
          : form.strike_off_status
          ? "Strike Off Notice"
          : form.availability_status === "sold"
          ? "Sold/Transferred"
          : form.availability_status === "available"
          ? "Available Company"
          : "Active";

      await onUpdate(company.id, {
        company_name: form.company_name,
        company_number: form.company_number.toUpperCase(),
        previous_name: form.previous_name || null,
        previous_address: form.previous_address || null,
        incorporation_date: form.incorporation_date || null,
        company_address: form.company_address || null,
        auth_code: form.auth_code || null,
        utr_number: form.utr_number || null,
        sic_codes: form.sic_codes
          ? form.sic_codes.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        director_id: form.director_id === "none" ? null : form.director_id,
        status: legacyStatus,
        address_status: form.address_status,
        lifecycle_status: form.lifecycle_status,
        availability_status: form.availability_status,
        strike_off_status: form.strike_off_status,
        auth_code_status: form.auth_code_status,
        ad01_status: form.ad01_status,
        ad01_filing_date: form.ad01_filing_date || null,
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            {triggerStyle === "compact" ? (
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1">
                <Pencil className="h-3 w-3 text-warning" />
                Edit
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-accent-foreground hover:bg-accent">
                <Pencil className="h-3.5 w-3.5 text-warning" />
              </Button>
            )}
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Edit Company</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Company Name (our records / old name)</Label>
            <Input
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Name (if renamed on Companies House)</Label>
            <Input
              value={form.previous_name}
              onChange={(e) => set("previous_name", e.target.value)}
              placeholder="Leave empty if not renamed"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Company Number</Label>
              <Input
                value={form.company_number}
                onChange={(e) => set("company_number", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Incorporation Date</Label>
              <Input
                type="date"
                value={form.incorporation_date}
                onChange={(e) => set("incorporation_date", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Registered Address</Label>
            <Input
              value={form.company_address}
              onChange={(e) => set("company_address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Auth Code</Label>
              <Input
                value={form.auth_code}
                onChange={(e) => set("auth_code", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>UTR Number</Label>
              <Input
                value={form.utr_number}
                onChange={(e) => set("utr_number", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>SIC Codes (comma separated)</Label>
            <Input
              value={form.sic_codes}
              onChange={(e) => set("sic_codes", e.target.value)}
              placeholder="62020, 62090"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as CompanyStatus)}
              >
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
            <div className="space-y-1.5">
              <Label>AD01 Filing Date</Label>
              <Input
                type="date"
                value={form.ad01_filing_date}
                onChange={(e) => set("ad01_filing_date", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Director</Label>
            <Select
              value={form.director_id}
              onValueChange={(v) => set("director_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select director" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {directors
                  .filter((d) => d.is_owner)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
