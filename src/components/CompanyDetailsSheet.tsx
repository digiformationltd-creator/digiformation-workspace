import { Building2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Company } from "@/types";

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

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

interface Props {
  company: Company;
  /**
   * trigger style — "full" shows a full-width labelled button (mobile card),
   * "icon" shows a 24x24 ghost icon button (desktop table actions row).
   */
  triggerStyle?: "full" | "icon";
}

export function CompanyDetailsSheet({ company, triggerStyle = "icon" }: Props) {
  const triggerButton =
    triggerStyle === "full" ? (
      <Button variant="secondary" size="sm" className="w-full h-8 text-xs gap-1.5">
        <Eye className="h-3.5 w-3.5" />
        View More Details
      </Button>
    ) : (
      <Button variant="ghost" size="icon" className="h-6 w-6">
        <Eye className="h-3 w-3 text-primary" />
      </Button>
    );

  return (
    <Sheet>
      {triggerStyle === "icon" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>{triggerButton}</SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>View Full Details</TooltipContent>
        </Tooltip>
      ) : (
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      )}
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
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
            label="Old Director"
            value={company.previous_director_name ?? "—"}
          />
          <DetailRow
            label="Director Verified"
            value={company.director?.verification_status ?? "—"}
          />
          <DetailRow
            label="Company Created"
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
            label="Accounts Next Due"
            value={fmt(company.ch_accounts_next_due) || "—"}
          />
          <DetailRow
            label="Confirmation Statement Next Due"
            value={fmt(company.ch_confirmation_statement_next_due) || "—"}
          />
        </div>

      </SheetContent>
    </Sheet>
  );
}
