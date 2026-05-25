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
    <TooltipProvider delayDuration={200}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[20%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[5%]" />
              <col className="w-[5%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                {[
                  { key: "company_name" as const, label: "Company" },
                  { key: "company_number" as const, label: "Number" },
                  { key: "status" as const, label: "Status" },
                  { key: "director" as const, label: "Director", sortable: false },
                  { key: "company_address" as const, label: "Address" },
                  { key: "auth_code" as const, label: "Auth" },
                  { key: "utr_number" as const, label: "UTR" },
                  { key: "ad01_filing_date" as const, label: "AD01" },
                  { key: "ch_company_status" as const, label: "CH", sortable: false },
                  { key: "actions" as const, label: "Actions", sortable: false },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-2 py-2 text-left font-medium whitespace-nowrap"
                  >
                    {col.sortable !== false ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-0.5 hover:text-foreground uppercase tracking-wide text-[10px]"
                      >
                        {col.label}
                        {sortField === col.key &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-2.5 w-2.5" />
                          ) : (
                            <ChevronDown className="h-2.5 w-2.5" />
                          ))}
                      </button>
                    ) : (
                      <span className="uppercase tracking-wide text-[10px]">{col.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCompanies.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-xs text-muted-foreground">
                    No companies match your filters.
                  </td>
                </tr>
              )}
              {sortedCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-2 py-1.5">
                    <div className="font-medium truncate" title={company.company_name}>
                      {company.company_name}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[10px] truncate">
                    {company.company_number}
                  </td>
                  <td className="px-2 py-1.5">
                    <Badge variant="outline" className={`${getStatusBadge(company.status)} text-[9px] px-1.5 py-0`}>
                      {company.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1 truncate" title={company.director?.name || ""}>
                      <span className="truncate">{company.director?.name || "-"}</span>
                      {company.director?.verification_status === "Verified" && (
                        <ShieldCheck className="h-3 w-3 text-success shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate text-[10px]">
                          {company.company_address || "-"}
                          {company.address_match_status && company.address_match_status !== "Unknown" && (
                            <Badge
                              variant="outline"
                              className={`ml-1 text-[8px] px-1 py-0 ${getMatchBadge(company.address_match_status)}`}
                            >
                              {company.address_match_status === "Matched" ? "✓" : "≠"}
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[400px] text-xs">
                        <div><strong>Registered:</strong> {company.company_address || "-"}</div>
                        {company.ch_address && (
                          <div className="mt-1"><strong>CH:</strong> {company.ch_address}</div>
                        )}
                        <div className="mt-1 text-muted-foreground">Status: {company.address_status}</div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[10px] truncate">
                    {company.auth_code ? (
                      <span className="px-1 py-0.5 rounded bg-muted/60">{company.auth_code}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[10px] truncate">
                    {company.utr_number || <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-2 py-1.5 text-[10px] whitespace-nowrap">
                    {company.ad01_filing_date ? (
                      <span className="text-success">{formatDate(company.ad01_filing_date)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {company.ch_company_status ? (
                      <Badge
                        variant="outline"
                        className={
                          company.ch_company_status === "active"
                            ? "bg-success/10 text-success border-success/20 text-[9px] px-1.5 py-0"
                            : "bg-destructive/10 text-destructive border-destructive/20 text-[9px] px-1.5 py-0"
                        }
                      >
                        {company.ch_company_status === "active" ? "✓" : company.ch_company_status}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onSyncCH(company.id, company.company_number)}
                        disabled={isSyncing}
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onMarkSold(company.id)}
                            disabled={company.status === "Sold/Transferred"}
                          >
                            <Truck className="h-3 w-3 text-info" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark Sold</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onMarkAd01(company.id)}
                          >
                            <FileText className="h-3 w-3 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>AD01 Filed</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              window.open(
                                `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View on CH</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:text-destructive"
                            onClick={() => onDelete(company.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                      {company.director?.verification_status === "Pending Verification" && company.director?.id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onVerifyDirector(company.director!.id)}
                            >
                              <ShieldCheck className="h-3 w-3 text-warning" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Verify Director</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t bg-muted/20 px-3 py-1.5 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>Hover address row for full details</span>
          <span>{sortedCompanies.length} rows</span>
        </div>
      </div>
    </TooltipProvider>
  );
}


