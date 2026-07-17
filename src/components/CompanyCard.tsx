import { CheckCircle2, Clock, Building2, Trash2, FileText, Truck, MapPin, KeyRound, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CompanyDetailsSheet } from "@/components/CompanyDetailsSheet";
import { CompaniesHouseLogo } from "@/components/CompaniesHouseLogo";
import { EditCompanyDialog } from "@/components/EditCompanyDialog";
import type { Company, Director } from "@/types";

interface Props {
  company: Company;
  directors: Director[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

function StatusPill({
  icon: Icon,
  label,
  value,
  good,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-card/50 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <Badge
        variant="outline"
        className={`h-5 px-1.5 text-[10px] gap-1 ${
          good
            ? "bg-success/10 text-success border-success/20"
            : "bg-warning/10 text-warning border-warning/20"
        }`}
      >
        {good ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {value}
      </Badge>
    </div>
  );
}

export function CompanyCard({ company, directors, onUpdate, onDelete, isAdmin = true }: Props) {
  const sold = company.availability_status === "sold";
  const dissolved = company.lifecycle_status === "dissolved";
  const ad01 = company.ad01_status ?? "pending";

  const displayedDirector = company.previous_director_name || company.director?.name;
  const ourDirector = company.director?.name;
  const directorChanged =
    !!company.previous_director_name && ourDirector && ourDirector !== company.previous_director_name;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border bg-card p-4 space-y-3 card-glow">
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
                    <div><strong>Old name:</strong> {company.previous_name}</div>
                    <div className="mt-1"><strong>Current name:</strong> {company.company_name}</div>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 mt-1 ml-6">
              <span className="text-xs font-mono text-muted-foreground">#{company.company_number}</span>
              {displayedDirector && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`text-xs text-muted-foreground truncate ${
                        directorChanged ? "underline decoration-dotted underline-offset-2 cursor-help" : ""
                      }`}
                    >
                      · {displayedDirector}
                    </span>
                  </TooltipTrigger>
                  {directorChanged && (
                    <TooltipContent className="text-xs max-w-[280px]">
                      <div><strong>Previously:</strong> {ourDirector}</div>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </div>
          {dissolved ? (
            <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1 shrink-0">
              <AlertTriangle className="h-3 w-3" /> Dissolved
            </Badge>
          ) : sold ? (
            <Badge className="bg-info/15 text-info border-info/30 gap-1 shrink-0">
              <Truck className="h-3 w-3" /> Sold
            </Badge>
          ) : (
            <Badge className="bg-success/15 text-success border-success/30 gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3" /> Active
            </Badge>
          )}
        </div>

        {/* Read-only status overview */}
        <div className="grid gap-2">
          <StatusPill
            icon={Truck}
            label="Availability"
            value={sold ? "Sold Out" : "Available"}
            good={!sold}
          />
          <StatusPill
            icon={KeyRound}
            label="Auth Code"
            value={company.auth_code_status === "available" ? "Available" : "Missing"}
            good={company.auth_code_status === "available"}
          />
          <StatusPill
            icon={MapPin}
            label="Address"
            value={company.address_status === "Default Address" ? "Default" : "Normal"}
            good={company.address_status !== "Default Address"}
          />
          <StatusPill
            icon={FileText}
            label={`AD01${company.ad01_filing_date ? ` · ${fmt(company.ad01_filing_date)}` : ""}`}
            value={ad01 === "completed" ? "Completed" : ad01 === "processing" ? "Processing" : "Pending"}
            good={ad01 === "completed"}
          />
          {company.strike_off_status && (
            <StatusPill icon={AlertTriangle} label="Strike Off" value="Notice" good={false} />
          )}
        </div>

        {/* View More */}
        <CompanyDetailsSheet company={company} triggerStyle="full" />

        {/* Footer actions: only View on CH + Edit + Delete */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-sm gap-2 px-4"
            onClick={() =>
              window.open(
                `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
                "_blank"
              )
            }
          >
            <CompaniesHouseLogo className="h-6 w-6" />
            Companies House
          </Button>
          {isAdmin && (
            <EditCompanyDialog
              company={company}
              directors={directors}
              onUpdate={onUpdate}
              triggerStyle="compact"
            />
          )}
          {isAdmin && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this company?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove <strong>{company.company_name}</strong> ({company.company_number}) and all related records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(company.id)}
                  >
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
