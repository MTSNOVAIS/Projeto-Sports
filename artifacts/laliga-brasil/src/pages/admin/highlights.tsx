import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminListArticles } from "@/hooks/use-articles";
import { useToggleHighlight } from "@/hooks/use-articles";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Star,
  StarOff,
  Search,
  AlertCircle,
  AlertCircleIcon,
  AlertTriangle,
  ExternalLink,
  Eye,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const MAX_FEATURED_RECOMMENDED = 4;

type StatusFilter = "todos" | "published" | "draft" | "scheduled";

const STATUS_LABEL: Record<StatusFilter, string> = {
  todos: "Todos",
  published: "Publicados",
  draft: "Rascunhos",
  scheduled: "Agendados",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  published: { label: "Publicado", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  draft: { label: "Rascunho", className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  scheduled: { label: "Agendado", className: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
};

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("published");
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (statusFilter !== "todos" && a.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [a.title, a.subtitle, a.category, a.teamName, a.authorName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [articles, search, statusFilter]);

  async function handleToggle(article: any, kind: "featured" | "breaking") {
    setPendingId(article.id);
    setPendingKind(kind);
    try {
      const payload =
        kind === "featured"
          ? { id: article.id, featured: !article.featured }
          : { id: article.id, breakingNews: !article.breakingNews };
      await toggleHighlight.mutateAsync(payload);
      const onNow = kind === "featured" ? !article.featured : !article.breakingNews;
      toast({
        title:
          kind === "featured"
            ? onNow
              ? "Adicionado aos destaques"
              : "Removido dos destaques"
            : onNow
              ? "Marcado como urgente"
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black mb-2">Destaques</h1>
          <p className="text-muted-foreground">
            Controle quais artigos aparecem como destaque na homepage e quais entram no ticker de notícias urgentes.
          </p>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
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
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
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
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-black text-white leading-none">
                {articles.filter((a) => a.status === "published").length}
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                Publicados
              </p>
            </div>
          </div>
        </div>

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
                  Você tem {featuredArticles.length} artigos em destaque. A homepage costuma ficar
                  melhor com até {MAX_FEATURED_RECOMMENDED}. Considere remover os mais antigos.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two preview columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Featured preview */}
          <div>
            <h2 className="font-display text-lg font-black mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-yellow-400" /> Em Destaque na Homepage
            </h2>
            <div className="space-y-2 min-h-[80px]">
              {featuredArticles.length === 0 ? (
                <p className="text-xs text-muted-foreground italic bg-card border border-dashed border-border rounded-xl p-4 text-center">
                  Nenhum artigo em destaque. Marque com a estrela abaixo.
                </p>
              ) : (
                featuredArticles.map((a) => (
                  <div
                    key={a.id}
                    className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3"
                  >
                    {a.coverImage ? (
                      <img src={a.coverImage} alt="" className="w-14 h-10 object-cover rounded-md flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-10 bg-muted rounded-md flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white line-clamp-1">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.category} · {formatDate(a.publishedAt)}</p>
                    </div>
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
            <h2 className="font-display text-lg font-black mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" /> Ticker de Notícias Urgentes
            </h2>
            <div className="space-y-2 min-h-[80px]">
              {breakingArticles.length === 0 ? (
                <p className="text-xs text-muted-foreground italic bg-card border border-dashed border-border rounded-xl p-4 text-center">
                  Nenhum artigo no ticker. Marque com o ícone de alerta abaixo.
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
                      <p className="text-xs text-muted-foreground">{formatDate(a.publishedAt)}</p>
                    </div>
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

        {/* Search & filters & list */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="font-display text-lg font-black">Gerenciar Artigos</h2>
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
              {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${
                    statusFilter === key
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {STATUS_LABEL[key]}
                </button>
              ))}
            </div>
            <div className="sm:ml-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, time, categoria..."
                className="bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary focus:outline-none w-full sm:w-80"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-card border border-border rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 bg-card border border-dashed border-border rounded-xl">
              Nenhum artigo encontrado{search ? ` para "${search}"` : ""}.
            </p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((article: any) => {
                const badge = STATUS_BADGE[article.status] ?? STATUS_BADGE.draft;
                const isFeatPending = pendingId === article.id && pendingKind === "featured";
                const isBreakPending = pendingId === article.id && pendingKind === "breaking";
                const canHighlight = article.status === "published";

                return (
                  <div
                    key={article.id}
                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-border/80 transition-colors"
                  >
                    {article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt=""
                        className="w-14 h-11 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-11 bg-muted rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white line-clamp-1">{article.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.className}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {article.category}
                          {article.teamName ? ` · ${article.teamName}` : ""}
                        </span>
                        {article.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            · {formatDate(article.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {article.status === "published" && (
                        <Link
                          href={`/noticias/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-muted transition-colors"
                          title="Visualizar no site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}

                      <button
                        onClick={() => handleToggle(article, "breaking")}
                        disabled={!canHighlight || isBreakPending}
                        title={
                          !canHighlight
                            ? "Apenas artigos publicados podem ir para o ticker"
                            : article.breakingNews
                              ? "Remover do ticker urgente"
                              : "Marcar como urgente"
                        }
                        className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          article.breakingNews
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                      >
                        {isBreakPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <AlertCircleIcon className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleToggle(article, "featured")}
                        disabled={!canHighlight || isFeatPending}
                        title={
                          !canHighlight
                            ? "Apenas artigos publicados podem ser destacados"
                            : article.featured
                              ? "Remover destaque"
                              : "Marcar como destaque"
                        }
                        className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          article.featured
                            ? "text-yellow-400 bg-yellow-500/10"
                            : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"
                        }`}
                      >
                        {isFeatPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : article.featured ? (
                          <Star className="w-4 h-4 fill-current" />
                        ) : (
                          <Star className="w-4 h-4" />
                        )}
                      </button>
                    </div>
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
