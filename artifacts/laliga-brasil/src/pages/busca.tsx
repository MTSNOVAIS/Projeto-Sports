import React, { useState, useMemo } from "react";
import { useListArticles } from "@/hooks/use-articles";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function BuscaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: response, isLoading } = useListArticles({ limit: 100 });
  const articles = response?.articles || [];

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    
    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          {/* Search Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-2">
              Buscar <span className="text-primary">Notícias</span>
            </h1>
            <p className="text-muted-foreground">Encontre as melhores notícias sobre La Liga</p>
          </div>

          {/* Search Input */}
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por título, autor ou conteúdo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 md:py-4 border border-border/50 rounded-xl bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                autoFocus
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {filteredArticles.length} resultado{filteredArticles.length !== 1 ? 's' : ''} encontrado{filteredArticles.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredArticles.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {filteredArticles.map((article, idx) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma notícia encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery ? `Não encontramos artigos com "${searchQuery}"` : "Digite algo para começar a buscar"}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
