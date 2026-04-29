import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { useListArticles, useColumns } from "@/hooks/use-articles";
import { Search as SearchIcon, X, LayoutGrid, Newspaper, Mic } from "lucide-react";
import { motion } from "framer-motion";

type TabKey = "tudo" | "noticias" | "colunas";

export default function SearchPage() {
  const [location] = useLocation();

  const getInitialQuery = () => {
    if (typeof window !== "undefined" && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    }
    return "";
  };

  const [query, setQuery] = useState(getInitialQuery());
  const [debouncedQuery, setDebouncedQuery] = useState(getInitialQuery());
  const [tab, setTab] = useState<TabKey>("tudo");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setQuery(getInitialQuery());
    setDebouncedQuery(getInitialQuery());
  }, [location]);

  // Always fetch a window of recent items so the page can browse without typing
  const { data: articlesResp, isLoading: loadingArticles } = useListArticles({
    search: debouncedQuery || undefined,
    limit: 30,
  });
  const { data: columnsResp, isLoading: loadingColumns } = useColumns({ limit: 30 });

  const isLoading = loadingArticles || loadingColumns;

  const articles = articlesResp?.articles || [];
  const columns = columnsResp?.columns || [];

  // Normalize columns to ArticleCard shape and tag with kind="column"
  const normalizedColumns = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle ?? undefined,
        excerpt: c.excerpt,
        coverImage: c.coverImage ?? undefined,
        category: c.category,
        publishedAt: c.publishedAt,
        viewCount: c.viewCount,
        kind: "column" as const,
      })),
    [columns]
  );

  // Tag articles (the listArticles endpoint defaults to kind=article so they're already filtered)
  const taggedArticles = useMemo(
    () => articles.map((a) => ({ ...a, kind: "article" as const })),
    [articles]
  );

  // Filter columns by query when one is set
  const filteredColumns = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return normalizedColumns;
    return normalizedColumns.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.excerpt.toLowerCase().includes(q) ||
        (c.subtitle ?? "").toLowerCase().includes(q)
    );
  }, [normalizedColumns, debouncedQuery]);

  const items = useMemo(() => {
    if (tab === "noticias") return taggedArticles;
    if (tab === "colunas") return filteredColumns;
    const merged: any[] = [...taggedArticles, ...filteredColumns];
    return merged.sort((a, b) => {
      const aT = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bT = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bT - aT;
    });
  }, [tab, taggedArticles, filteredColumns]);

  const counts = {
    tudo: taggedArticles.length + filteredColumns.length,
    noticias: taggedArticles.length,
    colunas: filteredColumns.length,
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: "tudo", label: "Tudo", icon: LayoutGrid, count: counts.tudo },
    { key: "noticias", label: "Notícias", icon: Newspaper, count: counts.noticias },
    { key: "colunas", label: "Colunas", icon: Mic, count: counts.colunas },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow">
        <div className="container mx-auto px-4 pt-10 pb-4 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
            Busca
          </p>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar matérias, colunas, times..."
              className="w-full bg-card border border-border rounded-2xl pl-12 pr-12 py-4 text-white text-lg focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all shadow-lg"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {debouncedQuery && !isLoading && (
            <p className="text-sm text-muted-foreground mt-3">
              {items.length > 0 ? (
                <>
                  <span className="text-white font-semibold">{items.length}</span>{" "}
                  resultado{items.length !== 1 ? "s" : ""} para{" "}
                  <span className="text-white font-semibold">"{debouncedQuery}"</span>
                </>
              ) : (
                <>
                  Nenhum resultado para{" "}
                  <span className="text-white font-semibold">"{debouncedQuery}"</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4 max-w-3xl mt-4 mb-2">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 bg-card border border-border rounded-xl p-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        active ? "bg-white/20" : "bg-background border border-border"
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16 pt-4 max-w-5xl">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-10" />
              <p className="text-base">
                {tab === "colunas"
                  ? "Nenhuma coluna publicada ainda"
                  : tab === "noticias"
                  ? "Nenhuma notícia encontrada"
                  : "Nenhum conteúdo encontrado"}
              </p>
              {debouncedQuery && (
                <p className="text-sm mt-1 opacity-70">Tente outros termos de busca</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
              {items.map((item: any, idx: number) => (
                <motion.div
                  key={`${item.kind}-${item.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx, 12) * 0.04 }}
                  className="relative"
                >
                  {item.kind === "column" && (
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black shadow-md">
                      <Mic className="w-3 h-3" />
                      Coluna
                    </span>
                  )}
                  <ArticleCard article={item} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
