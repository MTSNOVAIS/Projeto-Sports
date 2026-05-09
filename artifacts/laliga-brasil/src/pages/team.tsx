import React from "react";
import { useRoute, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { useGetTeam } from "@/hooks/use-teams";
import { Shield, MapPin, Building2, Calendar, ChevronLeft, Trophy, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamPage() {
  const [, params] = useRoute("/times/:slug");
  const slug = params?.slug || "";
  const { data: team, isLoading } = useGetTeam(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col justify-center items-center gap-4 text-center px-4">
          <Shield className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Time não encontrado</h1>
          <Link href="/times" className="text-primary hover:underline">← Ver todos os times</Link>
        </div>
      </div>
    );
  }

  const titles: any[] = Array.isArray(team.titles) ? team.titles : [];
  const totalTitles = titles.reduce((s: number, t: any) => s + (Number(t.count) || 0), 0);
  const sofascoreId = (team as any).sofascoreId;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="relative border-b border-border overflow-hidden" style={{ background: `linear-gradient(135deg, #0D0D0D 0%, ${team.primaryColor}22 50%, #0D0D0D 100%)` }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle, ${team.primaryColor} 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
          <div className="container mx-auto px-4 py-12 relative z-10">
            <Link href="/times" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white text-sm mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Todos os Times
            </Link>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div
                className="w-32 h-32 flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${team.primaryColor}30, ${team.secondaryColor}10)`,
                  border: `3px solid ${team.primaryColor}60`,
                  boxShadow: `0 0 40px ${team.primaryColor}20`,
                }}
              >
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt={team.name} className="w-24 h-24 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                ) : (
                  <Shield className="w-16 h-16" style={{ color: team.primaryColor }} />
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{team.name}</h1>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {team.city}</span>
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-primary" /> {team.stadium}</span>
                  {team.foundedYear && (
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> Fundado em {team.foundedYear}</span>
                  )}
                  {totalTitles > 0 && (
                    <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-400" /> {totalTitles} títulos</span>
                  )}
                </div>
                {team.description && (
                  <p className="mt-4 max-w-2xl text-gray-400 leading-relaxed">{team.description}</p>
                )}

                {sofascoreId && (
                  <div className="mt-5">
                    <Link
                      href={`/resultados?team=${sofascoreId}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary rounded-xl font-bold text-sm transition-all"
                    >
                      <Trophy className="w-4 h-4" />
                      Ver Resultados
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {titles.length > 0 && (
          <div className="border-b border-border bg-card/30">
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                <Trophy className="text-amber-400 w-5 h-5" /> Palmarés
              </h2>
              <div className="flex flex-wrap gap-3">
                {titles.sort((a, b) => b.count - a.count).map((title: any) => (
                  <div key={title.competition} className="flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-2.5">
                    <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-white leading-none">{title.competition}</div>
                      {title.lastYear && <div className="text-xs text-muted-foreground mt-0.5">último: {title.lastYear}</div>}
                    </div>
                    <span className="text-xl font-black text-amber-400 leading-none ml-1">{title.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h2 className="text-2xl font-bold">
              Notícias sobre o <span className="text-primary">{team.shortName}</span>
            </h2>
            <span className="text-sm text-muted-foreground">{team.articleCount} matérias</span>
          </div>

          {!team.recentArticles || team.recentArticles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma matéria sobre este time ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.recentArticles.map((article: any, idx: number) => (
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
