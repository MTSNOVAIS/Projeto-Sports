import React from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { usePublicColumnists, useColumns } from "@/hooks/use-articles";
import { Mic, Twitter, ArrowRight, Eye, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ColunistasIndexPage() {
  const { data: columnists = [], isLoading } = usePublicColumnists();
  const { data: columnsData, isLoading: loadingColumns } = useColumns({ limit: 6 });

  const featured = columnists[0];
  const rest = columnists.slice(1);
  const recentColumns = columnsData?.columns ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-background" />
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(219,0,55,0.35),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(255,0,64,0.25),transparent_45%)]" />
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Vozes da redação
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tighter leading-[0.95]">
                Os colunistas da{" "}
                <span className="text-primary">La Liga Brasil</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl">
                Análises afiadas, opiniões sem rodeios e bastidores do futebol
                espanhol contados pela voz de quem vive o jogo todos os dias.
              </p>
              <div className="flex items-center gap-6 mt-8 text-xs uppercase tracking-wider text-muted-foreground">
                <div>
                  <span className="block text-2xl font-display font-black text-white">
                    {columnists.length}
                  </span>
                  Colunistas ativos
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <span className="block text-2xl font-display font-black text-white">
                    {columnsData?.total ?? 0}
                  </span>
                  Colunas publicadas
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {isLoading ? (
            <div className="space-y-8">
              <div className="h-72 bg-card/40 border border-border rounded-2xl animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-56 bg-card/40 border border-border rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : columnists.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Featured columnist */}
              {featured && <FeaturedCard columnist={featured} />}

              {/* Rest of the grid */}
              {rest.length > 0 && (
                <div className="mt-12">
                  <SectionHeader
                    title="Toda a equipe"
                    subtitle="Cada colunista, sua paixão e seu time"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rest.map((c, i) => (
                      <ColumnistCard key={c.id} columnist={c} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent columns */}
              {!loadingColumns && recentColumns.length > 0 && (
                <div className="mt-16 pt-12 border-t border-border">
                  <SectionHeader
                    title="Últimas colunas"
                    subtitle="Direto da nossa equipe"
                    action={
                      <Link
                        href="/busca"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        Ver mais <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    }
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {recentColumns.map((col) => (
                      <ColumnPreviewCard key={col.id} column={col} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

// -------- Sub-components --------

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6 pb-4 border-b border-border">
      <div>
        <div className="flex items-center gap-2 text-primary mb-2">
          <Mic className="w-4 h-4" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]">
            La Liga Brasil
          </p>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "w-12 h-12 text-base",
    md: "w-16 h-16 text-xl",
    lg: "w-24 h-24 text-3xl",
    xl: "w-32 h-32 text-4xl",
  };
  return (
    <div
      className={`${sizes[size]} rounded-full overflow-hidden bg-background border-2 border-primary/30 flex-shrink-0 flex items-center justify-center`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="font-display font-black text-muted-foreground">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function FeaturedCard({
  columnist,
}: {
  columnist: import("@/hooks/use-articles").PublicColumnist;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href={columnist.slug ? `/colunistas/${columnist.slug}` : "#"}
        className="group relative block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card hover:border-primary/60 transition-all"
      >
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_85%_20%,rgba(219,0,55,0.35),transparent_60%)]" />
        <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 sm:gap-8 p-6 sm:p-10 items-center">
          <div className="flex justify-center md:block">
            <Avatar name={columnist.name} src={columnist.avatarUrl} size="xl" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Colunista em destaque
            </p>
            <h3 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white group-hover:text-primary transition-colors">
              {columnist.name}
            </h3>
            {columnist.title && (
              <p className="text-base text-white/70 italic mt-2">
                {columnist.title}
              </p>
            )}
            {columnist.bio && (
              <p className="text-sm text-muted-foreground mt-4 max-w-2xl line-clamp-3">
                {columnist.bio}
              </p>
            )}
            <div className="flex items-center gap-4 mt-5">
              {columnist.twitter && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Twitter className="w-3.5 h-3.5" />@{columnist.twitter}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary group-hover:gap-3 transition-all">
                Ler perfil
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ColumnistCard({
  columnist,
  index,
}: {
  columnist: import("@/hooks/use-articles").PublicColumnist;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        href={columnist.slug ? `/colunistas/${columnist.slug}` : "#"}
        className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all"
      >
        <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity [background-image:radial-gradient(circle_at_top_right,rgba(219,0,55,0.3),transparent_70%)]" />
        <div className="relative p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar name={columnist.name} src={columnist.avatarUrl} size="md" />
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-display font-black text-lg text-white group-hover:text-primary transition-colors leading-tight">
                {columnist.name}
              </h3>
              {columnist.title && (
                <p className="text-[11px] uppercase tracking-wider text-primary mt-1 truncate">
                  {columnist.title}
                </p>
              )}
            </div>
          </div>
          {columnist.bio && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {columnist.bio}
            </p>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {columnist.twitter ? (
                <>
                  <Twitter className="w-3.5 h-3.5" />@{columnist.twitter}
                </>
              ) : (
                <span className="opacity-50">Colunista</span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary group-hover:gap-2 transition-all">
              Perfil
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ColumnPreviewCard({
  column,
}: {
  column: import("@/hooks/use-articles").ColumnSummary;
}) {
  return (
    <Link
      href={`/noticias/${column.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all"
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
        <h3 className="text-lg font-display font-black text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {column.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {column.excerpt}
        </p>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar
              name={column.authorName}
              src={column.authorAvatarUrl}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {column.authorName}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {column.publishedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {format(parseISO(column.publishedAt), "dd MMM", {
                      locale: ptBR,
                    })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5" />
                  {column.viewCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <Mic className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-display font-black text-white mb-2">
        Em breve, nossos colunistas
      </h2>
      <p className="text-sm text-muted-foreground">
        Estamos formando uma equipe afiada de colunistas. Volte logo para
        conhecer.
      </p>
    </div>
  );
}
