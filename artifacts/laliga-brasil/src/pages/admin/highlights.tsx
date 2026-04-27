import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminListArticles, useToggleHighlight } from "@/hooks/use-articles";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  StarOff,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ListPlus,
} from "lucide-react";

const MAX_FEATURED_RECOMMENDED = 4;

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default function AdminHighlights() {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pendingKind, setPendingKind] = useState<"featured" | "breaking" | null>(null);

  const { data, isLoading } = useAdminListArticles({ limit: 100 });
  const toggleHighlight = useToggleHighlight();
  const { toast } = useToast();

  const articles = (data?.articles ?? []) as any[];

  const featuredArticles = useMemo(
    () => articles.filter((a) => a.featured),
    [articles],
  );
  const breakingArticles = useMemo(
    () => articles.filter((a) => a.breakingNews),
    [articles],
  );
  const publishedCount = useMemo(
    () => articles.filter((a) => a.status === "published").length,
    [articles],
  );

  async function handleToggle(article: any, kind: "featured" | "breaking") {
    setPendingId(article.id);
    setPendingKind(kind);
    try {
      const payload =
        kind === "featured"
          ? { id: article.id, featured: !article.featured }
          : { id: article.id, breakingNews: !article.breakingNews };
      await toggleHighlight.mutateAsync(payload);
      toast({
        title:
          kind === "featured"
            ? "Removido dos destaques"
            : "Removido do ticker urgente",
      });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message ?? "Não foi possível atualizar.",
        variant: "destructive",
      });
    } finally {
      setPendingId(null);
      setPendingKind(null);
    }
  }

  const overFeaturedLimit = featuredArticles.length > MAX_FEATURED_RECOMMENDED;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-black mb-2">Destaques</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Acompanhe quais artigos estão em destaque na homepage e quais entram no ticker
            de notícias urgentes.
          </p>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-display font-black text-white leading-none">
                {featuredArticles.length}
                <span className="text-sm font-bold text-muted-foreground ml-1">
                  / {MAX_FEATURED_RECOMMENDED} sugeridos
                </span>
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                Em Destaque
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-white leading-none">
                {breakingArticles.length}
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                No Ticker Urgente
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-white leading-none">
                {publishedCount}
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                Publicados
              </p>
            </div>
          </div>
        </div>

        {/* Manage articles CTA */}
        <Link
          href="/dashboard/artigos"
          className="block mb-6 bg-primary/5 hover:bg-primary/10 border border-primary/30 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <ListPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Gerenciar destaques nos artigos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Os controles para marcar/desmarcar destaque e urgente agora ficam direto na
                lista de artigos.
              </p>
            </div>
            <span className="text-primary text-xs font-bold uppercase tracking-wider hidden sm:inline">
              Ir para artigos →
            </span>
          </div>
        </Link>

        {/* Recommendation warning */}
        <AnimatePresence>
          {overFeaturedLimit && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-yellow-300">Muitos destaques ativos</p>
                <p className="text-yellow-200/80 text-xs mt-0.5">
                  Você tem {featuredArticles.length} artigos em destaque. A homepage costuma
                  ficar melhor com até {MAX_FEATURED_RECOMMENDED}. Considere remover os mais
                  antigos.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two preview columns */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-card border border-border rounded-xl" />
              ))}
            </div>
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-card border border-border rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured preview */}
            <div>
              <h2 className="font-display text-base sm:text-lg font-black mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-yellow-400" /> Em Destaque na Homepage
              </h2>
              <div className="space-y-2 min-h-[80px]">
                {featuredArticles.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-card border border-dashed border-border rounded-xl p-4 text-center">
                    Nenhum artigo em destaque. Marque com a estrela na lista de artigos.
                  </p>
                ) : (
                  featuredArticles.map((a) => (
                    <div
                      key={a.id}
                      className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3"
                    >
                      {a.coverImage ? (
                        <img
                          src={a.coverImage}
                          alt=""
                          className="w-14 h-10 object-cover rounded-md flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-10 bg-muted rounded-md flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white line-clamp-1">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.category} · {formatDate(a.publishedAt)}
                        </p>
                      </div>
                      {a.status === "published" && (
                        <Link
                          href={`/noticias/${a.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-muted-foreground hover:text-white transition-colors flex-shrink-0"
                          title="Ver no site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleToggle(a, "featured")}
                        disabled={pendingId === a.id && pendingKind === "featured"}
                        className="p-1.5 text-yellow-400 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
                        title="Remover destaque"
                      >
                        {pendingId === a.id && pendingKind === "featured" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Breaking preview */}
            <div>
              <h2 className="font-display text-base sm:text-lg font-black mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" /> Ticker de Notícias Urgentes
              </h2>
              <div className="space-y-2 min-h-[80px]">
                {breakingArticles.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-card border border-dashed border-border rounded-xl p-4 text-center">
                    Nenhum artigo no ticker. Marque com o ícone de alerta na lista de artigos.
                  </p>
                ) : (
                  breakingArticles.map((a) => (
                    <div
                      key={a.id}
                      className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white line-clamp-1">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(a.publishedAt)}
                        </p>
                      </div>
                      {a.status === "published" && (
                        <Link
                          href={`/noticias/${a.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-muted-foreground hover:text-white transition-colors flex-shrink-0"
                          title="Ver no site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleToggle(a, "breaking")}
                        disabled={pendingId === a.id && pendingKind === "breaking"}
                        className="p-1.5 text-primary hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
                        title="Remover do ticker"
                      >
                        {pendingId === a.id && pendingKind === "breaking" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
