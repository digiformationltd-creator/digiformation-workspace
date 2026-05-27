import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";


interface CompanyInsert {
  company_name: string;
  company_number: string;
  incorporation_date?: string | null;
  company_address?: string | null;
  sic_codes?: string[] | null;
  auth_code?: string | null;
  utr_number?: string | null;
  address_status?: "Default Address" | "Changed/Updated" | "Active";
  ad01_filing_date?: string | null;
  director_id?: string | null;
  tags?: string[] | null;
}


// UK Companies House number format: 8 alphanumeric chars (e.g. 12345678, SC123456, NI123456, OC123456)
const CH_NUMBER_RE = /^[A-Z0-9]{2}\d{6}$|^\d{8}$/;
function validateCompanyNumber(n: string): string {
  const trimmed = (n || "").trim().toUpperCase();
  if (!CH_NUMBER_RE.test(trimmed)) {
    throw new Error("Invalid company number format");
  }
  return trimmed;
}

function dbError(error: { message: string; code?: string }, context: string): Error {
  console.error(`[DB Error] ${context}`, error);
  if (error.code === "23505") return new Error("A record with that identifier already exists.");
  return new Error("A database error occurred. Please try again.");
}

export const getCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("companies")
      .select("*, director:directors(id, name, verification_status)")
      .order("company_name");
    if (error) throw dbError(error, "getCompanies");
    return { companies: data ?? [] };
  });

export const getDirectors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("directors")
      .select("*")
      .order("name");
    if (error) throw dbError(error, "getDirectors");
    return { directors: data ?? [] };
  });

export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { company: CompanyInsert }) => data)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .insert(data.company)
      .select()
      .single();
    if (error) throw dbError(error, "createCompany");
    return { company: result };
  });

export const updateCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; updates: Partial<CompanyInsert> }) => data)
  .handler(async ({ data }) => {
    // updated_at is now set by the DB trigger; status changes are auto-logged.
    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .update(data.updates)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw dbError(error, "updateCompany");
    return { company: result };
  });

export const markAsSold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    // Setting availability_status=sold makes the DB trigger re-derive
    // status='Sold/Transferred' and log the change automatically.
    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .update({ availability_status: "sold" })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw dbError(error, "markAsSold");
    return { company: result };
  });

export const markAd01Filed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
    if (error) throw dbError(error, "markAd01Filed");

    await supabaseAdmin.from("ad01_filings").insert({
      company_id: data.id,
      filed_date: today,
      notes: "Filed via dashboard",
    });

    return { company: result };
  });

export const verifyDirector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { directorId: string }) => data)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin
      .from("directors")
      .update({ verification_status: "Verified" })
      .eq("id", data.directorId)
      .select()
      .single();
    if (error) throw dbError(error, "verifyDirector");
    return { director: result };
  });

export const createDirector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin
      .from("directors")
      .insert({ name: data.name })
      .select()
      .single();
    if (error) throw dbError(error, "createDirector");
    return { director: result };
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", data.id);
    if (error) throw dbError(error, "deleteCompany");
    return { success: true };
  });

