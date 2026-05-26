import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileCheck,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { CompaniesHouseLogo } from "@/components/CompaniesHouseLogo";
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
  onMarkAd01Complete: (id: string) => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  isAdmin?: boolean;
}


export function CompaniesTable({
  companies,
  directors,
  onMarkSold,
  onMarkAd01,
  onMarkAd01Complete,
  onUpdate,
  isAdmin = true,
}: Props) {
  const [sortField, setSortField] = useState<keyof Company | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field as keyof Company);
      setSortDirection("asc");
    }
  };

  const sortedCompanies = sortField
    ? [...companies].sort((a, b) => {
        const key = sortField as keyof Company;
        let aVal = a[key] ?? "";
        let bVal = b[key] ?? "";
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      })
    : companies;

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

  const isAuthMissing = (c: Company) =>
    !c.auth_code || c.auth_code.trim() === "" || c.auth_code.trim().toLowerCase() === "pending";
  const isAd01Complete = (c: Company) => Array.isArray(c.tags) && c.tags.includes("ad01-complete");
  const needsAd01Filing = (c: Company) =>
    c.status === "Active" && !c.ad01_filing_date && (isAuthMissing(c) || c.address_status === "Default Address");
  const isAd01Processing = (c: Company) =>
    c.status === "Active" && !!c.ad01_filing_date && !isAd01Complete(c) && (isAuthMissing(c) || c.address_status === "Default Address");



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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`font-medium break-words ${company.previous_name ? "underline decoration-dotted underline-offset-2 cursor-help" : ""}`}>
                      {company.company_name}
                    </div>
                  </TooltipTrigger>
                  {company.previous_name && (
                    <TooltipContent className="text-xs max-w-[280px]">
                      <div><strong>Now registered as:</strong> {company.previous_name}</div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Number</div>
                <div className="font-mono break-all">{company.company_number}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Director</div>
                {(() => {
                  // `previous_director_name` holds the NEW current director for sold companies.
                  // `director.name` is our original (now-resigned) owner-director.
                  const newCurrent = company.previous_director_name;
                  const ours = company.director?.name;
                  const display = newCurrent || ours;
                  const changed = !!newCurrent && !!ours && newCurrent !== ours;
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`break-words ${changed ? "underline decoration-dotted underline-offset-2 cursor-help" : ""}`}>
                          {display || "—"}
                        </div>
                      </TooltipTrigger>
                      {changed && (
                        <TooltipContent className="text-xs max-w-[280px]">
                          <div><strong>Previously:</strong> {ours}</div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })()}
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Address</div>
                <div className="break-words text-[11px]">{company.company_address || "—"}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Auth Code</div>
                <EditableCell
                  value={company.auth_code}
                  onSave={(v) => onUpdate(company.id, { auth_code: v })}
                  mono
                  className={`text-[11px] ${!company.auth_code || company.auth_code.trim() === "" || company.auth_code.trim().toLowerCase() === "pending" ? "text-warning" : "text-foreground"}`}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
              <CompanyDetailsSheet company={company} triggerStyle="compact" />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] px-2.5 gap-1.5 border-slate-700/40 text-slate-800 dark:text-slate-200 hover:bg-slate-700/10"
                onClick={() =>
                  window.open(
                    `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
                    "_blank"
                  )
                }
              >
                <CompaniesHouseLogo className="h-4 w-4" />
                View on Companies House
              </Button>
              {isAdmin && (
                <>
                  <EditCompanyDialog
                    company={company}
                    directors={directors}
                    onUpdate={onUpdate}
                    triggerStyle="compact"
                  />
                  {needsAd01Filing(company) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2 gap-1 border-orange-500/40 text-orange-600 hover:bg-orange-500/10"
                      onClick={() => onMarkAd01(company.id)}
                    >
                      <FileCheck className="h-3 w-3" />
                      AD01
                    </Button>
                  )}
                  {isAd01Processing(company) && (
                    <>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/40 text-blue-600">
                        AD01 Filed
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2 gap-1 border-green-500/40 text-green-600 hover:bg-green-500/10"
                        onClick={() => onMarkAd01Complete(company.id)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Complete
                      </Button>
                    </>
                  )}
                  {isAd01Complete(company) && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-green-500/40 text-green-700 bg-green-500/10">
                      AD01 Complete
                    </Badge>
                  )}
                  {company.status === "Active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2 gap-1 border-sky-500/40 text-sky-600 hover:bg-sky-500/10"
                      onClick={() => onMarkSold(company.id)}
                    >
                      <Truck className="h-3 w-3" />
                      Sold
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <div className="w-full">
          <table className="w-full text-[11px] table-fixed">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[11%]" />
              <col className="w-[22%]" />
              <col className="w-[9%]" />
              <col className="w-[27%]" />
            </colgroup>
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                {[
                  { key: "company_name" as const, label: "Company" },
                  { key: "company_number" as const, label: "Number" },
                  { key: "status" as const, label: "Status" },
                  { key: "director" as const, label: "Director", sortable: false },
                  { key: "company_address" as const, label: "Address" },
                  { key: "auth_code" as const, label: "Auth Code" },
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
                  <td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground">
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
                      const newCurrent = company.previous_director_name;
                      const ours = company.director?.name;
                      const display = newCurrent || ours;
                      const changed = !!newCurrent && !!ours && newCurrent !== ours;
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`truncate flex items-center gap-1 text-[11px] ${changed ? "cursor-help underline decoration-dotted underline-offset-2" : ""}`}>
                              {display || <span className="text-muted-foreground">—</span>}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs max-w-[320px]">
                            <div><strong>Current director:</strong> {display || "—"}</div>
                            {changed && (
                              <div className="mt-1"><strong>Previously (ours):</strong> {ours}</div>
                            )}
                            {!newCurrent && company.director && !company.director.is_owner && (
                              <div className="mt-1 text-muted-foreground italic">Transferred — new director not recorded</div>
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
                  <td className="px-2 py-1.5">
                    <EditableCell
                      value={company.auth_code}
                      onSave={(v) => onUpdate(company.id, { auth_code: v })}
                      mono
                      className={`text-[10px] ${!company.auth_code || company.auth_code.trim() === "" || company.auth_code.trim().toLowerCase() === "pending" ? "text-warning" : "text-foreground"}`}
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="flex items-center gap-1 justify-end flex-wrap">
                      <CompanyDetailsSheet company={company} triggerStyle="compact" />
                      {isAdmin ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 gap-1 border-slate-700/40 text-slate-800 dark:text-slate-200 hover:bg-slate-700/10"
                              onClick={() =>
                                window.open(
                                  `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
                                  "_blank"
                                )
                              }
                            >
                              <CompaniesHouseLogo className="h-3.5 w-3.5" />
                              CH
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View on Companies House</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2.5 gap-1.5 border-slate-700/40 text-slate-800 dark:text-slate-200 hover:bg-slate-700/10"
                          onClick={() =>
                            window.open(
                              `https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`,
                              "_blank"
                            )
                          }
                        >
                          <CompaniesHouseLogo className="h-4 w-4" />
                          View on Companies House
                        </Button>
                      )}
                      {isAdmin && needsAd01Filing(company) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 gap-1 border-orange-500/40 text-orange-600 hover:bg-orange-500/10"
                              onClick={() => onMarkAd01(company.id)}
                            >
                              <FileCheck className="h-3 w-3" />
                              AD01
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Mark AD01 as filed</TooltipContent>
                        </Tooltip>
                      )}
                      {isAdmin && isAd01Processing(company) && (
                        <>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/40 text-blue-600">
                            AD01 Filed {formatDate(company.ad01_filing_date)}
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2 gap-1 border-green-500/40 text-green-600 hover:bg-green-500/10"
                                onClick={() => onMarkAd01Complete(company.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Complete
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark AD01 as complete</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      {isAdmin && isAd01Complete(company) && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-green-500/40 text-green-700 bg-green-500/10">
                          AD01 Complete
                        </Badge>
                      )}
                      {isAdmin && company.status === "Active" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 gap-1 border-sky-500/40 text-sky-600 hover:bg-sky-500/10"
                              onClick={() => onMarkSold(company.id)}
                            >
                              <Truck className="h-3 w-3" />
                              Sold
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Mark as Sold/Transferred</TooltipContent>
                        </Tooltip>
                      )}
                      {isAdmin && (
                        <EditCompanyDialog
                          company={company}
                          directors={directors}
                          onUpdate={onUpdate}
                          triggerStyle="compact"
                        />
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


