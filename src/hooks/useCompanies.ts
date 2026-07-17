import { useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateCompanyCHStatus, bulkSyncCompaniesHouse } from "@/lib/companies.functions";
import { safeDbError } from "@/lib/safeError";
import type { Company, Director } from "@/types";

async function fetchCompaniesDirect(): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*, director:directors(*)")
    .order("created_at", { ascending: false });
  if (error) throw safeDbError(error, "Failed to load companies.");
  return (data ?? []) as unknown as Company[];
}

async function fetchDirectorsDirect(): Promise<Director[]> {
  const { data, error } = await supabase
    .from("directors")
    .select("*")
    .order("name");
  if (error) throw safeDbError(error, "Failed to load directors.");
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

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("companies")
        .update(updates as never)
        .eq("id", id);
      if (error) throw safeDbError(error, "Failed to update company.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw safeDbError(error, "Failed to delete company.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markSoldMutation = useMutation({
    mutationFn: async (id: string) => {
      // status & updated_at are derived by DB trigger from availability_status.
      const { error } = await supabase
        .from("companies")
        .update({ availability_status: "sold" } as never)
        .eq("id", id);
      if (error) throw safeDbError(error, "Failed to update status.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Marked as Sold/Transferred");
    },
    onError: (e: Error) => toast.error(e.message),
  });




  const createDirectorMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("directors")
        .insert({ name, is_owner: true })
        .select()
        .single();
      if (error) throw safeDbError(error, "Failed to add director.");
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
      if (error) throw safeDbError(error, "Failed to verify director.");
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
      if (error) throw safeDbError(error, "Failed to add company.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncCHMutation = useMutation({
    mutationFn: syncCHFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Companies House sync completed");
    },
    onError: () => toast.error("Failed to sync with Companies House."),
  });

  const bulkSyncMutation = useMutation({
    mutationFn: async () => bulkSyncFn(),
    onSuccess: (res: { results: Array<{ success: boolean }>; total: number }) => {
      const ok = res.results.filter((r) => r.success).length;
      const failed = res.total - ok;
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      if (failed === 0) {
        toast.success(`Synced all ${ok} companies with Companies House`);
      } else {
        toast.warning(`Synced ${ok} of ${res.total} companies (${failed} failed)`);
      }
    },
    onError: () => toast.error("Bulk sync failed."),
  });

  return {
    companies: (companiesQuery.data ?? []) as Company[],
    directors: (directorsQuery.data ?? []) as Director[],
    loading: companiesQuery.isLoading || directorsQuery.isLoading,
    markAsSold: (id: string) => markSoldMutation.mutate(id),
    markAd01Filed: (id: string) => markAd01Mutation.mutate(id),
    markAd01Complete: (id: string) => markAd01CompleteMutation.mutate(id),

    syncCompanyCH: (id: string, companyNumber: string) =>
      syncCHMutation.mutate({ data: { id, companyNumber } }),
    syncAllCH: () => bulkSyncMutation.mutate(),
    createDirector: (name: string) => createDirectorMutation.mutate(name),
    verifyDirector: (directorId: string) => verifyDirectorMutation.mutate(directorId),
    updateCompany: (id: string, updates: Record<string, unknown>) =>
      updateCompanyMutation.mutate({ id, updates }),
    deleteCompany: (id: string) => deleteCompanyMutation.mutate(id),
    createCompany: (company: Partial<Company>) => createCompanyMutation.mutateAsync(company),
    refresh: invalidate,
    isSyncing: syncCHMutation.isPending,
    isBulkSyncing: bulkSyncMutation.isPending,
  };
}