export const importCompaniesCSV = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { rows: Array<Record<string, string>> }) => data)
  .handler(async ({ data }) => {
    const directorNames = Array.from(
      new Set(
        data.rows
          .map((r) => (r["Director Name"] || r["director_name"] || "").trim())
          .filter(Boolean)
      )
    );

    const directorMap = new Map<string, string>();
    if (directorNames.length > 0) {
      const { data: existing } = await supabaseAdmin
        .from("directors")
        .select("id, name")
        .in("name", directorNames);
      for (const d of existing ?? []) directorMap.set(d.name, d.id);

      const missing = directorNames.filter((n) => !directorMap.has(n));
      if (missing.length > 0) {
        const { data: created, error: dErr } = await supabaseAdmin
          .from("directors")
          .insert(missing.map((name) => ({ name })))
          .select("id, name");
        if (dErr) throw dbError(dErr, "importCompaniesCSV/directors");
        for (const d of created ?? []) directorMap.set(d.name, d.id);
      }
    }

    const companies = data.rows.map((row) => {
      const dirName = (row["Director Name"] || row["director_name"] || "").trim();
      return {
        company_name: row["Company Name"] || row["company_name"] || "",
        company_number: row["Company Number"] || row["company_number"] || "",
        incorporation_date:
          row["Incorporation Date"] || row["incorporation_date"] || null,
        company_address:
          row["Company Address"] ||
          row["Registered Address"] ||
          row["company_address"] ||
          null,
        sic_codes: row["SIC Codes"]
          ? row["SIC Codes"].split(",").map((s: string) => s.trim()).filter(Boolean)
          : null,
        auth_code: row["Auth Code"] || row["auth_code"] || null,
        utr_number: row["UTR Number"] || row["utr_number"] || null,
        // status is derived by DB trigger — never set from CSV.
        address_status: (row["Address Status"] ||
          row["address_status"] ||
          "Default Address") as "Default Address" | "Changed/Updated" | "Active",
        director_id: dirName ? directorMap.get(dirName) ?? null : null,
        tags: row["Tags"]
          ? row["Tags"].split(",").map((s: string) => s.trim()).filter(Boolean)
          : null,
      };
    });

    const { data: result, error } = await supabaseAdmin
      .from("companies")
      .insert(companies)
      .select();
    if (error) throw dbError(error, "importCompaniesCSV");
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { companyNumber: string }) => data)
  .handler(async ({ data }): Promise<CHSyncResponse> => {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Companies House API key not configured" };
    }
    let companyNumber: string;
    try {
      companyNumber = validateCompanyNumber(data.companyNumber);
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
    const auth = btoa(`${apiKey}:`);
    const url = `https://api.company-information.service.gov.uk/company/${encodeURIComponent(companyNumber)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    });
    if (!response.ok) {
      console.error("[CH API]", response.status, await response.text());
      return { success: false, error: `Companies House request failed (${response.status})` };
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; companyNumber: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    if (!apiKey) throw new Error("Companies House API key not configured");
    const companyNumber = validateCompanyNumber(data.companyNumber);
    const auth = btoa(`${apiKey}:`);
    const url = `https://api.company-information.service.gov.uk/company/${encodeURIComponent(companyNumber)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    });
    if (!response.ok) {
      console.error("[CH API]", response.status);
      throw new Error(`Companies House request failed (${response.status})`);
    }
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
    if (error) throw dbError(error, "updateCompanyCHStatus");
    // address_match_status is derived by the DB trigger from company_address vs ch_address.

    return { company: result };
  });


interface BulkSyncResult {
  company_id: string;
  company_number: string;
  success: boolean;
  status?: string;
  error?: string;
}

export const bulkSyncCompaniesHouse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    if (!apiKey) throw new Error("Companies House API key not configured");

    const { data: companies, error } = await supabaseAdmin
      .from("companies")
      .select("id, company_number");

    if (error) throw dbError(error, "bulkSyncCompaniesHouse/list");

    const results: BulkSyncResult[] = [];
    const auth = btoa(`${apiKey}:`);

    for (const company of companies ?? []) {
      try {
        const companyNumber = validateCompanyNumber(company.company_number);
        const url = `https://api.company-information.service.gov.uk/company/${encodeURIComponent(companyNumber)}`;
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

        // address_match_status is derived by the DB trigger from company_address vs ch_address.
        await supabaseAdmin
          .from("companies")
          .update({
            ch_company_status: chData.company_status as string,
            ch_company_profile: chData as Json,
            ch_address: chData.registered_office_address
              ? JSON.stringify(chData.registered_office_address)
              : null,
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
        console.error("[bulkSync]", err);
        results.push({
          company_id: company.id,
          company_number: company.company_number,
          success: false,
          error: "Sync failed",
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return { results, total: companies?.length ?? 0 };
  });
