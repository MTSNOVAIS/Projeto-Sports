import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface HomepageSettings {
  id: number;
  showFeatured: boolean;
  maxFeatured: number;
  featuredTitle: string;
  showColunas: boolean;
  colunasTitle: string;
  showLatest: boolean;
  maxLatest: number;
  latestTitle: string;
  latestColumns: number;
  showSidebarMatch: boolean;
  sidebarMatchTitle: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementColor: string;
  announcementLink: string | null;
  showCategorySection: boolean;
  categorySection: string;
  categorySectionTitle: string;
  maxCategorySection: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

const DEFAULT_SETTINGS: HomepageSettings = {
  id: 0,
  showFeatured: true,
  maxFeatured: 3,
  featuredTitle: "Destaques",
  showColunas: true,
  colunasTitle: "Colunas",
  showLatest: true,
  maxLatest: 6,
  latestTitle: "Últimas Notícias",
  latestColumns: 2,
  showSidebarMatch: true,
  sidebarMatchTitle: "Partida em Destaque",
  announcementEnabled: false,
  announcementText: "",
  announcementColor: "primary",
  announcementLink: null,
  showCategorySection: false,
  categorySection: "",
  categorySectionTitle: "Destaque da Categoria",
  maxCategorySection: 4,
  seoTitle: null,
  seoDescription: null,
  updatedAt: new Date().toISOString(),
};

export function useHomepageSettings() {
  return useQuery<HomepageSettings>({
    queryKey: ["homepage-settings"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/homepage-settings`);
      if (!res.ok) return DEFAULT_SETTINGS;
      return res.json();
    },
    staleTime: 60_000,
    placeholderData: DEFAULT_SETTINGS,
  });
}

export function useUpdateHomepageSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<HomepageSettings>) => {
      const res = await fetch(`${BASE}/api/admin/homepage-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Falha ao salvar configurações");
      }
      return res.json() as Promise<HomepageSettings>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["homepage-settings"], data);
    },
  });
}
