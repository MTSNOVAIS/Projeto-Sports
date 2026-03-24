import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminListArticles, useUpdateArticle } from "@/hooks/use-articles";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Flame, Star, StarOff, Search, AlertCircle, AlertCircleIcon, CheckCircle2 } from "lucide-react";

export default function AdminHighlights() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminListArticles({ limit: 100 });
  const updateArticle = useUpdateArticle();
  const { toast } = useToast();

  const articles = data?.articles || [];
  const filtered = articles.filter((a: any) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const featuredArticles = articles.filter((a: any) => a.featured);
  const breakingArticles = articles.filter((a: any) => a.breakingNews);

  async function toggleFeatured(article: any) {
    try {
      await updateArticle.mutateAsync({
        id: article.id,
        data: {
          featured: !article.featured,
          breakingNews: article.breakingNews,
          title: article.title,
          subtitle: article.subtitle,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          status: article.status,
          category: article.category,
          authorName: article.authorName,
        },
      });
      toast({ title: article.featured ? "Removido dos destaques" : "Artigo em destaque!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  async function toggleBreaking(article: any) {
    try {
      await updateArticle.mutateAsync({
        id: article.id,
        data: {
          featured: article.featured,
          breakingNews: !article.breakingNews,
          title: article.title,
          subtitle: article.subtitle,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          status: article.status,
          category: article.category,
          authorName: article.authorName,
        },
      });
      toast({ title: article.breakingNews ? "Removido das urgentes" : "Marcado como urgente!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black mb-2">Destaques</h1>
          <p className="text-muted-foreground">
            Controle quais artigos aparecem como destaque e notícias urgentes na homepage.
          </p>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-white">{featuredArticles.length}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Em Destaque</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-white">{breakingArticles.length}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Urgentes (Ticker)</p>
            </div>
          </div>
        </div>

        {/* Featured preview */}
        {featuredArticles.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-black mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-yellow-400" /> Artigos em Destaque
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredArticles.map((a: any) => (
                <div key={a.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                  {a.coverImage && (
                    <img src={a.coverImage} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white line-clamp-2">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.category}</p>
                  </div>
                  <button
                    onClick={() => toggleFeatured(a)}
                    className="p-1.5 text-yellow-400 hover:text-white transition-colors flex-shrink-0"
                    title="Remover destaque"
                  >
                    <StarOff className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & table */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-lg font-black">Todos os Artigos Publicados</h2>
            <div className="ml-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar artigos..."
                className="bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary focus:outline-none w-64"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-card border border-border rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.filter((a: any) => a.status === "published").map((article: any, idx: number) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-border/80 transition-colors"
                >
                  {article.coverImage && (
                    <img src={article.coverImage} alt="" className="w-12 h-9 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white line-clamp-1">{article.title}</p>
                    <p className="text-xs text-muted-foreground">{article.category}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleBreaking(article)}
                      title={article.breakingNews ? "Remover do ticker urgente" : "Marcar como urgente"}
                      className={`p-2 rounded-lg transition-colors ${
                        article.breakingNews
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      }`}
                    >
                      <AlertCircleIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleFeatured(article)}
                      title={article.featured ? "Remover destaque" : "Marcar como destaque"}
                      className={`p-2 rounded-lg transition-colors ${
                        article.featured
                          ? "text-yellow-400 bg-yellow-500/10"
                          : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"
                      }`}
                    >
                      {article.featured ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              ))}
              {filtered.filter((a: any) => a.status === "published").length === 0 && (
                <p className="text-muted-foreground text-center py-10">Nenhum artigo publicado encontrado.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
