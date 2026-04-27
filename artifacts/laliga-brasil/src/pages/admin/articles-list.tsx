import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useAdminListArticles,
  useDeleteArticle,
  useToggleHighlight,
} from "@/hooks/use-articles";
import {
  Search,
  Plus,
  Edit3,
  ExternalLink,
  Trash2,
  Star,
  AlertCircleIcon,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";

type StatusFilter = "todos" | "published" | "draft" | "scheduled";

const STATUS_LABEL: Record<StatusFilter, string> = {
  todos: "Todos",
  published: "Publicados",
  draft: "Rascunhos",
  scheduled: "Agendados",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  published: {
    label: "Publicado",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  draft: {
    label: "Rascunho",
    className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  },
  scheduled: {
    label: "Agendado",
    className: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
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

export default function AdminArticlesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pendingKind, setPendingKind] = useState<"featured" | "breaking" | null>(null);

  const { data, isLoading, refetch } = useAdminListArticles({ limit: 100 });
  const deleteMutation = useDeleteArticle();
  const toggleHighlight = useToggleHighlight();
  const { toast } = useToast();

  const articles = (data?.articles ?? []) as any[];

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

  async function handleDelete(id: number) {
    if (
      !confirm("Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.")
    )
      return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Sucesso", description: "Artigo excluído com sucesso." });
      refetch();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao excluir artigo.",
        variant: "destructive",
      });
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>{" "}
              <span>/</span> <span className="text-white">Artigos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Gerenciar Artigos
            </h1>
          </div>
          <Link
            href="/dashboard/artigos/new"
            className="bg-primary hover:bg-accent text-white px-4 sm:px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20 text-sm"
          >
            <Plus className="w-4 h-4" /> Escrever Novo
          </Link>
        </header>

        {/* Filter + search bar */}
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 mb-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, time, categoria..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5 overflow-x-auto">
            {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === key
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {STATUS_LABEL[key]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-card border border-border rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-10 bg-card border border-dashed border-border rounded-xl text-sm">
            Nenhum artigo encontrado{search ? ` para "${search}"` : ""}.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((article: any) => {
              const badge = STATUS_BADGE[article.status] ?? STATUS_BADGE.draft;
              const isFeatPending = pendingId === article.id && pendingKind === "featured";
              const isBreakPending = pendingId === article.id && pendingKind === "breaking";
              const canHighlight = article.status === "published";

              return (
                <div
                  key={article.id}
                  className="flex items-start sm:items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-border/80 transition-colors"
                >
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt=""
                      className="w-14 h-14 sm:w-16 sm:h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-12 bg-muted rounded-lg flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white line-clamp-2 sm:line-clamp-1">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {article.category}
                        {article.teamName ? ` · ${article.teamName}` : ""}
                      </span>
                      {article.publishedAt && (
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">
                          · {formatDate(article.publishedAt)}
                        </span>
                      )}
                    </div>

                    {/* Mobile: stacked actions row */}
                    <div className="flex sm:hidden items-center gap-1 mt-2 -ml-1">
                      {article.status === "published" && (
                        <Link
                          href={`/noticias/${article.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-muted transition-colors"
                          title="Ver no site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleToggle(article, "breaking")}
                        disabled={!canHighlight || isBreakPending}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                          article.breakingNews
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground"
                        }`}
                        title="Urgente"
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
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                          article.featured
                            ? "text-yellow-400 bg-yellow-500/10"
                            : "text-muted-foreground"
                        }`}
                        title="Destaque"
                      >
                        {isFeatPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Star
                            className={`w-4 h-4 ${article.featured ? "fill-current" : ""}`}
                          />
                        )}
                      </button>
                      <Link
                        href={`/dashboard/artigos/${article.id}/editar`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop: inline actions */}
                  <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
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
                      ) : (
                        <Star
                          className={`w-4 h-4 ${article.featured ? "fill-current" : ""}`}
                        />
                      )}
                    </button>
                    <Link
                      href={`/dashboard/artigos/${article.id}/editar`}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
