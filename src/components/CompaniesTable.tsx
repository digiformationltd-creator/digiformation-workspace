import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Truck,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { EditableCell } from "@/components/EditableCell";
import { EditCompanyDialog } from "@/components/EditCompanyDialog";
import { CompanyDetailsSheet } from "@/components/CompanyDetailsSheet";
import type { Company, Director } from "@/types";

interface Props {
  companies: Company[];
  directors: Director[];
  onMarkSold: (id: string) => void;
  onMarkAd01: (id: string) => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
}


export function CompaniesTable({
  companies,
  directors,
  onMarkSold,
  onMarkAd01,
  onUpdate,
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
      "Available Company": "bg-warning/10 text-warning border-warning/20",
      "Sold/Transferred": "bg-info/10 text-info border-info/20",
      "Strike Off Notice": "bg-destructive/10 text-destructive border-destructive/20",
    };
    return variants[status] || "bg-muted text-muted-foreground";
  };

  const getAddressBadge = (status: string) => {
    const variants: Record<string, string> = {
      "Default Address": "bg-warning/10 text-warning border-warning/20",
      "Changed/Updated": "bg-primary/10 text-primary border-primary/20",
      "Active": "bg-success/10 text-success border-success/20",
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
      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {sortedCompanies.length === 0 && (
          <div className="rounded-lg border bg-card px-4 py-10 text-center text-xs text-muted-foreground">
            No companies match your filters.
          </div>
        )}
        {sortedCompanies.map((company) => (
          <div
            key={company.id}
            className="rounded-lg border bg-card p-3 space-y-2 overflow-hidden"
          >
            <div className="space-y-1.5 text-[12px]">
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Company</div>
                <div className="font-medium break-words">{company.company_name}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Number</div>
                <div className="font-mono break-all">{company.company_number}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Director</div>
                <div className="break-words">{company.director?.name || "—"}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Address</div>
                <div className="break-words text-[11px]">{company.company_address || "—"}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
              <CompanyDetailsSheet company={company} triggerStyle="compact" />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2 gap-1"
                onClick={() => onMarkSold(company.id)}
                disabled={company.status === "Sold/Transferred"}
              >
                <Truck className="h-3 w-3 text-info" />
                Sold
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2 gap-1"
                onClick={() => onMarkAd01(company.id)}
              >
                <FileText className="h-3 w-3 text-primary" />
                AD01
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2 gap-1"
                onClick={() =>
                  window.open(
                    `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                CH
              </Button>
              <EditCompanyDialog
                company={company}
                directors={directors}
                onUpdate={onUpdate}
                triggerStyle="compact"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <div className="w-full">
          <table className="w-full text-[11px] table-fixed">
            <colgroup>
              <col className="w-[17%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[26%]" />
              <col className="w-[30%]" />
            </colgroup>
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                {[
                  { key: "company_name" as const, label: "Company" },
                  { key: "company_number" as const, label: "Number" },
                  { key: "status" as const, label: "Status" },
                  { key: "director" as const, label: "Director", sortable: false },
                  { key: "company_address" as const, label: "Address" },
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
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-muted-foreground">
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={company.previous_name ? "cursor-help" : undefined}>
                          <EditableCell
                            value={company.company_name}
                            onSave={(v) => v && onUpdate(company.id, { company_name: v })}
                            className={`font-medium ${company.previous_name ? "underline decoration-dotted underline-offset-2" : ""}`}
                          />
                        </div>
                      </TooltipTrigger>
                      {company.previous_name && (
                        <TooltipContent className="text-xs max-w-[320px]">
                          <div><strong>Original name:</strong> {company.company_name}</div>
                          <div className="mt-1"><strong>Now registered as:</strong> {company.previous_name}</div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell
                      value={company.company_number}
                      onSave={(v) => v && onUpdate(company.id, { company_number: v.toUpperCase() })}
                      mono
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Badge variant="outline" className={`${getStatusBadge(company.status)} text-[9px] px-1.5 py-0 truncate`}>
                      {company.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-1.5">
                    {(() => {
                      const original = company.previous_director_name || company.director?.name;
                      const current = company.director?.name;
                      const changed = !!company.previous_director_name && current && current !== company.previous_director_name;
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`truncate flex items-center gap-1 text-[11px] ${changed ? "cursor-help underline decoration-dotted underline-offset-2" : ""}`}>
                              {original || <span className="text-muted-foreground">—</span>}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs max-w-[320px]">
                            <div><strong>Original director:</strong> {original || "—"}</div>
                            {changed && (
                              <div className="mt-1"><strong>Current director:</strong> {current}</div>
                            )}
                            {!company.previous_director_name && company.director && !company.director.is_owner && (
                              <div className="mt-1 text-muted-foreground italic">Transferred — original not recorded</div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </td>
                  <td className="px-2 py-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 min-w-0">
                            {company.address_status === "Default Address" ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-[10px] font-mono uppercase text-warning truncate block underline decoration-dotted underline-offset-2 hover:text-warning/80"
                                  >
                                    PO BOX (Default) — view old
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 text-xs" align="start">
                                  <div className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                                    Original address (before default)
                                  </div>
                                  <div className="break-words">
                                    {company.previous_address || (
                                      <span className="italic text-muted-foreground">
                                        Not recorded
                                      </span>
                                    )}
                                  </div>
                                  {company.ch_address && (
                                    <div className="mt-2 pt-2 border-t">
                                      <div className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                                        Current CH address
                                      </div>
                                      <div className="break-words">{company.ch_address}</div>
                                    </div>
                                  )}
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <EditableCell
                                value={company.company_address}
                                onSave={(v) => onUpdate(company.id, { company_address: v })}
                                className="text-[10px]"
                              />
                            )}
                          </div>
                          {company.address_match_status && company.address_match_status !== "Unknown" && (
                            <Badge
                              variant="outline"
                              className={`text-[8px] px-1 py-0 shrink-0 ${getMatchBadge(company.address_match_status)}`}
                            >
                              {company.address_match_status === "Matched" ? "✓" : "≠"}
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[400px] text-xs">
                        {company.address_status === "Default Address" && company.previous_address && (
                          <div className="mb-1 pb-1 border-b border-border/40">
                            <strong>Original address (our record):</strong>
                            <div className="mt-0.5">{company.previous_address}</div>
                          </div>
                        )}
                        <div><strong>Current:</strong> {company.company_address || "-"}</div>
                        {company.previous_address && company.address_status !== "Default Address" && (
                          <div className="mt-1"><strong>Previous:</strong> {company.previous_address}</div>
                        )}
                        {company.ch_address && (
                          <div className="mt-1"><strong>CH:</strong> {company.ch_address}</div>
                        )}
                        <div className="mt-1 text-muted-foreground">Status: {company.address_status}</div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="flex items-center gap-1 justify-end flex-wrap">
                      <CompanyDetailsSheet company={company} triggerStyle="compact" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2 gap-1"
                            onClick={() => onMarkSold(company.id)}
                            disabled={company.status === "Sold/Transferred"}
                          >
                            <Truck className="h-3 w-3 text-info" />
                            Sold
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark Sold</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2 gap-1"
                            onClick={() => onMarkAd01(company.id)}
                          >
                            <FileText className="h-3 w-3 text-primary" />
                            AD01
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>AD01 Filed {company.ad01_filing_date ? `· ${formatDate(company.ad01_filing_date)}` : ""}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2 gap-1"
                            onClick={() =>
                              window.open(
                                `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            CH
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View on CH</TooltipContent>
                      </Tooltip>
                      <EditCompanyDialog
                        company={company}
                        directors={directors}
                        onUpdate={onUpdate}
                        triggerStyle="compact"
                      />
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


