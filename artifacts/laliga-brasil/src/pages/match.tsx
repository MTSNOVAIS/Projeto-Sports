import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  useSofascoreEvent,
  useSofascoreIncidents,
  useSofascoreStatistics,
  useSofascoreLineups,
  useSofascoreH2H,
  teamImageUrl,
} from "@/hooks/use-sofascore";
import { motion } from "framer-motion";
import { ArrowLeft, Circle, Users, BarChart2, Clock, Swords, RefreshCw } from "lucide-react";

type Tab = "incidents" | "statistics" | "lineups" | "h2h";

const STAT_LABELS: Record<string, string> = {
  "Ball possession": "Posse de bola",
  "Expected goals": "Gols esperados (xG)",
  "Total shots": "Chutes totais",
  "Shots on target": "Chutes no gol",
  "Shots off target": "Chutes para fora",
  "Blocked shots": "Chutes bloqueados",
  "Corner kicks": "Escanteios",
  "Offsides": "Impedimentos",
  "Fouls": "Faltas",
  "Yellow cards": "Cartões amarelos",
  "Red cards": "Cartões vermelhos",
  "Passes": "Passes",
  "Accurate passes": "Passes certos",
  "Tackles": "Desarmes",
  "Free kicks": "Cobranças de falta",
  "Goalkeeper saves": "Defesas do goleiro",
  "Big chances": "Grandes chances",
  "Big chances missed": "Grandes chances perdidas",
  "Big chances scored": "Grandes chances convertidas",
  "Attacks": "Ataques",
  "Dangerous attacks": "Ataques perigosos",
  "Clearances": "Cortes",
  "Throw-ins": "Laterais",
  "Final third entries": "Entradas no terço final",
  "Long balls": "Bolas longas",
  "Crosses": "Cruzamentos",
  "Dribbles": "Dribles",
  "Duels": "Duelos",
  "Duels won": "Duelos vencidos",
  "Aerials won": "Duelos aéreos vencidos",
  "Interceptions": "Interceptações",
};

const STAT_GROUP_LABELS: Record<string, string> = {
  "Match overview": "Visão geral",
  "Shots": "Chutes",
  "Passing": "Passes",
  "Defence": "Defesa",
  "Duels": "Duelos",
  "Attacking": "Ataque",
};

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

function incidentIcon(type: string, incidentClass?: string) {
  if (type === "goal") return incidentClass === "ownGoal" ? "⚽ (contra)" : "⚽";
  if (type === "card") return incidentClass === "red" ? "🟥" : "🟨";
  if (type === "substitution") return "🔄";
  if (type === "penalty" || incidentClass === "penalty") return "⚽ (pênalti)";
  if (type === "missedPenalty") return "❌";
  if (type === "varDecision") return "📺 VAR";
  return "•";
}

function incidentLabel(type: string, incidentClass?: string): string {
  if (type === "goal") {
    if (incidentClass === "ownGoal") return "Gol contra";
    if (incidentClass === "penalty") return "Gol (pênalti)";
    return "Gol";
  }
  if (type === "card") return incidentClass === "red" ? "Cartão vermelho" : "Cartão amarelo";
  if (type === "substitution") return "Substituição";
  if (type === "missedPenalty") return "Pênalti perdido";
  if (type === "varDecision") return "Revisão VAR";
  if (type === "injuryTime") return "Acréscimos";
  if (type === "period") return "Período";
  return type;
}

