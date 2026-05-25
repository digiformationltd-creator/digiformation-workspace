import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getCompanies,
  getDirectors,
  markAsSold,
  markAd01Filed,
  updateCompanyCHStatus,
  createDirector,
  verifyDirector,
  updateCompany,
  deleteCompany,
} from "@/lib/companies.functions";
import type { Company, Director } from "@/types";

export function useCompanies() {
  const queryClient = useQueryClient();
  const fetchCompanies = useServerFn(getCompanies);
  const fetchDirectors = useServerFn(getDirectors);
  const markSoldFn = useServerFn(markAsSold);
  const markAd01Fn = useServerFn(markAd01Filed);
  const syncCHFn = useServerFn(updateCompanyCHStatus);
  const createDirectorFn = useServerFn(createDirector);
  const verifyDirectorFn = useServerFn(verifyDirector);
  const updateCompanyFn = useServerFn(updateCompany);
  const deleteCompanyFn = useServerFn(deleteCompany);

  const companiesQuery = useQuery({
    queryKey: ["companies"],
    queryFn: () => fetchCompanies(),
  });

  const directorsQuery = useQuery({
    queryKey: ["directors"],
    queryFn: () => fetchDirectors(),
  });

  const markSoldMutation = useMutation({
    mutationFn: markSoldFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Marked as Sold/Transferred");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const markAd01Mutation = useMutation({
    mutationFn: markAd01Fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("AD01 filing recorded");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record AD01 filing");
    },
  });

  const syncCHMutation = useMutation({
    mutationFn: syncCHFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Companies House sync completed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to sync with Companies House");
    },
  });

  const createDirectorMutation = useMutation({
    mutationFn: createDirectorFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directors"] });
      toast.success("Director added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add director");
    },
  });

  const verifyDirectorMutation = useMutation({
    mutationFn: verifyDirectorFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directors"] });
      toast.success("Director verified");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to verify director");
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: updateCompanyFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update company");
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: deleteCompanyFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete company");
    },
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    queryClient.invalidateQueries({ queryKey: ["directors"] });
  }, [queryClient]);

  return {
    companies: (companiesQuery.data?.companies ?? []) as Company[],
    directors: (directorsQuery.data?.directors ?? []) as Director[],
    loading: companiesQuery.isLoading || directorsQuery.isLoading,
    markAsSold: markSoldMutation.mutate,
    markAd01Filed: markAd01Mutation.mutate,
    syncCompanyCH: syncCHMutation.mutate,
    createDirector: createDirectorMutation.mutate,
    verifyDirector: verifyDirectorMutation.mutate,
    updateCompany: updateCompanyMutation.mutate,
    deleteCompany: deleteCompanyMutation.mutate,
    refresh,
    isSyncing: syncCHMutation.isPending,
  };
}
