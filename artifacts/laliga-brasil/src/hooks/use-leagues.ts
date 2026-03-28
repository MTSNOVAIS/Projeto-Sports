import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useLeagues() {
  return useQuery({
    queryKey: ["leagues"],
    queryFn: () => apiFetch<any[]>("/api/leagues"),
  });
}

export function useAdminLeagues() {
  return useQuery({
    queryKey: ["admin", "leagues"],
    queryFn: () => apiFetch<any[]>("/api/admin/leagues"),
  });
}

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch<any>("/api/admin/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leagues"] }),
  });
}

export function useUpdateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch<any>(`/api/admin/leagues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "leagues"] });
      qc.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<any>(`/api/admin/leagues/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leagues"] }),
  });
}
