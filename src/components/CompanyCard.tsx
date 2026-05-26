import {
  FileText,
  Truck,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CompanyDetailsSheet } from "@/components/CompanyDetailsSheet";
import type { Company } from "@/types";

interface Props {
  company: Company;
  onMarkSold: (id: string) => void;
  onMarkAd01: (id: string) => void;
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
}: Props) {
  const ad01Done = !!company.ad01_filing_date;
  const addressChanged = company.address_status === "Changed/Updated";
  const sold = company.status === "Sold/Transferred";

  const allDone = ad01Done && addressChanged && sold;

  // For sold/transferred companies, `previous_director_name` holds the NEW current director
  // (the buyer's director). `director.name` is our original (now-resigned) director.
  const displayedDirector = company.previous_director_name || company.director?.name;
  const ourDirector = company.director?.name;
  const directorChanged =
    !!company.previous_director_name && ourDirector && ourDirector !== company.previous_director_name;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border bg-card p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3
                    className={`font-semibold text-sm truncate ${
                      company.previous_name ? "underline decoration-dotted underline-offset-2 cursor-help" : ""
                    }`}
                  >
                    {company.company_name}
                  </h3>
                </TooltipTrigger>
                {company.previous_name && (
                  <TooltipContent className="text-xs max-w-[280px]">
                    <div>
                      <strong>Now registered as:</strong> {company.previous_name}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 mt-1 ml-6">
              <span className="text-xs font-mono text-muted-foreground">
                #{company.company_number}
              </span>
              {originalDirector && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`text-xs text-muted-foreground truncate ${
                        directorChanged ? "underline decoration-dotted underline-offset-2 cursor-help" : ""
                      }`}
                    >
                      · {originalDirector}
                    </span>
                  </TooltipTrigger>
                  {directorChanged && (
                    <TooltipContent className="text-xs max-w-[280px]">
                      <div>
                        <strong>Current director:</strong> {currentDirector}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
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
        <CompanyDetailsSheet company={company} triggerStyle="full" />

        {/* Footer actions */}
        <div className="flex items-center justify-center pt-2 border-t">
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
        </div>
      </div>
    </TooltipProvider>
  );
}
