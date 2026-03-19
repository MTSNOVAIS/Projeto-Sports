import React from "react";
import { useRoute, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { useListArticles } from "@/hooks/use-articles";
import { Tag, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORY_LABELS: Record<string, string> = {
  "la-liga": "La Liga",
  "transferencias": "Transferências",
  "resultados": "Resultados",
  "analise": "Análise",
  "entrevista": "Entrevista",
  "internacional": "Internacional",
};

export default function CategoryPage() {
  const [, params] = useRoute("/categoria/:category");
  const categorySlug = params?.category || "";
  const categoryName = CATEGORY_LABELS[categorySlug] || categorySlug;
  const { data: response, isLoading } = useListArticles({ category: categoryName, limit: 20 });
  const articles = response?.articles || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-card border-b border-border py-10">
          <div className="container mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white text-sm mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Início
            </Link>
            <div className="flex items-center gap-3">
              <Tag className="text-primary w-6 h-6" />
              <h1 className="text-3xl font-black uppercase tracking-tight text-white">{categoryName}</h1>
            </div>
            <p className="text-muted-foreground mt-1">{response?.total || 0} matérias nesta categoria</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          {isLoading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma matéria nesta categoria ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, idx) => (
                <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
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
