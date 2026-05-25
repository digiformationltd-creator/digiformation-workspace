import { useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateCompanyCHStatus, bulkSyncCompaniesHouse } from "@/lib/companies.functions";
import type { Company, Director, CompanyStatus } from "@/types";

/**
 * All CRUD goes through the supabase browser client directly so that
 * inserts/updates/deletes do not consume server-function invocations
 * (no Lovable credits used for normal data entry). RLS allows
 * authenticated users full access to these tables.
 *
 * The only server function still used is the Companies House sync,
 * because it needs a secret API key.
 */

async function fetchCompaniesDirect(): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*, director:directors(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Company[];
}

async function fetchDirectorsDirect(): Promise<Director[]> {
  const { data, error } = await supabase
    .from("directors")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Director[];
}

export function useCompanies() {
  const queryClient = useQueryClient();
  const syncCHFn = useServerFn(updateCompanyCHStatus);
  const bulkSyncFn = useServerFn(bulkSyncCompaniesHouse);

  const companiesQuery = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompaniesDirect,
  });

  const directorsQuery = useQuery({
    queryKey: ["directors"],
    queryFn: fetchDirectorsDirect,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    queryClient.invalidateQueries({ queryKey: ["directors"] });
  }, [queryClient]);

  // --- direct supabase mutations (no server fn = no credits) ---

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("companies")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update"),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete"),
  });

  const markSoldMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("companies")
        .update({ status: "Sold/Transferred" as CompanyStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Marked as Sold/Transferred");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markAd01Mutation = useMutation({
    mutationFn: async (id: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const { error: e1 } = await supabase
        .from("companies")
        .update({ ad01_filing_date: today, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (e1) throw new Error(e1.message);
      await supabase.from("ad01_filings").insert({ company_id: id, filed_date: today });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("AD01 filing recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createDirectorMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("directors")
        .insert({ name })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directors"] });
      toast.success("Director added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyDirectorMutation = useMutation({
    mutationFn: async (directorId: string) => {
      const { error } = await supabase
        .from("directors")
        .update({ verification_status: "Verified" })
        .eq("id", directorId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directors"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Director verified");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (company: Partial<Company>) => {
      const { error } = await supabase.from("companies").insert(company as never);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company added");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add"),
  });

  // CH sync still uses server fn (needs API key)
  const syncCHMutation = useMutation({
    mutationFn: syncCHFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Companies House sync completed");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to sync"),
  });

  return {
    companies: (companiesQuery.data ?? []) as Company[],
    directors: (directorsQuery.data ?? []) as Director[],
    loading: companiesQuery.isLoading || directorsQuery.isLoading,
    markAsSold: (id: string) => markSoldMutation.mutate(id),
    markAd01Filed: (id: string) => markAd01Mutation.mutate(id),
    syncCompanyCH: (id: string, companyNumber: string) =>
      syncCHMutation.mutate({ data: { id, companyNumber } }),
    createDirector: (name: string) => createDirectorMutation.mutate(name),
    verifyDirector: (directorId: string) => verifyDirectorMutation.mutate(directorId),
    updateCompany: (id: string, updates: Record<string, unknown>) =>
      updateCompanyMutation.mutate({ id, updates }),
    deleteCompany: (id: string) => deleteCompanyMutation.mutate(id),
    createCompany: (company: Partial<Company>) => createCompanyMutation.mutateAsync(company),
    refresh: invalidate,
    isSyncing: syncCHMutation.isPending,
  };
}
