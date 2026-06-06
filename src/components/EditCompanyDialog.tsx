import { useState, useEffect } from "react";
import { Loader2, Pencil, Sparkles } from "lucide-react";
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
import type {
  Company,
  Director,
  LifecycleStatus,
  AvailabilityStatus,
  AuthCodeStatus,
  Ad01Status,
  AddressStatus,
} from "@/types";
import { RULES } from "@/lib/companyRules";

interface Props {
  company: Company;
  directors: Director[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void | Promise<void>;
  triggerStyle?: "icon" | "compact";
}

/** Visual wrapper for a labelled form section. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {hint && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function EditCompanyDialog({
  company,
  directors,
  onUpdate,
  triggerStyle = "icon",
}: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initial = () => ({
    company_name: company.company_name ?? "",
    company_number: company.company_number ?? "",
    previous_name: company.previous_name ?? "",
    previous_address: company.previous_address ?? "",
    previous_director_name: company.previous_director_name ?? "",
    incorporation_date: company.incorporation_date ?? "",
    company_address: company.company_address ?? "",
    auth_code: company.auth_code ?? "",
    utr_number: company.utr_number ?? "",
    sic_codes: (company.sic_codes ?? []).join(", "),
    director_id: company.director_id ?? "none",
    address_status: (company.address_status ?? "Default Address") as AddressStatus,
    lifecycle_status: (company.lifecycle_status ?? "active") as LifecycleStatus,
    availability_status: (company.availability_status ?? "available") as AvailabilityStatus,
    strike_off_status: company.strike_off_status ?? false,
    auth_code_status: (company.auth_code_status ?? "missing") as AuthCodeStatus,
    ad01_required: (company.ad01_status ?? "pending") !== "not_required",
    ad01_status: (company.ad01_status ?? "pending") as Ad01Status,
    ad01_filing_date: company.ad01_filing_date ?? "",
  });

  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (open) setForm(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company]);

  const set = <K extends keyof ReturnType<typeof initial>>(
    k: K,
    v: ReturnType<typeof initial>[K],
  ) => setForm((p) => ({ ...p, [k]: v }));

  // ---------- Live derived preview (DB-first; client logic is fallback only) ----------
  const previewCompany: Company = {
    ...company,
    auth_code: form.auth_code || null,
    address_status: form.address_status,
    lifecycle_status: form.lifecycle_status,
    availability_status: form.availability_status,
    strike_off_status: form.strike_off_status,
    auth_code_status: form.auth_code_status,
    ad01_status: form.ad01_required ? form.ad01_status : "not_required",
    // Wipe DB-derived fields so the preview reflects the FORM, not stale row state.
    primary_category: null,
    ready_to_sell: false,
  };
  const derivedCategory = RULES.derivePrimaryCategoryFromRaw(previewCompany);
  const isReadyToSell = RULES.isReadyToSell(previewCompany);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Save only RAW FACTS. The DB trigger derives status, primary_category,
      // ready_to_sell and address_match_status.
      const effectiveAd01: Ad01Status = form.ad01_required ? form.ad01_status : "not_required";

      await onUpdate(company.id, {
        company_name: form.company_name,
        company_number: form.company_number.toUpperCase(),
        previous_name: form.previous_name || null,
        previous_address: form.previous_address || null,
        previous_director_name: form.previous_director_name || null,
        incorporation_date: form.incorporation_date || null,
        company_address: form.company_address || null,
        auth_code: form.auth_code || null,
        utr_number: form.utr_number || null,
        sic_codes: form.sic_codes
          ? form.sic_codes.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        director_id: form.director_id === "none" ? null : form.director_id,
        address_status: form.address_status,
        lifecycle_status: form.lifecycle_status,
        availability_status: form.availability_status,
        strike_off_status: form.strike_off_status,
        auth_code_status: form.auth_code_status,
        ad01_status: effectiveAd01,
        ad01_filing_date: form.ad01_filing_date || null,
        // status, primary_category, ready_to_sell, address_match_status, updated_at
        // are all owned by the DB trigger — never write them here.
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
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:text-accent-foreground hover:bg-accent"
              >
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

        {/* System-derived (read-only) — owned by the database trigger */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              System Auto-Derived · Read-Only
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Section (preview)</span>
              <p className="font-semibold">{derivedCategory.replaceAll("_", " ")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Ready to Sell (preview)</span>
              <p className={isReadyToSell ? "text-emerald-500 font-semibold" : "font-semibold text-muted-foreground"}>
                {isReadyToSell ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Current Status</span>
              <p className="font-semibold">{company.status ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Address Match</span>
              <p className="font-semibold">{company.address_match_status ?? "Unknown"}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            You only edit raw facts. The database recomputes category, status, ready-to-sell and address match on save.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 1. Basic Info */}
          <Section title="1 · Basic Info">
            <div className="space-y-1.5">
              <Label>Old Company Name</Label>
              <Input
                value={form.previous_name}
                onChange={(e) => set("previous_name", e.target.value)}
                placeholder="Leave empty if never renamed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Current Company Name</Label>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>UTR Number</Label>
                <Input
                  value={form.utr_number}
                  onChange={(e) => set("utr_number", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>SIC Codes (comma separated)</Label>
                <Input
                  value={form.sic_codes}
                  onChange={(e) => set("sic_codes", e.target.value)}
                  placeholder="62020, 62090"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Old Director</Label>
              <Input
                value={form.previous_director_name}
                onChange={(e) => set("previous_director_name", e.target.value)}
                placeholder="Leave empty if never changed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Current Director</Label>
              <Select value={form.director_id} onValueChange={(v) => set("director_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select current director" />
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
          </Section>

          {/* 2. Company Health */}
          <Section title="2 · Company Health" hint="Lifecycle from Companies House.">
            <div className="space-y-1.5">
              <Label>Lifecycle</Label>
              <Select
                value={form.lifecycle_status}
                onValueChange={(v) => set("lifecycle_status", v as LifecycleStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="dissolved">Dissolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* 3. Sale Status */}
          <Section title="3 · Sale Status" hint="Sold companies leave operational tracking.">
            <div className="space-y-1.5">
              <Label>Availability</Label>
              <Select
                value={form.availability_status}
                onValueChange={(v) => set("availability_status", v as AvailabilityStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* 4. Auth Status */}
          <Section
            title="4 · Auth Status"
            hint="A company with no auth code is treated as Auth Missing."
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Auth Code</Label>
                <Input
                  value={form.auth_code}
                  onChange={(e) => set("auth_code", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Auth Code Status</Label>
                <Select
                  value={form.auth_code_status}
                  onValueChange={(v) => set("auth_code_status", v as AuthCodeStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* 5. Address Status */}
          <Section title="5 · Address Status">
            <div className="space-y-1.5">
              <Label>Current Address</Label>
              <Input
                value={form.company_address}
                onChange={(e) => {
                  const next = e.target.value;
                  const originalCurrent = company.company_address ?? "";
                  const originalPrevious = company.previous_address ?? "";
                  setForm((p) => {
                    // Auto-rotate: when the current address is being changed away
                    // from the saved value, push the saved current into "Previous
                    // Address" — but only if the user hasn't manually edited the
                    // previous field yet (still matches the original DB value).
                    const shouldRotate =
                      next.trim() !== originalCurrent.trim() &&
                      originalCurrent.trim() !== "" &&
                      p.previous_address === originalPrevious;
                    return {
                      ...p,
                      company_address: next,
                      previous_address: shouldRotate ? originalCurrent : p.previous_address,
                      address_status: shouldRotate ? "Changed/Updated" : p.address_status,
                    };
                  });
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                Changing this auto-moves the previous value into “Previous Address”.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Previous Address</Label>
              <Input
                value={form.previous_address}
                onChange={(e) => set("previous_address", e.target.value)}
                placeholder="Leave empty if never changed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address Status</Label>
              <Select
                value={form.address_status}
                onValueChange={(v) => set("address_status", v as AddressStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default Address">Default</SelectItem>
                  <SelectItem value="Changed/Updated">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* 6. Strike Off */}
          <Section
            title="6 · Strike Off"
            hint="Independent flag — never auto-cleared by other actions."
          >
            <div className="space-y-1.5">
              <Label>Strike Off Notice</Label>
              <Select
                value={form.strike_off_status ? "yes" : "no"}
                onValueChange={(v) => set("strike_off_status", v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes — Strike Off Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* 7. AD01 */}
          <Section
            title="7 · AD01"
            hint='"Not Required" never counts as Complete on the dashboard.'
          >
            <div className="space-y-1.5">
              <Label>AD01 Required?</Label>
              <Select
                value={form.ad01_required ? "yes" : "no"}
                onValueChange={(v) => set("ad01_required", v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No — Not Required</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.ad01_required && (
              <>
                <div className="space-y-1.5">
                  <Label>AD01 Status</Label>
                  <Select
                    value={form.ad01_status === "not_required" ? "pending" : form.ad01_status}
                    onValueChange={(v) => set("ad01_status", v as Ad01Status)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
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
              </>
            )}
          </Section>

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
