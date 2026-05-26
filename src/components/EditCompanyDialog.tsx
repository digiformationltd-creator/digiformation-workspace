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
  const [markReadyToSell, setMarkReadyToSell] = useState(false);

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
      setMarkReadyToSell(false);

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
      // Ready to Sell override — sets every field to clean/sale-ready values
      const effLifecycle: LifecycleStatus = markReadyToSell ? "active" : form.lifecycle_status;
      const effAvailability: AvailabilityStatus = markReadyToSell ? "available" : form.availability_status;
      const effAuthStatus: AuthCodeStatus = markReadyToSell ? "available" : form.auth_code_status;
      const effAddressStatus: AddressStatus = markReadyToSell
        ? "Changed/Updated"
        : form.address_status;
      const effAd01Status: Ad01Status = markReadyToSell ? "completed" : form.ad01_status;

      // Auto-clear strike-off when AD01 is completed and address is no longer default
      const autoClearStrikeOff =
        effAd01Status === "completed" && effAddressStatus !== "Default Address";
      const effectiveStrikeOff = markReadyToSell
        ? false
        : autoClearStrikeOff
        ? false
        : form.strike_off_status;

      // Keep legacy `status` in sync with explicit fields
      const legacyStatus: CompanyStatus =
        effLifecycle === "dissolved"
          ? "Dissolved"
          : effectiveStrikeOff
          ? "Strike Off Notice"
          : effAvailability === "sold"
          ? "Sold/Transferred"
          : effAvailability === "available"
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
        address_status: effAddressStatus,
        lifecycle_status: effLifecycle,
        availability_status: effAvailability,
        strike_off_status: effectiveStrikeOff,
        auth_code_status: effAuthStatus,
        ad01_status: effAd01Status,
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
          <label className="flex items-start gap-3 rounded-lg border-2 border-emerald-500/40 bg-emerald-500/5 p-3 cursor-pointer hover:bg-emerald-500/10 transition">
            <input
              type="checkbox"
              checked={markReadyToSell}
              onChange={(e) => setMarkReadyToSell(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-500"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                💎 Mark as Ready to Sell
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overrides all status fields: Active · Available · No Strike Off · Auth Available · Address Updated · AD01 Completed
              </p>
            </div>
          </label>

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
              <Label>Company Status</Label>
              <Select value={form.lifecycle_status} onValueChange={(v) => set("lifecycle_status", v as LifecycleStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="dissolved">Dissolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Availability</Label>
              <Select value={form.availability_status} onValueChange={(v) => set("availability_status", v as AvailabilityStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Strike Off Status</Label>
              <Select value={form.strike_off_status ? "yes" : "no"} onValueChange={(v) => set("strike_off_status", v === "yes")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No Strike Off</SelectItem>
                  <SelectItem value="yes">Strike Off Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Auth Code Status</Label>
              <Select value={form.auth_code_status} onValueChange={(v) => set("auth_code_status", v as AuthCodeStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Address Status</Label>
              <Select value={form.address_status} onValueChange={(v) => set("address_status", v as AddressStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default Address">Default</SelectItem>
                  <SelectItem value="Changed/Updated">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>AD01 Status</Label>
              <Select value={form.ad01_status} onValueChange={(v) => set("ad01_status", v as Ad01Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
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