function IncidentsTab({ id }: { id: string }) {
  const { data, isLoading, refetch } = useSofascoreIncidents(id);
  const incidents: any[] = data?.incidents || [];

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!incidents.length) {
    return <p className="text-muted-foreground text-center py-10">Nenhum lance registrado ainda.</p>;
  }

  const mainIncidents = incidents.filter(inc =>
    ["goal", "card", "substitution", "missedPenalty", "varDecision"].includes(inc.incidentType)
  );
  const sorted = (mainIncidents.length > 0 ? mainIncidents : incidents)
    .slice()
    .sort((a, b) => (b.time || 0) - (a.time || 0));

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>
      <div className="space-y-1">
        {sorted.map((inc: any, i: number) => {
          const isHome = inc.isHome;
          const icon = incidentIcon(inc.incidentType, inc.incidentClass);
          const minute = inc.time ? `${inc.time}${inc.addedTime ? `+${inc.addedTime}` : ""}'` : "";
          const playerName = inc.player?.name || inc.playerName || "";
          const assistName = inc.assist1?.name || "";
          const subPlayerIn = inc.playerIn?.name || "";
          const subPlayerOut = inc.playerOut?.name || inc.player?.name || "";
          const isSubstitution = inc.incidentType === "substitution";

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isHome ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors ${isHome ? "flex-row" : "flex-row-reverse"}`}
            >
              <span className="text-xl w-8 text-center shrink-0">{icon}</span>
              <div className={`flex-1 ${isHome ? "text-left" : "text-right"}`}>
                {isSubstitution ? (
                  <>
                    <p className="text-xs text-green-400 font-bold">▲ {subPlayerIn}</p>
                    <p className="text-xs text-red-400">▼ {subPlayerOut}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-sm text-white">{playerName}</p>
                    {assistName && <p className="text-xs text-muted-foreground">Assistência: {assistName}</p>}
                  </>
                )}
              </div>
              <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded min-w-[42px] text-center">{minute}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  const ptLabel = STAT_LABELS[label] || label;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span className="font-bold text-white">{home}</span>
        <span>{ptLabel}</span>
        <span className="font-bold text-white">{away}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
        <div className="bg-primary rounded-full transition-all" style={{ width: `${(home / total) * 100}%` }} />
        <div className="bg-blue-500 rounded-full transition-all" style={{ width: `${(away / total) * 100}%` }} />
      </div>
    </div>
  );
}

function StatisticsTab({ id }: { id: string }) {
  const { data, isLoading } = useSofascoreStatistics(id);
  const groups: any[] = data?.statistics?.[0]?.groups || [];

  if (isLoading) return <div className="animate-pulse space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-white/5 rounded" />)}</div>;
  if (!groups.length) return <p className="text-muted-foreground text-center py-10">Estatísticas ainda não disponíveis.</p>;

  return (
    <div>
      {groups.map((group: any) => (
        <div key={group.groupName} className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">
            {STAT_GROUP_LABELS[group.groupName] || group.groupName}
          </h3>
          {(group.statisticsItems || []).map((item: any) => (
            <StatBar key={item.name} label={item.name} home={Number(item.home) || 0} away={Number(item.away) || 0} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PlayerCard({ player, isStarting }: { player: any; isStarting: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs font-black text-muted-foreground w-6 text-center">{player.jerseyNumber}</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">{player.player?.name || player.name}</p>
        <p className="text-xs text-muted-foreground">{player.player?.position || ""}</p>
      </div>
      {!isStarting && <span className="text-xs text-yellow-500 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">Res.</span>}
    </div>
  );
}

function LineupsTab({ id }: { id: string }) {
  const { data, isLoading } = useSofascoreLineups(id);

  if (isLoading) return <div className="animate-pulse space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-8 bg-white/5 rounded" />)}</div>;
  if (!data?.home) return <p className="text-muted-foreground text-center py-10">Escalações ainda não disponíveis.</p>;

  const { home, away } = data;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="font-display font-black text-sm uppercase mb-3 text-primary">Titulares</h3>
        {(home.players || []).filter((p: any) => p.substitute === false).map((p: any) => (
          <PlayerCard key={p.player?.id || p.name} player={p} isStarting />
        ))}
        <h3 className="font-display font-black text-sm uppercase mt-4 mb-3 text-muted-foreground">Reservas</h3>
        {(home.players || []).filter((p: any) => p.substitute === true).map((p: any) => (
          <PlayerCard key={p.player?.id || p.name} player={p} isStarting={false} />
        ))}
      </div>
      <div>
        <h3 className="font-display font-black text-sm uppercase mb-3 text-blue-400">Titulares</h3>
        {(away.players || []).filter((p: any) => p.substitute === false).map((p: any) => (
          <PlayerCard key={p.player?.id || p.name} player={p} isStarting />
        ))}
        <h3 className="font-display font-black text-sm uppercase mt-4 mb-3 text-muted-foreground">Reservas</h3>
        {(away.players || []).filter((p: any) => p.substitute === true).map((p: any) => (
          <PlayerCard key={p.player?.id || p.name} player={p} isStarting={false} />
        ))}
      </div>
    </div>
  );
}

function H2HTab({ id }: { id: string }) {
  const { data, isLoading } = useSofascoreH2H(id);
  const events: any[] = data?.events || [];

  if (isLoading) return <div className="animate-pulse space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded" />)}</div>;
  if (!events.length) return <p className="text-muted-foreground text-center py-10">Sem histórico de confrontos.</p>;

  return (
    <div className="space-y-2">
      {events.slice(0, 10).map((e: any) => {
        const home = e.homeScore?.current ?? "-";
        const away = e.awayScore?.current ?? "-";
        const d = new Date(e.startTimestamp * 1000);
        return (
          <Link key={e.id} href={`/partidas/${e.id}`}>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{d.toLocaleDateString("pt-BR")}</span>
              <div className="flex-1 flex items-center gap-2">
                <img src={teamImageUrl(e.homeTeam.id)} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-sm font-bold text-white flex-1 text-right">{e.homeTeam.shortName || e.homeTeam.name}</span>
              </div>
              <span className="font-display font-black text-sm text-white bg-white/10 px-3 py-1 rounded">{home}–{away}</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-bold text-muted-foreground flex-1">{e.awayTeam.shortName || e.awayTeam.name}</span>
                <img src={teamImageUrl(e.awayTeam.id)} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("incidents");
  const { data, isLoading, isError } = useSofascoreEvent(id);
  const event = data?.event;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "incidents", label: "Lance a Lance", icon: <Clock className="w-4 h-4" /> },
    { key: "statistics", label: "Estatísticas", icon: <BarChart2 className="w-4 h-4" /> },
    { key: "lineups", label: "Escalações", icon: <Users className="w-4 h-4" /> },
    { key: "h2h", label: "Confrontos", icon: <Swords className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError || !event ? (
          <div className="container mx-auto px-4 py-20 text-center">
            <p className="text-muted-foreground text-lg">Partida não encontrada.</p>
            <Link href="/resultados" className="text-primary hover:underline mt-4 inline-block">← Voltar aos Resultados</Link>
          </div>
        ) : (
          <>
            <div className="bg-card border-b border-border">
              <div className="container mx-auto px-4 py-6 max-w-4xl">
                <Link href="/resultados" className="flex items-center gap-2 text-muted-foreground hover:text-white text-sm mb-6 transition-colors w-fit">
                  <ArrowLeft className="w-4 h-4" /> Resultados
                </Link>

                <div className="text-center mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                    {event.tournament?.name} {event.season?.year ? `· ${event.season.year}` : ""} {event.roundInfo?.round ? `· Rodada ${event.roundInfo.round}` : ""}
                  </span>
                </div>

                {(() => {
                  const status = statusLabel(event.status.type, event.status.description);
                  const isLive = event.status.type === "inprogress";
                  const homeScore = event.homeScore?.current ?? null;
                  const awayScore = event.awayScore?.current ?? null;
                  const d = new Date(event.startTimestamp * 1000);

                  return (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="flex items-center gap-6 sm:gap-12 w-full max-w-lg">
                        <div className="flex-1 flex flex-col items-center gap-2">
                          <img
                            src={teamImageUrl(event.homeTeam.id)}
                            alt={event.homeTeam.name}
                            className="w-16 h-16 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <span className="font-display font-black text-center text-sm sm:text-base">{event.homeTeam.name}</span>
                        </div>

                        <div className="text-center flex-shrink-0">
                          {homeScore !== null ? (
                            <div className="font-display font-black text-5xl text-white">{homeScore} – {awayScore}</div>
                          ) : (
                            <div>
                              <div className="font-display font-black text-3xl text-white">VS</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-1.5 mt-2">
                            {isLive && <Circle className="w-2 h-2 text-green-400 fill-green-400 animate-pulse" />}
                            <span className={`text-xs font-bold uppercase ${status.color}`}>{status.label}</span>
                            {isLive && event.time?.played && (
                              <span className="text-xs text-green-400 font-black">{event.time.played}'</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-2">
                          <img
                            src={teamImageUrl(event.awayTeam.id)}
                            alt={event.awayTeam.name}
                            className="w-16 h-16 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <span className="font-display font-black text-center text-sm sm:text-base">{event.awayTeam.name}</span>
                        </div>
                      </div>

                      {homeScore !== null && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</span>
                          <span>·</span>
                          <span>{event.venue?.city?.name || ""} {event.venue?.stadium?.name ? `· ${event.venue.stadium.name}` : ""}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl">
              <div className="flex border-b border-border overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                      tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div className="py-6">
                {tab === "incidents" && id && <IncidentsTab id={id} />}
                {tab === "statistics" && id && <StatisticsTab id={id} />}
                {tab === "lineups" && id && <LineupsTab id={id} />}
                {tab === "h2h" && id && <H2HTab id={id} />}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
