import * as XLSX from "xlsx";
import type { Company } from "@/types";

const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-GB") : "");

export function exportCompaniesToExcel(companies: Company[], filename: string) {
  const rows = companies.map((c) => ({
    "Company Name": c.company_name,
    "Company Number": c.company_number,
    "Status": c.status ?? "",
    "Address Status": c.address_status ?? "",
    "Director": c.previous_director_name || c.director?.name || "",
    "Original Director": c.director?.name || "",
    "Registered Address": c.company_address || "",
    "CH Address": c.ch_address || "",
    "Previous Name": c.previous_name || "",
    "Previous Address": c.previous_address || "",
    "Auth Code": c.auth_code || "",
    "UTR Number": c.utr_number || "",
    "SIC Codes": (c.sic_codes ?? []).join(", "),
    "Incorporation Date": fmt(c.incorporation_date),
    "AD01 Filing Date": fmt(c.ad01_filing_date),
    "Confirmation Statement Due": fmt(c.ch_confirmation_statement_next_due),
    "Accounts Next Due": fmt(c.ch_accounts_next_due),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  // Auto-width columns
  const headers = Object.keys(rows[0] ?? {});
  ws["!cols"] = headers.map((h) => ({
    wch: Math.min(
      40,
      Math.max(h.length + 2, ...rows.map((r) => String((r as Record<string, unknown>)[h] ?? "").length + 2)),
    ),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Companies");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}-${stamp}.xlsx`);
}
