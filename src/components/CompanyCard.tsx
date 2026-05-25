import {
  FileText,
  Truck,
  MapPin,
  RefreshCw,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Company } from "@/types";

interface Props {
  company: Company;
  onMarkSold: (id: string) => void;
  onMarkAd01: (id: string) => void;
  onDelete: (id: string) => void;
  onVerifyDirector?: (directorId: string) => void;
}

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

function StatusRow({
  icon: Icon,
  label,
  done,
  doneLabel,
  pendingLabel,
  actionLabel,
  onAction,
  disabled,
  meta,
}: {
  icon: typeof FileText;
  label: string;
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">{label}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {done ? (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px] bg-success/10 text-success border-success/20 gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {doneLabel}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px] bg-warning/10 text-warning border-warning/20 gap-1"
              >
                <Clock className="h-3 w-3" />
                {pendingLabel}
              </Badge>
            )}
            {meta && (
              <span className="text-[10px] text-muted-foreground">{meta}</span>
            )}
          </div>
        </div>
      </div>
      {!done && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs shrink-0"
          onClick={onAction}
          disabled={disabled}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function CompanyCard({
  company,
  onMarkSold,
  onMarkAd01,
  onDelete,
}: Props) {
  const ad01Done = !!company.ad01_filing_date;
  const addressChanged = company.address_status === "Changed/Updated";
  const sold = company.status === "Sold/Transferred";

  const allDone = ad01Done && addressChanged && sold;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <h3 className="font-semibold text-sm truncate">
              {company.company_name}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-6">
            <span className="text-xs font-mono text-muted-foreground">
              #{company.company_number}
            </span>
            {company.director?.name && (
              <span className="text-xs text-muted-foreground truncate">
                · {company.director.name}
              </span>
            )}
          </div>
        </div>
        {allDone && (
          <Badge className="bg-success/15 text-success border-success/30 gap-1 shrink-0">
            <CheckCircle2 className="h-3 w-3" /> All Done
          </Badge>
        )}
      </div>

      {/* Status rows */}
      <div className="grid gap-2">
        <StatusRow
          icon={FileText}
          label="AD01 Filing"
          done={ad01Done}
          doneLabel="Filed"
          pendingLabel="Pending"
          actionLabel="Mark Filed"
          onAction={() => onMarkAd01(company.id)}
          meta={ad01Done ? fmt(company.ad01_filing_date) : undefined}
        />
        <StatusRow
          icon={MapPin}
          label="Address Change"
          done={addressChanged}
          doneLabel="Changed"
          pendingLabel="Default"
          actionLabel="Mark Changed"
          onAction={() => onMarkAd01(company.id)}
        />
        <StatusRow
          icon={Truck}
          label="Sale / Transfer"
          done={sold}
          doneLabel="Sold"
          pendingLabel={company.status}
          actionLabel="Mark Sold"
          onAction={() => onMarkSold(company.id)}
        />

      </div>

      {/* View More */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" size="sm" className="w-full h-8 text-xs gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            View More Details
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              {company.company_name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-3 text-sm">
            <DetailRow label="Company Number" value={company.company_number} mono />
            <DetailRow label="Status" value={company.status} />
            <DetailRow label="Director" value={company.director?.name ?? "—"} />
            <DetailRow
              label="Director Verified"
              value={company.director?.verification_status ?? "—"}
            />
            <DetailRow
              label="Incorporation Date"
              value={fmt(company.incorporation_date) || "—"}
            />
            <DetailRow
              label="Registered Address"
              value={company.company_address ?? "—"}
              multiline
            />
            <DetailRow label="Auth Code" value={company.auth_code ?? "—"} mono />
            <DetailRow label="UTR Number" value={company.utr_number ?? "—"} mono />
            <DetailRow
              label="SIC Codes"
              value={company.sic_codes?.join(", ") || "—"}
              mono
            />
            <DetailRow
              label="AD01 Filing Date"
              value={fmt(company.ad01_filing_date) || "Pending"}
            />
            <DetailRow label="Address Status" value={company.address_status} />
            <DetailRow
              label="Address Match"
              value={company.address_match_status ?? "Unknown"}
            />
            <DetailRow
              label="CH Status"
              value={company.ch_company_status ?? "Not synced"}
            />
            <DetailRow
              label="CH Address"
              value={company.ch_address ?? "—"}
              multiline
            />
            <DetailRow
              label="Last CH Sync"
              value={company.last_ch_sync ? fmt(company.last_ch_sync.split("T")[0]) : "Never"}
            />
            <DetailRow
              label="Tags"
              value={company.tags?.join(", ") || "—"}
            />
            <DetailRow
              label="Created"
              value={fmt(company.created_at.split("T")[0])}
            />
            <DetailRow
              label="Last Updated"
              value={fmt(company.updated_at.split("T")[0])}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() =>
            window.open(
              `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
              "_blank"
            )
          }
        >
          <ExternalLink className="h-3 w-3" />
          Companies House
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive gap-1"
          onClick={() => {
            if (confirm(`Delete ${company.company_name}?`)) onDelete(company.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b pb-2 last:border-0">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm ${mono ? "font-mono" : ""} ${
          multiline ? "whitespace-pre-wrap break-words" : "break-words"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
