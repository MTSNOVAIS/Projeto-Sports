import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useListArticles,
  useGetArticle,
  useAdminListArticles,
  useAdminGetArticle,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  usePublishArticle,
  useScheduleArticle,
} from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export {
  useListArticles,
  useGetArticle,
  useAdminListArticles,
  useAdminGetArticle,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  usePublishArticle,
  useScheduleArticle,
};

export interface HighlightToggleResponse {
  id: number;
  featured: boolean;
  breakingNews: boolean;
  updatedAt: string;
}

/**
 * Lightweight toggle for the featured / breakingNews flags.
 * Sends only what changed and invalidates the article queries on success.
 */
export function useToggleHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: number;
      featured?: boolean;
      breakingNews?: boolean;
    }): Promise<HighlightToggleResponse> => {
      const { id, ...body } = vars;
      const res = await fetch(`${BASE}/api/admin/articles/${id}/highlights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Falha ao atualizar destaque (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/admin/articles"] });
    },
  });
}

/**
 * Reverts a published or scheduled article back to draft.
 */
export function useUnpublishArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/admin/articles/${id}/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Falha ao despublicar (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/admin/articles"] });
    },
  });
}

export interface SiteAccount {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Returns the list of accounts registered on the site (used as
 * selectable co-authors in the article editor).
 */
export function useSiteAccounts() {
  return useQuery({
    queryKey: ["/users"],
    queryFn: async (): Promise<SiteAccount[]> => {
      const res = await fetch(`${BASE}/api/users`);
      if (!res.ok) throw new Error("Falha ao carregar contas");
      return res.json();
    },
    staleTime: 60_000,
  });
}
