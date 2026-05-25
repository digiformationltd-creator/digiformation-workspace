import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Truck,
  FileText,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Company } from "@/types";

interface Props {
  companies: Company[];
  onMarkSold: (id: string) => void;
  onMarkAd01: (id: string) => void;
  onSyncCH: (id: string, number: string) => void;
  onDelete: (id: string) => void;
  onVerifyDirector: (directorId: string) => void;
  isSyncing?: boolean;
}

export function CompaniesTable({
  companies,
  onMarkSold,
  onMarkAd01,
  onSyncCH,
  onDelete,
  onVerifyDirector,
  isSyncing,
}: Props) {
  const [sortField, setSortField] = useState<keyof Company>("company_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field as keyof Company);
      setSortDirection("asc");
    }
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    const key = sortField as keyof Company;
    let aVal = a[key] ?? "";
    let bVal = b[key] ?? "";
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "bg-success/10 text-success border-success/20",
      "Pending Sale": "bg-warning/10 text-warning border-warning/20",
      "Sold/Transferred": "bg-info/10 text-info border-info/20",
      "Strike Off Pending": "bg-destructive/10 text-destructive border-destructive/20",
      "Struck Off": "bg-muted text-muted-foreground",
    };
    return variants[status] || "bg-muted text-muted-foreground";
  };

  const getAddressBadge = (status: string) => {
    const variants: Record<string, string> = {
      "Default Address": "bg-muted/50 text-muted-foreground",
      "Changed/Updated": "bg-primary/10 text-primary border-primary/20",
    };
    return variants[status] || "bg-muted text-muted-foreground";
  };

  const getMatchBadge = (match: string | null) => {
    if (match === "Matched") return "bg-success/10 text-success border-success/20";
    if (match === "Mismatched") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
  };

  return (
    <TooltipProvider>
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "1600px" }}>
            <thead>
              <tr className="border-b bg-muted/50">
                {[
                  { key: "company_name" as const, label: "Company", w: "min-w-[220px]" },
                  { key: "company_number" as const, label: "Co. Number", w: "min-w-[110px]" },
                  { key: "status" as const, label: "Status", w: "min-w-[140px]" },
                  { key: "director" as const, label: "Director", sortable: false, w: "min-w-[160px]" },
                  { key: "company_address" as const, label: "Registered Address", w: "min-w-[280px]" },
                  { key: "address_status" as const, label: "Addr Status", w: "min-w-[140px]" },
                  { key: "auth_code" as const, label: "Auth Code", w: "min-w-[110px]" },
                  { key: "utr_number" as const, label: "UTR", w: "min-w-[120px]" },
                  { key: "incorporation_date" as const, label: "Incorp Date", w: "min-w-[110px]" },
                  { key: "ad01_filing_date" as const, label: "AD01 Filed", w: "min-w-[110px]" },
                  { key: "ch_company_status" as const, label: "CH Sync", sortable: false, w: "min-w-[140px]" },
                  { key: "actions" as const, label: "Actions", sortable: false, w: "min-w-[180px]" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-3 text-left font-medium text-muted-foreground whitespace-nowrap ${col.w}`}
                  >
                    {col.sortable !== false ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {col.label}
                        {sortField === col.key &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCompanies.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No companies match your filters.
                  </td>
                </tr>
              )}
              {sortedCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-3">
                    <div className="font-medium">{company.company_name}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {company.company_number}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={getStatusBadge(company.status)}>
                      {company.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[140px]">{company.director?.name || "-"}</span>
                      {company.director?.verification_status === "Verified" && (
                        <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div className="max-w-[280px] truncate" title={company.company_address || ""}>
                      {company.company_address || "-"}
                    </div>
                    {company.ch_address && company.ch_address !== company.company_address && (
                      <div className="text-[10px] text-muted-foreground truncate max-w-[280px]" title={company.ch_address}>
                        CH: {company.ch_address}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className={`text-[10px] ${getAddressBadge(company.address_status)}`}>
                        {company.address_status}
                      </Badge>
                      {company.address_match_status && company.address_match_status !== "Unknown" && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getMatchBadge(company.address_match_status)}`}
                        >
                          {company.address_match_status}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {company.auth_code ? (
                      <span className="px-2 py-1 rounded bg-muted/60">{company.auth_code}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {company.utr_number || <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    {formatDate(company.incorporation_date)}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    {formatDate(company.ad01_filing_date)}
                  </td>
                  <td className="px-3 py-3">
                    {company.ch_company_status ? (
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className={
                            company.ch_company_status === "active"
                              ? "bg-success/10 text-success border-success/20 text-[10px]"
                              : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                          }
                        >
                          {company.ch_company_status}
                        </Badge>
                        {company.last_ch_sync && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(company.last_ch_sync.split("T")[0])}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-7"
                            onClick={() => onSyncCH(company.id, company.company_number)}
                            disabled={isSyncing}
                          >
                            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                            Sync
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sync with Companies House</TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onMarkSold(company.id)}
                            disabled={company.status === "Sold/Transferred"}
                          >
                            <Truck className="h-3.5 w-3.5 text-info" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark as Sold/Transferred</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onMarkAd01(company.id)}
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>AD01 Filed</TooltipContent>
                      </Tooltip>
                      {company.director?.verification_status === "Pending Verification" && company.director?.id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onVerifyDirector(company.director!.id)}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Verify Director ID</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              window.open(
                                `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View on Companies House</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => onDelete(company.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete company</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>← Scroll horizontally to see all columns →</span>
          <span>{sortedCompanies.length} rows</span>
        </div>
      </div>
    </TooltipProvider>
  );
}

