import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminListArticles, useToggleHighlight } from "@/hooks/use-articles";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Star,
  StarOff,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Search,
  X,
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
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminListArticles({ limit: 200, status: "published" });
  const { data: allData } = useAdminListArticles({ limit: 200 });
  const toggleHighlight = useToggleHighlight();
  const { toast } = useToast();

  const allArticles = (allData?.articles ?? []) as any[];
  const published = (data?.articles ?? []) as any[];

  const featuredArticles = useMemo(
    () => allArticles.filter((a) => a.featured),
    [allArticles],
  );

  const publishedCount = useMemo(
    () => allArticles.filter((a) => a.status === "published").length,
    [allArticles],
  );

  const filteredPublished = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return published;
    return published.filter((a) =>
      [a.title, a.category, a.authorName, a.teamName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [published, search]);

  async function handleToggle(article: any) {
    setPendingId(article.id);
    try {
      await toggleHighlight.mutateAsync({ id: article.id, featured: !article.featured });
      toast({
        title: article.featured ? "Removido dos destaques" : "Adicionado aos destaques",
      });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message ?? "Não foi possível atualizar.",
        variant: "destructive",
      });
    } finally {
      setPendingId(null);
    }
  }

  const overFeaturedLimit = featuredArticles.length > MAX_FEATURED_RECOMMENDED;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-black mb-2">Destaques</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie quais artigos aparecem em destaque na homepage. Ative a estrela para
            colocar um artigo no carrossel principal.
          </p>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
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

        {/* Over-limit warning */}
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
                  Você tem {featuredArticles.length} artigos em destaque. A homepage fica
                  melhor com até {MAX_FEATURED_RECOMMENDED}. Considere remover os mais antigos.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active featured preview */}
        {featuredArticles.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-base sm:text-lg font-black mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-yellow-400" /> Em destaque agora
            </h2>
            <div className="space-y-2">
              {featuredArticles.map((a) => (
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
                      {a.category} · {a.authorName} · {formatDate(a.publishedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/noticias/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-white transition-colors flex-shrink-0"
                    title="Ver no site"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleToggle(a)}
                    disabled={pendingId === a.id}
                    className="p-1.5 text-yellow-400 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
                    title="Remover destaque"
                  >
                    {pendingId === a.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All published articles — toggle featured directly */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-3">
            <h2 className="font-display text-base sm:text-lg font-black flex items-center gap-2 whitespace-nowrap">
              <Star className="w-4 h-4 text-muted-foreground" /> Artigos publicados
            </h2>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar artigo..."
                className="w-full bg-card border border-border rounded-lg pl-8 pr-8 py-2 text-xs text-white focus:border-primary focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-card border border-border rounded-xl" />
              ))}
            </div>
          ) : filteredPublished.length === 0 ? (
            <p className="text-xs text-muted-foreground italic bg-card border border-dashed border-border rounded-xl p-6 text-center">
              {search ? `Nenhum artigo publicado encontrado para "${search}".` : "Nenhum artigo publicado ainda."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredPublished.map((a) => {
                const isPending = pendingId === a.id;
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${
                      a.featured
                        ? "bg-yellow-500/5 border-yellow-500/20"
                        : "bg-card border-border hover:border-border/80"
                    }`}
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
                        {a.category}
                        {a.authorName ? ` · ${a.authorName}` : ""}
                        {a.publishedAt ? ` · ${formatDate(a.publishedAt)}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/noticias/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-white transition-colors flex-shrink-0 hidden sm:flex"
                      title="Ver no site"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleToggle(a)}
                      disabled={isPending}
                      title={a.featured ? "Remover destaque" : "Marcar como destaque"}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-30 flex-shrink-0 ${
                        a.featured
                          ? "text-yellow-400 bg-yellow-500/10 hover:text-white"
                          : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"
                      }`}
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Star className={`w-4 h-4 ${a.featured ? "fill-current" : ""}`} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
