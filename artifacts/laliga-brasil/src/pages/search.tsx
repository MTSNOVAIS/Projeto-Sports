import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { useListArticles } from "@/hooks/use-articles";
import { Search as SearchIcon, X } from "lucide-react";
import { motion } from "framer-motion";

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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setQuery(getInitialQuery());
    setDebouncedQuery(getInitialQuery());
  }, [location]);

  const { data: response, isLoading } = useListArticles({
    search: debouncedQuery || undefined,
    limit: 20,
  });
  const articles = debouncedQuery ? response?.articles || [] : [];

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
              placeholder="Buscar matérias, times, jogadores..."
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
              {articles.length > 0 ? (
                <>
                  <span className="text-white font-semibold">{response?.total}</span>{" "}
                  resultado{(response?.total ?? 0) !== 1 ? "s" : ""} para{" "}
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

        <div className="container mx-auto px-4 pb-16 max-w-5xl">
          {!debouncedQuery ? (
            <div className="text-center py-24 text-muted-foreground">
              <SearchIcon className="w-14 h-14 mx-auto mb-4 opacity-10" />
              <p className="text-base">Digite algo para buscar</p>
              <p className="text-sm mt-1 opacity-70">
                Tente buscar por time, jogador ou tema
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-10" />
              <p className="text-base">Nenhum resultado encontrado</p>
              <p className="text-sm mt-1 opacity-70">Tente outros termos de busca</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
              {articles.map((article, idx) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <ArticleCard article={article} />
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
