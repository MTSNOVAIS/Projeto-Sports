import React, { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useMatches } from "@/hooks/use-matches";
import { useSofascoreEvent, useSofascoreLaLigaSeasons, useSofascoreLaLigaLastEvents, useSofascoreLaLigaNextEvents } from "@/hooks/use-sofascore";
import { motion } from "framer-motion";
import { Calendar, Clock, ChevronRight, Trophy, Circle } from "lucide-react";

function statusLabel(type: string, description: string): { label: string; color: string } {
  switch (type) {
    case "inprogress": return { label: description || "Ao Vivo", color: "text-green-400" };
    case "finished": return { label: "Encerrado", color: "text-muted-foreground" };
    case "notstarted": return { label: "Não iniciado", color: "text-blue-400" };
    case "postponed": return { label: "Adiado", color: "text-yellow-500" };
    case "canceled": return { label: "Cancelado", color: "text-red-500" };
    default: return { label: description || type, color: "text-muted-foreground" };
  }
}

function formatMatchDate(timestamp: number) {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

function formatMatchTime(timestamp: number) {
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function MatchCard({ sofascoreId }: { sofascoreId: number }) {
  const { data, isLoading, isError } = useSofascoreEvent(sofascoreId);
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

  if (isError || !event) return null;

  const status = statusLabel(event.status.type, event.status.description);
  const isLive = event.status.type === "inprogress";
  const isFinished = event.status.type === "finished";
  const homeScore = event.homeScore?.current ?? null;
  const awayScore = event.awayScore?.current ?? null;

  return (
    <Link href={`/partidas/${sofascoreId}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {event.tournament?.name || "La Liga"}
          </span>
          <div className="flex items-center gap-2">
            {isLive && <Circle className="w-2 h-2 text-green-400 fill-green-400 animate-pulse" />}
            <span className={`text-xs font-bold uppercase ${status.color}`}>{status.label}</span>
            {isLive && event.time?.injuryTime1 ? (
              <span className="text-xs text-green-400 font-bold">{event.time.played + (event.time.injuryTime1 || 0)}'</span>
            ) : isLive && event.time?.played ? (
              <span className="text-xs text-green-400 font-bold">{event.time.played}'</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center justify-end gap-3">
            <span className={`font-display font-black text-right text-base ${isFinished && homeScore > awayScore ? "text-white" : "text-muted-foreground"}`}>
              {event.homeTeam.name}
            </span>
            {event.homeTeam.id && (
              <img
                src={`https://api.sofascore.com/api/v1/team/${event.homeTeam.id}/image`}
                alt={event.homeTeam.name}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>

          <div className="flex items-center gap-2 min-w-[80px] justify-center">
            {homeScore !== null && awayScore !== null ? (
              <span className="font-display font-black text-2xl text-white">
                {homeScore} – {awayScore}
              </span>
            ) : (
              <div className="text-center">
                <div className="text-xs text-muted-foreground font-bold">{formatMatchDate(event.startTimestamp)}</div>
                <div className="text-sm font-black text-white">{formatMatchTime(event.startTimestamp)}</div>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center gap-3">
            {event.awayTeam.id && (
              <img
                src={`https://api.sofascore.com/api/v1/team/${event.awayTeam.id}/image`}
                alt={event.awayTeam.name}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <span className={`font-display font-black text-left text-base ${isFinished && awayScore > homeScore ? "text-white" : "text-muted-foreground"}`}>
              {event.awayTeam.name}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </motion.div>
    </Link>
  );
}

function LaLigaRoundsSection() {
  const [tab, setTab] = useState<"next" | "last">("last");
  const { data: seasonsData } = useSofascoreLaLigaSeasons();
  const seasonId = seasonsData?.seasons?.[0]?.id;

  const { data: lastData, isLoading: loadingLast } = useSofascoreLaLigaLastEvents(seasonId);
  const { data: nextData, isLoading: loadingNext } = useSofascoreLaLigaNextEvents(seasonId);

  const events: any[] = tab === "last"
    ? (lastData?.events || []).slice().reverse().slice(0, 10)
    : (nextData?.events || []).slice(0, 10);

  const isLoading = tab === "last" ? loadingLast : loadingNext;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl text-white">La Liga — Rodadas</h2>
        <div className="ml-auto flex bg-card border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setTab("last")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${tab === "last" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
          >
            Recentes
          </button>
          <button
            onClick={() => setTab("next")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${tab === "next" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
          >
            Próximas
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-24 mb-3" />
              <div className="flex items-center justify-between gap-4">
                <div className="h-5 bg-white/10 rounded w-28" />
                <div className="h-8 bg-white/10 rounded w-16" />
                <div className="h-5 bg-white/10 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => {
            const status = statusLabel(event.status.type, event.status.description);
            const isLive = event.status.type === "inprogress";
            const isFinished = event.status.type === "finished";
            const homeScore = event.homeScore?.current ?? null;
            const awayScore = event.awayScore?.current ?? null;

            return (
              <Link key={event.id} href={`/partidas/${event.id}`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-bold">Rodada {event.roundInfo?.round}</span>
                    <div className="flex items-center gap-2">
                      {isLive && <Circle className="w-2 h-2 text-green-400 fill-green-400 animate-pulse" />}
                      <span className={`text-xs font-bold uppercase ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <span className={`font-bold text-sm text-right ${isFinished && homeScore > awayScore ? "text-white" : "text-muted-foreground"}`}>
                        {event.homeTeam.name}
                      </span>
                      <img src={`https://api.sofascore.com/api/v1/team/${event.homeTeam.id}/image`} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="min-w-[60px] text-center">
                      {homeScore !== null ? (
                        <span className="font-display font-black text-lg text-white">{homeScore}–{awayScore}</span>
                      ) : (
                        <span className="text-sm font-bold text-white">{formatMatchTime(event.startTimestamp)}</span>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <img src={`https://api.sofascore.com/api/v1/team/${event.awayTeam.id}/image`} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span className={`font-bold text-sm ${isFinished && awayScore > homeScore ? "text-white" : "text-muted-foreground"}`}>
                        {event.awayTeam.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { data: pinnedMatches = [], isLoading: loadingPinned } = useMatches();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="font-display text-3xl font-black">Resultados</h1>
            </div>
            <p className="text-muted-foreground">Partidas em destaque e rodadas da La Liga</p>
          </div>

          {pinnedMatches.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg text-white font-bold">Em Destaque</h2>
              </div>
              <div className="space-y-3">
                {pinnedMatches.map((m: any) => (
                  <MatchCard key={m.id} sofascoreId={m.sofascoreId} />
                ))}
              </div>
            </section>
          )}

          <LaLigaRoundsSection />

        </div>
      </main>
      <Footer />
    </div>
  );
}
