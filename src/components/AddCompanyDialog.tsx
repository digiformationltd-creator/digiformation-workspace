import { useState } from "react";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type {
  Director,
  LifecycleStatus,
  AvailabilityStatus,
  AuthCodeStatus,
  Ad01Status,
  AddressStatus,
  Company,
} from "@/types";
import { RULES, buildCompanyWritePayload, categoryLabel } from "@/lib/companyRules";

interface Props {
  directors: Director[];
  createCompany: (payload: Record<string, unknown>) => Promise<unknown> | void;
  createDirector: (name: string) => void;
}

const DEFAULTS = {
  company_name: "",
  company_number: "",
  previous_name: "",
  previous_address: "",
  previous_director_name: "",
  incorporation_date: "",
  company_address: "",
  auth_code: "",
  utr_number: "",
  sic_codes: "",
  director_id: "none",
  lifecycle_status: "active" as LifecycleStatus,
  availability_status: "available" as AvailabilityStatus,
  auth_code_status: "missing" as AuthCodeStatus,
  address_status: "Changed/Updated" as AddressStatus,
  strike_off_status: false,
  ad01_required: false,
  ad01_status: "pending" as Ad01Status,
  ad01_filing_date: "",
  ch_accounts_next_due: "",
  ch_confirmation_statement_next_due: "",
};

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

export function AddCompanyDialog({ directors, createCompany, createDirector }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDirectorName, setNewDirectorName] = useState("");
  const [form, setForm] = useState(DEFAULTS);

  const set = <K extends keyof typeof DEFAULTS>(k: K, v: (typeof DEFAULTS)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // ---- Live derived preview (client fallback — DB trigger owns final value) ----
  const preview: Company = {
    id: "",
    company_name: form.company_name,
    company_number: form.company_number,
    previous_name: null,
    previous_address: null,
    previous_director_name: null,
    incorporation_date: null,
    company_address: null,
    sic_codes: null,
    auth_code: form.auth_code || null,
    utr_number: null,
    status: "Active",
    address_status: form.address_status,
    lifecycle_status: form.lifecycle_status,
    availability_status: form.availability_status,
    strike_off_status: form.strike_off_status,
    auth_code_status: form.auth_code_status,
    ad01_status: form.ad01_required ? form.ad01_status : "not_required",
    ad01_filing_date: null,
    director_id: null,
    tags: null,
    last_ch_sync: null,
    ch_company_status: null,
    ch_company_profile: null,
    ch_address: null,
    address_match_status: null,
    primary_category: null,
    ready_to_sell: false,
    ch_expiry_date: null,
    ch_operation_date: null,
    ch_filing_rate: null,
    ch_accounts_next_due: null,
    ch_confirmation_statement_next_due: null,
    created_at: "",
    updated_at: "",
  };
  const derivedCategory = RULES.derivePrimaryCategoryFromRaw(preview);
  const isReadyToSell = RULES.isReadyToSell(preview);
  const friendlyCategory = categoryLabel(derivedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Shared serializer — used by Edit Company too. No inline logic here.
      const payload = buildCompanyWritePayload(form);
      await createCompany(payload);
      setForm(DEFAULTS);
      setOpen(false);
    } catch {
      // toast handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        {/* Live auto-derived preview — purely informational */}
        <div className="rounded-lg border bg-muted/40 p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs space-y-0.5">
            <p>
              <span className="text-muted-foreground">This company will appear in:</span>{" "}
              <span className="font-semibold">{friendlyCategory}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Legacy status:</span>{" "}
              <span className="font-semibold">{derivedLegacyStatus}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Ready to Sell:</span>{" "}
              <span className={isReadyToSell ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                {isReadyToSell ? "Yes" : "No"}
              </span>
              <span className="text-muted-foreground/70"> · calculated automatically</span>
            </p>
          </div>
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
                placeholder="Current trading name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company Number</Label>
                <Input
                  value={form.company_number}
                  onChange={(e) => set("company_number", e.target.value)}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Confirmation Statement Due</Label>
                <Input
                  type="date"
                  value={form.ch_confirmation_statement_next_due}
                  onChange={(e) => set("ch_confirmation_statement_next_due", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Annual Accounts Due</Label>
                <Input
                  type="date"
                  value={form.ch_accounts_next_due}
                  onChange={(e) => set("ch_accounts_next_due", e.target.value)}
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
          <Section title="4 · Auth Status" hint="A company with no auth code is treated as Auth Missing.">
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
              <Label>Old Address</Label>
              <Input
                value={form.previous_address}
                onChange={(e) => set("previous_address", e.target.value)}
                placeholder="Leave empty if never changed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Current Address</Label>
              <Input
                value={form.company_address}
                onChange={(e) => set("company_address", e.target.value)}
                placeholder="Current registered address"
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
          <Section title="6 · Strike Off" hint="Independent flag — never auto-cleared by other actions.">
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
          <Section title="7 · AD01" hint='"Not Required" never counts as Complete on the dashboard.'>
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

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Company
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
