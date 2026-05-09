import React from "react";
import { useListArticles, usePublicColumnists, useColumns } from "@/hooks/use-articles";
import { useFeaturedMatch } from "@/hooks/use-matches";
import { useSofascoreEvent } from "@/hooks/use-sofascore";
import { useHomepageSettings } from "@/hooks/use-homepage-settings";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { Flame, Circle, ChevronRight, Trophy, Mic } from "lucide-react";
import { motion } from "framer-motion";

function HorizontalScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {children}
      </div>
    </div>
  );
}

function ColumnCard({ column }: { column: any }) {
  return (
    <Link
      href={`/noticias/${column.slug}`}
      className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all h-full"
    >
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {column.coverImage ? (
          <img
            src={column.coverImage}
            alt={column.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/30 via-card to-card flex items-center justify-center">
            <Mic className="w-10 h-10 text-amber-400/40" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-black mb-1.5">
          Coluna
        </p>
        <h3 className="font-display font-black text-white text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {column.title}
        </h3>
      </div>
    </Link>
  );
}

function ColumnistProfileCard({ columnist }: { columnist: any }) {
  return (
    <Link
      href={columnist.slug ? `/colunistas/${columnist.slug}` : "#"}
      className="group block bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all text-center h-full"
    >
      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-background border border-border flex items-center justify-center mb-3">
        {columnist.avatarUrl ? (
          <img
            src={columnist.avatarUrl}
            alt={columnist.name}
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <span className="text-2xl font-display font-black text-muted-foreground">
            {columnist.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <p className="font-display font-black text-sm text-white group-hover:text-primary transition-colors truncate">
        {columnist.name}
      </p>
      {columnist.title && (
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 truncate">
          {columnist.title}
        </p>
      )}
    </Link>
  );
}

function ColunasSection({ sectionTitle }: { sectionTitle: string }) {
  const { data: columnsData, isLoading: loadingColumns } = useColumns({ limit: 20 });
  const { data: columnists = [], isLoading: loadingColumnists } = usePublicColumnists();

  const allColumns = columnsData?.columns ?? [];

  const dayAgoMs = Date.now() - 24 * 60 * 60 * 1000;
  const recent = allColumns.filter((c) => {
    if (!c.publishedAt) return false;
    return new Date(c.publishedAt).getTime() >= dayAgoMs;
  });

  if (loadingColumns || loadingColumnists) return null;
  if (allColumns.length === 0) return null;

  if (recent.length > 0) {
    return (
      <div className="border-t border-border pt-8">
        <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
          <h2 className="font-display text-2xl flex items-center gap-2">
            <Mic className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400">{sectionTitle}</span> de hoje
          </h2>
          <Link
            href="/colunistas"
            className="text-sm text-muted-foreground hover:text-white transition-colors font-bold"
          >
            Ver todas →
          </Link>
        </div>
        <HorizontalScroller>
          {recent.map((c) => (
            <div
              key={c.id}
              className="snap-start flex-shrink-0 w-[78%] sm:w-[44%] md:w-[34%] lg:w-[40%]"
            >
              <ColumnCard column={c} />
            </div>
          ))}
        </HorizontalScroller>
      </div>
    );
  }

  if (columnists.length === 0) return null;

  return (
    <div className="border-t border-border pt-8">
      <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
        <h2 className="font-display text-2xl flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Nossos <span className="text-primary">Colunistas</span>
        </h2>
        <Link
          href="/colunistas"
          className="text-sm text-muted-foreground hover:text-white transition-colors font-bold"
        >
          Ver todos →
        </Link>
      </div>
      <HorizontalScroller>
        {columnists.map((c) => (
          <div
            key={c.id}
            className="snap-start flex-shrink-0 w-[55%] sm:w-[32%] md:w-[24%] lg:w-[28%]"
          >
            <ColumnistProfileCard columnist={c} />
          </div>
        ))}
      </HorizontalScroller>
    </div>
  );
}

function FeaturedMatchCard({ sofascoreId, title }: { sofascoreId: number; title: string }) {
  const { data, isLoading } = useSofascoreEvent(sofascoreId);
  const event = data?.event;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24 mb-3" />
        <div className="flex items-center justify-between gap-4">
          <div className="h-5 bg-white/10 rounded w-28" />
          <div className="h-8 bg-white/10 rounded w-16" />
          <div className="h-5 bg-white/10 rounded w-28" />
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isLive = event.status.type === "inprogress";
  const isFinished = event.status.type === "finished";
  const homeScore = event.homeScore?.current ?? null;
  const awayScore = event.awayScore?.current ?? null;
  const d = new Date(event.startTimestamp * 1000);

  return (
    <Link href={`/partidas/${sofascoreId}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-all group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isLive && <Circle className="w-2 h-2 text-green-400 fill-green-400 animate-pulse" />}
            <span className={`text-xs font-bold uppercase ${isLive ? "text-green-400" : isFinished ? "text-muted-foreground" : "text-blue-400"}`}>
              {isLive ? (event.time?.played ? `${event.time.played}'` : "Ao Vivo") : isFinished ? "Encerrado" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <img
              src={`https://api.sofascore.com/api/v1/team/${event.homeTeam.id}/image`}
              alt={event.homeTeam.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className={`font-display font-black text-center text-sm ${isFinished && homeScore !== null && awayScore !== null && homeScore > awayScore ? "text-white" : "text-muted-foreground"}`}>
              {event.homeTeam.shortName || event.homeTeam.name}
            </span>
          </div>

          <div className="text-center flex-shrink-0 min-w-[70px]">
            {homeScore !== null ? (
              <span className="font-display font-black text-4xl text-white">{homeScore}–{awayScore}</span>
            ) : (
              <div>
                <div className="font-display font-black text-2xl text-white">VS</div>
                <div className="text-xs text-muted-foreground mt-1">{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <img
              src={`https://api.sofascore.com/api/v1/team/${event.awayTeam.id}/image`}
              alt={event.awayTeam.name}
              className="w-12 h-12 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className={`font-display font-black text-center text-sm ${isFinished && homeScore !== null && awayScore !== null && awayScore > homeScore ? "text-white" : "text-muted-foreground"}`}>
              {event.awayTeam.shortName || event.awayTeam.name}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>Ver detalhes</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const { data: settings } = useHomepageSettings();
  const { data: response, isLoading } = useListArticles({ limit: 12 });
  const { data: featuredMatch } = useFeaturedMatch();

  const maxFeatured = settings?.maxFeatured ?? 3;
  const maxLatest = settings?.maxLatest ?? 6;

  const articles = response?.articles || [];
  const featuredArticles = articles
    .filter((a: any) => a.featured)
    .slice(0, maxFeatured);
  const hasFeatured = featuredArticles.length > 0;
  const fallbackFeatured = !hasFeatured && articles[0] ? [articles[0]] : [];
  const featuredToShow = hasFeatured ? featuredArticles : fallbackFeatured;
  const featuredIds = new Set(featuredToShow.map((a: any) => a.id));
  const latest = articles.filter((a: any) => !featuredIds.has(a.id)).slice(0, maxLatest);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 sm:py-12">

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              <div className="lg:col-span-8 space-y-10">

                {/* Featured section */}
                {settings?.showFeatured !== false && featuredToShow.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <Flame className="text-primary w-6 h-6" />
                      <h2 className="font-display text-2xl text-white">
                        {settings?.featuredTitle ?? "Destaques"}
                      </h2>
                    </div>

                    {featuredToShow.length === 1 ? (
                      <div className="[&_h2]:!text-3xl md:[&_h2]:!text-5xl">
                        <ArticleCard article={featuredToShow[0]} featured={true} />
                      </div>
                    ) : (
                      <HorizontalScroller>
                        {featuredToShow.map((article: any) => (
                          <div
                            key={article.id}
                            className="snap-start flex-shrink-0 w-[92%] sm:w-[80%] md:w-[72%] lg:w-[88%]"
                          >
                            <div className="[&_h2]:!text-2xl md:[&_h2]:!text-4xl">
                              <ArticleCard article={article} featured={true} />
                            </div>
                          </div>
                        ))}
                      </HorizontalScroller>
                    )}
                  </motion.div>
                )}

                {/* Colunas section */}
                {settings?.showColunas !== false && (
                  <ColunasSection sectionTitle={settings?.colunasTitle ?? "Colunas"} />
                )}

                {/* Latest news */}
                {settings?.showLatest !== false && latest.length > 0 && (
                  <div className="border-t border-border pt-8">
                    <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
                      <h2 className="font-display text-xl text-white font-black">
                        {settings?.latestTitle ?? "Últimas Notícias"}
                      </h2>
                      <Link
                        href="/busca"
                        className="text-sm text-muted-foreground hover:text-white transition-colors font-bold"
                      >
                        Ver tudo →
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {latest.map((article: any, idx: number) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                        >
                          <ArticleCard article={article} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4 space-y-6">
                {settings?.showSidebarMatch !== false && featuredMatch && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <FeaturedMatchCard
                      sofascoreId={featuredMatch.sofascoreId}
                      title={settings?.sidebarMatchTitle ?? "Partida em Destaque"}
                    />
                  </motion.div>
                )}
              </aside>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
