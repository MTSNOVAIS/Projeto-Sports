import React, { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useMatches } from "@/hooks/use-matches";
import { useLeagues } from "@/hooks/use-leagues";
import {
  useSofascoreEvent,
  useSofascoreTournamentLastEvents,
  useSofascoreTournamentNextEvents,
  useSofascoreTournamentRoundEvents,
  useSofascoreTournamentSeasons,
  teamImageUrl,
  tournamentImageUrl,
} from "@/hooks/use-sofascore";
import { motion } from "framer-motion";
import { Calendar, Clock, ChevronRight, Circle, Trophy as TrophyIcon, ChevronLeft, Search, X } from "lucide-react";

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
            {event.tournament?.name || ""}
          </span>
          <div className="flex items-center gap-2">
            {isLive && <Circle className="w-2 h-2 text-green-400 fill-green-400 animate-pulse" />}
            <span className={`text-xs font-bold uppercase ${status.color}`}>{status.label}</span>
            {isLive && event.time?.played ? (
              <span className="text-xs text-green-400 font-bold">{event.time.played}'</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center justify-end gap-3">
            <span className={`font-display font-black text-right text-base ${isFinished && homeScore > awayScore ? "text-white" : "text-muted-foreground"}`}>
              {event.homeTeam.name}
            </span>
            <img src={teamImageUrl(event.homeTeam.id)} alt={event.homeTeam.name} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>

          <div className="flex items-center gap-2 min-w-[80px] justify-center">
            {homeScore !== null && awayScore !== null ? (
              <span className="font-display font-black text-2xl text-white">{homeScore} – {awayScore}</span>
            ) : (
              <div className="text-center">
                <div className="text-xs text-muted-foreground font-bold">{new Date(event.startTimestamp * 1000).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</div>
                <div className="text-sm font-black text-white">{formatMatchTime(event.startTimestamp)}</div>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center gap-3">
            <img src={teamImageUrl(event.awayTeam.id)} alt={event.awayTeam.name} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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

function EventRow({ event, teamFilter }: { event: any; teamFilter: string }) {
  const q = teamFilter.trim().toLowerCase();
  if (q) {
    const homeName = (event.homeTeam?.name || "").toLowerCase();
    const awayName = (event.awayTeam?.name || "").toLowerCase();
    if (!homeName.includes(q) && !awayName.includes(q)) return null;
  }

  const status = statusLabel(event.status.type, event.status.description);
  const isLive = event.status.type === "inprogress";
  const isFinished = event.status.type === "finished";
  const homeScore = event.homeScore?.current ?? null;
  const awayScore = event.awayScore?.current ?? null;

  return (
    <Link href={`/partidas/${event.id}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.005 }}
        className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-bold">
            {event.roundInfo?.round ? `Rodada ${event.roundInfo.round}` : new Date(event.startTimestamp * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
          <div className="flex items-center gap-2">
            {isLive && <Circle className="w-2 h-2 text-green-400 fill-green-400 animate-pulse" />}
            <span className={`text-xs font-bold uppercase ${status.color}`}>{status.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center justify-end gap-2">
            <span className={`font-bold text-sm text-right truncate ${isFinished && homeScore > awayScore ? "text-white" : "text-muted-foreground"}`}>
              {event.homeTeam.name}
            </span>
            <img src={teamImageUrl(event.homeTeam.id)} alt="" className="w-6 h-6 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div className="min-w-[64px] text-center flex-shrink-0">
            {homeScore !== null ? (
              <span className="font-display font-black text-lg text-white">{homeScore}–{awayScore}</span>
            ) : (
              <span className="text-sm font-bold text-white">{formatMatchTime(event.startTimestamp)}</span>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <img src={teamImageUrl(event.awayTeam.id)} alt="" className="w-6 h-6 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className={`font-bold text-sm truncate ${isFinished && awayScore > homeScore ? "text-white" : "text-muted-foreground"}`}>
              {event.awayTeam.name}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </motion.div>
    </Link>
  );
}

function LeagueRoundsSection({ league, teamFilter }: { league: any; teamFilter: string }) {
  const { data: seasonsData } = useSofascoreTournamentSeasons(league.sofascoreId);
  const seasonId = league.currentSeasonId || seasonsData?.seasons?.[0]?.id;

  const { data: lastData, isLoading: loadingLast } = useSofascoreTournamentLastEvents(league.sofascoreId, seasonId);
  const { data: nextData } = useSofascoreTournamentNextEvents(league.sofascoreId, seasonId);

  const lastEvents: any[] = lastData?.events || [];
  const detectedRound: number | null = useMemo(() => {
    if (lastEvents.length === 0) return null;
    const r = lastEvents[lastEvents.length - 1]?.roundInfo?.round;
    return r ? Number(r) : null;
  }, [lastEvents]);

  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const currentRound = selectedRound ?? detectedRound;
  const isUsingRound = selectedRound !== null;

  const { data: roundData, isLoading: loadingRound } = useSofascoreTournamentRoundEvents(
    league.sofascoreId,
    seasonId,
    isUsingRound ? currentRound! : undefined
  );

  const nextRound: number | null = useMemo(() => {
    const e = nextData?.events;
    if (!e || e.length === 0) return null;
    const r = e[0]?.roundInfo?.round;
    return r ? Number(r) : null;
  }, [nextData]);

  const maxRound = nextRound ?? (detectedRound ? detectedRound + 5 : 38);

  const events: any[] = useMemo(() => {
    if (isUsingRound) {
      return (roundData?.events || []).slice().sort((a: any, b: any) => a.startTimestamp - b.startTimestamp);
    }
    return lastEvents.slice().reverse().slice(0, 10);
  }, [isUsingRound, roundData, lastEvents]);

  const isLoading = isUsingRound ? loadingRound : loadingLast;

  function goToPrevRound() {
    const base = currentRound ?? 1;
    if (base > 1) setSelectedRound(base - 1);
  }

  function goToNextRound() {
    const base = currentRound ?? 1;
    setSelectedRound(base + 1);
  }

  function resetToLast() {
    setSelectedRound(null);
  }

  return (
    <div className="mb-12">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={tournamentImageUrl(league.sofascoreId)} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl text-white font-black">{league.name}</h2>
          {league.country && <p className="text-xs text-muted-foreground">{league.country}</p>}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isUsingRound && (
            <button
              onClick={resetToLast}
              className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-white border border-border rounded-lg transition-colors"
            >
              Recentes
            </button>
          )}
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={goToPrevRound}
              disabled={currentRound !== null && currentRound <= 1}
              className="px-3 py-2 text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
              title="Rodada anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-sm font-black text-white whitespace-nowrap min-w-[90px] text-center">
              {currentRound ? `Rodada ${currentRound}` : "Recentes"}
            </span>
            <button
              onClick={goToNextRound}
              disabled={currentRound !== null && maxRound !== null && currentRound >= maxRound}
              className="px-3 py-2 text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
              title="Próxima rodada"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {!league.sofascoreId ? (
        <p className="text-sm text-muted-foreground text-center py-6">Liga sem ID do Sofascore configurado.</p>
      ) : !seasonId && !isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Configure a temporada ativa no painel de Ligas.</p>
      ) : isLoading ? (
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
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma partida encontrada.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event: any) => (
            <EventRow key={event.id} event={event} teamFilter={teamFilter} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const [location] = useLocation();
  const [teamFilter, setTeamFilter] = useState(() => {
    if (typeof window !== "undefined" && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const teamParam = params.get("team");
      return teamParam || "";
    }
    return "";
  });

  const { data: pinnedMatches = [], isLoading: loadingPinned } = useMatches();
  const { data: leagues = [], isLoading: loadingLeagues } = useLeagues();

  const activeLeagues = (leagues as any[]).filter((l: any) => l.sofascoreId);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="font-display text-3xl font-black">Resultados</h1>
            </div>
            <p className="text-muted-foreground">Partidas em destaque e rodadas por competição</p>
          </div>

          {/* Team filter */}
          <div className="mb-8">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                placeholder="Filtrar por time..."
                className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all"
              />
              {teamFilter && (
                <button
                  onClick={() => setTeamFilter("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Pinned matches */}
          {!teamFilter && (loadingPinned ? true : pinnedMatches.length > 0) && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg text-white font-bold">Em Destaque</h2>
              </div>
              {loadingPinned ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-20" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {pinnedMatches.map((m: any) => (
                    <MatchCard key={m.id} sofascoreId={m.sofascoreId} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* League sections */}
          {loadingLeagues ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeLeagues.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl text-muted-foreground">
              <TrophyIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-bold">Nenhuma liga configurada.</p>
              <p className="text-sm mt-1">Adicione ligas no painel admin para ver os jogos aqui.</p>
            </div>
          ) : (
            activeLeagues.map((league: any) => (
              <LeagueRoundsSection key={league.id} league={league} teamFilter={teamFilter} />
            ))
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
