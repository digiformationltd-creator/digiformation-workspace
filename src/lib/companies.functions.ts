import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import type { CompanyStatus } from "@/types";

interface CompanyInsert {
  company_name: string;
  company_number: string;
  incorporation_date?: string | null;
  company_address?: string | null;
  sic_codes?: string[] | null;
  auth_code?: string | null;
  utr_number?: string | null;
  status?: CompanyStatus;
  address_status?: "Default Address" | "Changed/Updated";
  ad01_filing_date?: string | null;
  director_id?: string | null;
  tags?: string[] | null;
}

export const getCompanies = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("*, director:directors(id, name, verification_status)")
    .order("company_name");
  if (error) throw new Error(error.message);
  return { companies: data ?? [] };
});

export const getDirectors = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("directors")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return { directors: data ?? [] };
});

export const createCompany = createServerFn({ method: "POST" })
  .inputValidator((data: { company: CompanyInsert }) => data)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .insert(data.company)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { company: result };
  });

export const updateCompany = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; updates: Partial<CompanyInsert> }) => data)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .update({ ...data.updates, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { company: result };
  });

export const markAsSold = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("status")
      .eq("id", data.id)
      .single();
    if (!company) throw new Error("Company not found");

    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .update({ status: "Sold/Transferred", updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("company_status_logs").insert({
      company_id: data.id,
      old_status: company.status,
      new_status: "Sold/Transferred",
      changed_by: null,
    });

    return { company: result };
  });

export const markAd01Filed = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const today = new Date().toISOString().split("T")[0];
    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .update({
        address_status: "Changed/Updated",
        ad01_filing_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("ad01_filings").insert({
      company_id: data.id,
      filed_date: today,
      notes: "Filed via dashboard",
    });

    return { company: result };
  });

export const verifyDirector = createServerFn({ method: "POST" })
  .inputValidator((data: { directorId: string }) => data)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin
      .from("directors")
      .update({ verification_status: "Verified" })
      .eq("id", data.directorId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { director: result };
  });

export const createDirector = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin
      .from("directors")
      .insert({ name: data.name })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { director: result };
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const importCompaniesCSV = createServerFn({ method: "POST" })
  .inputValidator((data: { rows: Array<Record<string, string>> }) => data)
  .handler(async ({ data }) => {
    const companies = data.rows.map((row) => ({
      company_name: row["Company Name"] || row["company_name"] || "",
      company_number: row["Company Number"] || row["company_number"] || "",
      incorporation_date: row["Incorporation Date"] || row["incorporation_date"] || null,
      company_address: row["Registered Address"] || row["company_address"] || null,
      sic_codes: row["SIC Codes"] ? row["SIC Codes"].split(",").map((s: string) => s.trim()) : null,
      auth_code: row["Auth Code"] || row["auth_code"] || null,
      utr_number: row["UTR Number"] || row["utr_number"] || null,
      status: (row["Status"] || row["status"] || "Active") as CompanyStatus,
      address_status: (row["Address Status"] || row["address_status"] || "Default Address") as
        | "Default Address"
        | "Changed/Updated",
      tags: row["Tags"] ? row["Tags"].split(",").map((s: string) => s.trim()) : null,
    }));

    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .insert(companies)
      .select();
    if (error) throw new Error(error.message);
    return { companies: result ?? [] };
  });

interface CHSyncResponse {
  success: boolean;
  error?: string;
  ch_status?: string;
  company_name?: string;
  incorporation_date?: string;
  ch_address?: string | null;
  full_profile?: Json;
}

export const syncWithCompaniesHouse = createServerFn({ method: "POST" })
  .inputValidator((data: { companyNumber: string }) => data)
  .handler(async ({ data }): Promise<CHSyncResponse> => {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Companies House API key not configured" };
    }
    const auth = btoa(`${apiKey}:`);
    const url = `https://api.company-information.service.gov.uk/company/${data.companyNumber}`;
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    });
    if (!response.ok) {
      return { success: false, error: `CH API error: ${response.status} - ${await response.text()}` };
    }
    const chData = (await response.json()) as Record<string, Json>;
    return {
      success: true,
      ch_status: chData.company_status as string,
      company_name: chData.company_name as string,
      incorporation_date: chData.date_of_creation as string,
      ch_address: chData.registered_office_address
        ? JSON.stringify(chData.registered_office_address)
        : null,
      full_profile: chData as Json,
    };
  });

export const updateCompanyCHStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; companyNumber: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    if (!apiKey) throw new Error("Companies House API key not configured");
    const auth = btoa(`${apiKey}:`);
    const url = `https://api.company-information.service.gov.uk/company/${data.companyNumber}`;
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`CH API error: ${response.status}`);
    const chData = (await response.json()) as Record<string, Json>;

    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .update({
        ch_company_status: chData.company_status as string,
        ch_company_profile: chData as Json,
        ch_address: chData.registered_office_address
          ? JSON.stringify(chData.registered_office_address)
          : null,
        last_ch_sync: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    const storedAddress = result?.company_address || "";
    const chAddress = chData.registered_office_address
      ? JSON.stringify(chData.registered_office_address)
      : "";
    const addressMatch = storedAddress === chAddress ? "Matched" : "Mismatched";

    await supabaseAdmin
      .from("companies")
      .update({ address_match_status: addressMatch })
      .eq("id", data.id);

    return { company: result };
  });

interface BulkSyncResult {
  company_id: string;
  company_number: string;
  success: boolean;
  status?: string;
  error?: string;
}

export const bulkSyncCompaniesHouse = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) throw new Error("Companies House API key not configured");

  const { data: companies, error } = await supabaseAdmin
    .from("companies")
    .select("id, company_number, company_address");
  if (error) throw new Error(error.message);

  const results: BulkSyncResult[] = [];
  const auth = btoa(`${apiKey}:`);

  for (const company of companies ?? []) {
    try {
      const url = `https://api.company-information.service.gov.uk/company/${company.company_number}`;
      const response = await fetch(url, {
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      });
      if (!response.ok) {
        results.push({
          company_id: company.id,
          company_number: company.company_number,
          success: false,
          error: `HTTP ${response.status}`,
        });
        continue;
      }
      const chData = (await response.json()) as Record<string, Json>;
      const storedAddress = company.company_address || "";
      const chAddress = chData.registered_office_address
        ? JSON.stringify(chData.registered_office_address)
        : "";
      const addressMatch = storedAddress === chAddress ? "Matched" : "Mismatched";

      await supabaseAdmin
        .from("companies")
        .update({
          ch_company_status: chData.company_status as string,
          ch_company_profile: chData as Json,
          ch_address: chData.registered_office_address
            ? JSON.stringify(chData.registered_office_address)
            : null,
          address_match_status: addressMatch,
          last_ch_sync: new Date().toISOString(),
        })
        .eq("id", company.id);

      results.push({
        company_id: company.id,
        company_number: company.company_number,
        success: true,
        status: chData.company_status as string,
      });
    } catch (err: unknown) {
      results.push({
        company_id: company.id,
        company_number: company.company_number,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { results, total: companies?.length ?? 0 };
});
