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
import type { Company, Director, CompanyStatus } from "@/types";

interface Props {
  company: Company;
  directors: Director[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void | Promise<void>;
}

export function EditCompanyDialog({ company, directors, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: company.company_name ?? "",
    company_number: company.company_number ?? "",
    incorporation_date: company.incorporation_date ?? "",
    company_address: company.company_address ?? "",
    auth_code: company.auth_code ?? "",
    utr_number: company.utr_number ?? "",
    sic_codes: (company.sic_codes ?? []).join(", "),
    director_id: company.director_id ?? "none",
    status: company.status as CompanyStatus,
    ad01_filing_date: company.ad01_filing_date ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        company_name: company.company_name ?? "",
        company_number: company.company_number ?? "",
        incorporation_date: company.incorporation_date ?? "",
        company_address: company.company_address ?? "",
        auth_code: company.auth_code ?? "",
        utr_number: company.utr_number ?? "",
        sic_codes: (company.sic_codes ?? []).join(", "),
        director_id: company.director_id ?? "none",
        status: company.status as CompanyStatus,
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
      await onUpdate(company.id, {
        company_name: form.company_name,
        company_number: form.company_number.toUpperCase(),
        incorporation_date: form.incorporation_date || null,
        company_address: form.company_address || null,
        auth_code: form.auth_code || null,
        utr_number: form.utr_number || null,
        sic_codes: form.sic_codes
          ? form.sic_codes.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        director_id: form.director_id === "none" ? null : form.director_id,
        status: form.status,
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-accent-foreground hover:bg-accent"
            >
              <Pencil className="h-3 w-3 text-warning" />
            </Button>
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
            <Label>Company Name</Label>
            <Input
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              required
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
                {directors.map((d) => (
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
