import React from "react";
import { useListArticles, usePublicColumnists } from "@/hooks/use-articles";
import { useFeaturedMatch } from "@/hooks/use-matches";
import { useSofascoreEvent } from "@/hooks/use-sofascore";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { AlertCircle, Flame, Circle, ChevronRight, Trophy, Mic } from "lucide-react";
import { motion } from "framer-motion";

function ColunistasSection() {
  const { data: columnists = [], isLoading } = usePublicColumnists();

  if (isLoading) {
    return (
      <div className="border-t border-border pt-8">
        <div className="h-32 bg-card/30 rounded-xl animate-pulse" />
      </div>
    );
  }
  if (columnists.length === 0) return null;

  return (
    <div className="border-t border-border pt-8">
      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {columnists.slice(0, 6).map((c) => (
          <Link
            key={c.id}
            href={c.slug ? `/colunistas/${c.slug}` : "#"}
            className="group bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-background border border-border flex items-center justify-center mb-3">
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              ) : (
                <span className="text-xl font-display font-black text-muted-foreground">
                  {c.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <p className="font-display font-black text-sm text-white group-hover:text-primary transition-colors truncate">
              {c.name}
            </p>
            {c.title && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 truncate">
                {c.title}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeaturedMatchCard({ sofascoreId }: { sofascoreId: number }) {
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
  const isNotStarted = event.status.type === "notstarted";
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
              {event.tournament?.name || "La Liga"} — Destaque
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
            <span className={`font-display font-black text-center text-sm ${isFinished && homeScore > awayScore ? "text-white" : "text-muted-foreground"}`}>
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
            <span className={`font-display font-black text-center text-sm ${isFinished && awayScore > homeScore ? "text-white" : "text-muted-foreground"}`}>
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
  const { data: response, isLoading } = useListArticles({ limit: 12 });
  const { data: featuredMatch } = useFeaturedMatch();

  const articles = response?.articles || [];
  const breakingNews = articles.filter((a: any) => a.breakingNews).slice(0, 3);
  const featuredArticles = articles.filter((a: any) => a.featured);
  const mainFeatured = featuredArticles[0] || articles[0];
  const secondFeatured = featuredArticles[1];
  const latest = articles.filter((a: any) => a.id !== mainFeatured?.id && a.id !== secondFeatured?.id).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="bg-primary text-white py-2 overflow-hidden flex items-center border-b border-primary/50 shadow-[0_0_15px_rgba(219,0,55,0.3)]">
          <div className="container mx-auto px-4 flex items-center">
            <span className="flex items-center gap-2 font-black uppercase text-xs tracking-widest whitespace-nowrap z-10 bg-primary pr-4">
              <AlertCircle className="w-4 h-4 animate-pulse" />
              Urgente
            </span>
            <div className="flex-1 overflow-hidden relative">
              <div className="animate-ticker flex whitespace-nowrap gap-8 text-sm font-medium">
                {breakingNews.map(item => (
                  <Link key={item.id} href={`/noticias/${item.slug}`} className="hover:underline flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 sm:py-12">

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Main Content */}
              <div className="lg:col-span-8 space-y-8">

                {/* Main Featured Article */}
                {mainFeatured && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="text-primary w-5 h-5" />
                      <h2 className="font-display text-xl text-white">Destaque</h2>
                    </div>
                    <ArticleCard article={mainFeatured} featured={true} />
                  </motion.div>
                )}

                {/* Second Featured */}
                {secondFeatured && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <ArticleCard article={secondFeatured} featured={true} />
                  </motion.div>
                )}

                {/* Latest News */}
                <div>
                  <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                    <h2 className="font-display text-2xl flex items-center gap-2">
                      Últimas <span className="text-primary">Notícias</span>
                    </h2>
                    <Link href="/busca" className="text-sm text-muted-foreground hover:text-white transition-colors font-bold">
                      Ver tudo →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latest.map((article, idx) => (
                      <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                        <ArticleCard article={article} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Colunistas */}
                <ColunistasSection />
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4 space-y-6">

                {/* Featured Match */}
                {featuredMatch && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <FeaturedMatchCard sofascoreId={featuredMatch.sofascoreId} />
                  </motion.div>
                )}

                {/* Ver Todos os Resultados */}
                <Link href="/resultados">
                  <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors cursor-pointer group">
                    <span className="font-display font-black text-sm uppercase tracking-wider">Todos os Resultados</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              </aside>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
