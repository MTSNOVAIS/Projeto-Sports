import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { usePublicColumnists, useColumns, type PublicColumnist, type ColumnSummary } from "@/hooks/use-articles";
import { Mic, Twitter, Search, X, Eye, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ColunistasIndexPage() {
  const { data: columnists = [], isLoading } = usePublicColumnists();
  const { data: columnsData, isLoading: loadingColumns } = useColumns({ limit: 6 });

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return columnists;
    return columnists.filter((c) => {
      return (
        c.name.toLowerCase().includes(term) ||
        (c.title ?? "").toLowerCase().includes(term) ||
        (c.bio ?? "").toLowerCase().includes(term) ||
        (c.twitter ?? "").toLowerCase().includes(term)
      );
    });
  }, [columnists, search]);

  const recentColumns = columnsData?.columns ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* HEADER (mesmo estilo da página de Clubes) */}
        <div className="bg-card border-b border-border py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Mic className="text-primary w-6 h-6" />
              <h1 className="text-4xl font-bold uppercase tracking-tight text-white">
                Colunistas
              </h1>
            </div>
            <p className="text-muted-foreground">
              Vozes da redação que cobrem o futebol espanhol todos os dias
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          {/* Barra de busca */}
          <div className="mb-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar colunista por nome, especialidade ou time..."
                className="w-full bg-card border border-border rounded-full pl-11 pr-11 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {search && !isLoading && (
              <p className="text-xs text-muted-foreground mt-2 px-1">
                {filtered.length === 0
                  ? "Nenhum colunista encontrado"
                  : `${filtered.length} ${filtered.length === 1 ? "colunista encontrado" : "colunistas encontrados"}`}
              </p>
            )}
          </div>

          {/* Grid de colunistas */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasSearch={!!search.trim()} />
          ) : (
            <ColumnistGrid columnists={filtered} />
          )}

          {/* Últimas colunas */}
          {!loadingColumns && recentColumns.length > 0 && !search && (
            <div className="mt-16 pt-10 border-t border-border">
              <div className="flex items-end justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Mic className="text-primary w-5 h-5" />
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                    Últimas colunas
                  </h2>
                </div>
                <Link
                  href="/busca"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Ver mais <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentColumns.map((col) => (
                  <ColumnPreviewCard key={col.id} column={col} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// -------- Sub-components --------

function ColumnistGrid({ columnists }: { columnists: PublicColumnist[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {columnists.map((c, idx) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(idx * 0.03, 0.3) }}
        >
          <Link
            href={c.slug ? `/colunistas/${c.slug}` : "#"}
            className="group block bg-card border border-border hover:border-primary/50 rounded-xl p-5 text-center transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full"
          >
            <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-background border-2 border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors">
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-2xl font-display font-black text-muted-foreground">
                  {c.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors leading-tight">
              {c.name}
            </h3>
            {c.title && (
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1 line-clamp-2">
                {c.title}
              </p>
            )}
            {c.twitter && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Twitter className="w-3 h-3" /> @{c.twitter}
              </p>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function ColumnPreviewCard({ column }: { column: ColumnSummary }) {
  return (
    <Link
      href={`/noticias/${column.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
    >
      {column.coverImage && (
        <div className="aspect-video overflow-hidden bg-background">
          <img
            src={column.coverImage}
            alt={column.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {column.category}
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Mic className="w-3 h-3" /> Coluna
          </span>
        </div>
        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {column.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {column.excerpt}
        </p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-background border border-border flex-shrink-0 flex items-center justify-center">
              {column.authorAvatarUrl ? (
                <img
                  src={column.authorAvatarUrl}
                  alt={column.authorName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground">
                  {column.authorName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-white truncate">
              {column.authorName}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-shrink-0">
            {column.publishedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {format(parseISO(column.publishedAt), "dd MMM", { locale: ptBR })}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" />
              {column.viewCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <Mic className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p>
        {hasSearch
          ? "Nenhum colunista corresponde à sua busca."
          : "Nenhum colunista cadastrado ainda."}
      </p>
    </div>
  );
}
