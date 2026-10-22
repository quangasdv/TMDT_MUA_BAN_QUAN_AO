"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminStatsApi } from "../api/admin.api";
import { useAuthStore } from "@/stores/auth.store";

export function useAdminStats() {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const {
    data: statsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStatsApi,
    enabled: isAdmin,
    staleTime: 15 * 1000,
  });

  return {
    stats: statsResponse?.data?.stats || null,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

