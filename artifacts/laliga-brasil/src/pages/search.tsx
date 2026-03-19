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
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialQuery = params.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: response, isLoading } = useListArticles({ search: debouncedQuery || undefined, limit: 20 });
  const articles = debouncedQuery ? (response?.articles || []) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-card border-b border-border py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Busca</h1>
            <div className="relative max-w-2xl">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar matérias, times, jogadores..."
                className="w-full bg-background border border-border rounded-xl pl-12 pr-12 py-4 text-white text-lg focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          {!debouncedQuery ? (
            <div className="text-center py-20 text-muted-foreground">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Digite algo para buscar</p>
              <p className="text-sm mt-2">Tente buscar por time, jogador ou tema</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">Nenhum resultado para "<strong className="text-white">{debouncedQuery}</strong>"</p>
              <p className="text-sm mt-2">Tente outros termos de busca</p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">{response?.total} resultado(s) para "<strong className="text-white">{debouncedQuery}</strong>"</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, idx) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <ArticleCard article={article} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
