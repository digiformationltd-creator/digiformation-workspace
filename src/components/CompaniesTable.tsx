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

  const handleSort = (field: keyof Company) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    let aVal = a[sortField] ?? "";
    let bVal = b[sortField] ?? "";
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
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {[
                  { key: "company_name" as const, label: "Company" },
                  { key: "company_number" as const, label: "Number" },
                  { key: "status" as const, label: "Status" },
                  { key: "director" as const, label: "Director", sortable: false },
                  { key: "address_status" as const, label: "Address" },
                  { key: "ch_company_status" as const, label: "CH Status", sortable: false },
                  { key: "actions" as const, label: "Actions", sortable: false },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
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
              {sortedCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{company.company_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {company.company_number}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {company.company_number}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={getStatusBadge(company.status)}>
                      {company.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{company.director?.name || "-"}</span>
                      {company.director?.verification_status === "Pending Verification" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                company.director?.id &&
                                onVerifyDirector(company.director.id)
                              }
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Verify Director ID</TooltipContent>
                        </Tooltip>
                      )}
                      {company.director?.verification_status === "Verified" && (
                        <ShieldCheck className="h-3.5 w-3.5 text-success" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className={getAddressBadge(company.address_status)}>
                        {company.address_status}
                      </Badge>
                      {company.address_match_status && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getMatchBadge(company.address_match_status)}`}
                        >
                          CH: {company.address_match_status}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {company.ch_company_status ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            company.ch_company_status === "active"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }
                        >
                          {company.ch_company_status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {company.last_ch_sync
                            ? formatDate(company.last_ch_sync.split("T")[0])
                            : ""}
                        </span>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-7"
                            onClick={() =>
                              onSyncCH(company.id, company.company_number)
                            }
                            disabled={isSyncing}
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`}
                            />
                            Sync
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sync with Companies House</TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-4 py-3">
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
      </div>
    </TooltipProvider>
  );
}
