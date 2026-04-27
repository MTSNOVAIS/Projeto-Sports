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

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  isColumnist: boolean;
  columnistSlug: string | null;
  columnistTitle: string | null;
  bio: string | null;
  avatarUrl: string | null;
  twitter: string | null;
  createdAt?: string;
}

export function useAdminAccounts() {
  return useQuery({
    queryKey: ["/admin/accounts"],
    queryFn: async (): Promise<AdminAccount[]> => {
      const res = await fetch(`${BASE}/api/admin/accounts`);
      if (!res.ok) throw new Error("Falha ao carregar contas");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export interface UpdateAccountVars {
  id: string;
  isColumnist?: boolean;
  columnistSlug?: string | null;
  columnistTitle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  twitter?: string | null;
  active?: boolean;
}

export interface PublicColumnist {
  id: string;
  name: string;
  slug: string | null;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  twitter: string | null;
}

export function usePublicColumnists() {
  return useQuery({
    queryKey: ["/columnists"],
    queryFn: async (): Promise<PublicColumnist[]> => {
      const res = await fetch(`${BASE}/api/columnists`);
      if (!res.ok) throw new Error("Falha ao carregar colunistas");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export interface ColumnSummary {
  id: number;
  title: string;
  slug: string;
  subtitle?: string | null;
  excerpt: string;
  coverImage?: string | null;
  category: string;
  authorName: string;
  authorId?: number | null;
  authorSlug?: string | null;
  authorAvatarUrl?: string | null;
  publishedAt: string | null;
  viewCount: number;
}

export interface ColumnsListResponse {
  columns: ColumnSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useColumns(params: { authorId?: number; limit?: number } = {}) {
  const { authorId, limit } = params;
  const search = new URLSearchParams();
  if (authorId) search.set("authorId", String(authorId));
  if (limit) search.set("limit", String(limit));
  const qs = search.toString();
  return useQuery({
    queryKey: ["/columns", { authorId, limit }],
    queryFn: async (): Promise<ColumnsListResponse> => {
      const res = await fetch(`${BASE}/api/columns${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar colunas");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export interface ColumnistDetailResponse {
  columnist: PublicColumnist;
  columns: ColumnSummary[];
}

export function useColumnistBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["/columnists", slug],
    enabled: !!slug,
    queryFn: async (): Promise<ColumnistDetailResponse> => {
      const res = await fetch(`${BASE}/api/columnists/${slug}`);
      if (!res.ok) throw new Error("Colunista não encontrado");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: UpdateAccountVars): Promise<AdminAccount> => {
      const { id, ...body } = vars;
      const res = await fetch(`${BASE}/api/admin/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Falha ao atualizar conta");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/users"] });
      queryClient.invalidateQueries({ queryKey: ["/columnists"] });
    },
  });
}
