import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: () => apiFetch<any[]>("/api/matches"),
  });
}

export function useFeaturedMatch() {
  return useQuery({
    queryKey: ["matches", "featured"],
    queryFn: () => apiFetch<any>("/api/matches/featured"),
  });
}

export function useAdminMatches() {
  return useQuery({
    queryKey: ["admin", "matches"],
    queryFn: () => apiFetch<any[]>("/api/admin/matches"),
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch<any>("/api/admin/matches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "matches"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch<any>(`/api/admin/matches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "matches"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<any>(`/api/admin/matches/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "matches"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useBulkImportMatches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (events: any[]) => apiFetch<any>("/api/admin/matches/bulk", {
      method: "POST",
      body: JSON.stringify({ events }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "matches"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
