import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminMatches, useCreateMatch, useUpdateMatch, useDeleteMatch } from "@/hooks/use-matches";
import { useSofascoreEvent, useSofascoreLaLigaSeasons, useSofascoreLaLigaLastEvents, useSofascoreLaLigaNextEvents } from "@/hooks/use-sofascore";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Eye, EyeOff, Star, StarOff, Search, Circle, ChevronDown, ChevronUp, X
} from "lucide-react";

function MatchPreview({ sofascoreId }: { sofascoreId: number }) {
  const { data } = useSofascoreEvent(sofascoreId);
  const event = data?.event;
  if (!event) return <span className="text-xs text-muted-foreground">ID: {sofascoreId}</span>;
  const homeScore = event.homeScore?.current;
  const awayScore = event.awayScore?.current;
  return (
    <div className="flex items-center gap-2">
      <img src={`https://api.sofascore.com/api/v1/team/${event.homeTeam.id}/image`} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <span className="font-bold text-sm text-white">{event.homeTeam.shortName || event.homeTeam.name}</span>
      {homeScore !== undefined ? (
        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{homeScore}–{awayScore}</span>
      ) : (
        <span className="text-xs text-muted-foreground">vs</span>
      )}
      <span className="font-bold text-sm text-white">{event.awayTeam.shortName || event.awayTeam.name}</span>
      <img src={`https://api.sofascore.com/api/v1/team/${event.awayTeam.id}/image`} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <span className={`text-xs font-bold ml-1 ${event.status.type === "inprogress" ? "text-green-400" : "text-muted-foreground"}`}>
        {event.status.type === "inprogress" ? "Ao Vivo" : event.status.type === "finished" ? "Encerrado" : ""}
      </span>
    </div>
  );
}

function SofascoreEventRow({ event, onAdd, alreadyAdded }: { event: any; onAdd: (e: any) => void; alreadyAdded: boolean }) {
  const homeScore = event.homeScore?.current;
  const awayScore = event.awayScore?.current;
  const d = new Date(event.startTimestamp * 1000);

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <img src={`https://api.sofascore.com/api/v1/team/${event.homeTeam.id}/image`} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="font-bold text-sm text-white">{event.homeTeam.name}</span>
          {homeScore !== undefined ? (
            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{homeScore}–{awayScore}</span>
          ) : (
            <span className="text-xs text-muted-foreground">vs</span>
          )}
          <span className="font-bold text-sm text-white">{event.awayTeam.name}</span>
          <img src={`https://api.sofascore.com/api/v1/team/${event.awayTeam.id}/image`} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" })} · Rodada {event.roundInfo?.round}
          {event.status.type === "inprogress" && <span className="text-green-400 ml-2 font-bold">• Ao Vivo</span>}
        </div>
      </div>
      <button
        onClick={() => onAdd(event)}
        disabled={alreadyAdded}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
          alreadyAdded
            ? "bg-white/10 text-muted-foreground cursor-not-allowed"
            : "bg-primary text-white hover:bg-accent"
        }`}
      >
        {alreadyAdded ? "Adicionado" : <><Plus className="w-3.5 h-3.5" /> Adicionar</>}
      </button>
    </div>
  );
}

function SearchSofaScore({ managedIds, onAdd }: { managedIds: Set<number>; onAdd: (e: any) => void }) {
  const [showSearch, setShowSearch] = useState(false);
  const [tabMode, setTabMode] = useState<"last" | "next">("last");
  const { data: seasonsData } = useSofascoreLaLigaSeasons();
  const seasonId = seasonsData?.seasons?.[0]?.id;
  const { data: lastData, isLoading: loadingLast } = useSofascoreLaLigaLastEvents(seasonId);
  const { data: nextData, isLoading: loadingNext } = useSofascoreLaLigaNextEvents(seasonId);

  const events: any[] = tabMode === "last"
    ? (lastData?.events || []).slice().reverse()
    : (nextData?.events || []);

  const isLoading = tabMode === "last" ? loadingLast : loadingNext;

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowSearch(!showSearch)}
        className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-bold hover:bg-accent transition-colors"
      >
        <Plus className="w-4 h-4" />
        Adicionar Partida
        {showSearch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm">La Liga — Rodadas</span>
                <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setTabMode("last")} className={`px-3 py-1 text-xs font-bold transition-colors ${tabMode === "last" ? "bg-primary text-white" : "text-muted-foreground"}`}>Recentes</button>
                  <button onClick={() => setTabMode("next")} className={`px-3 py-1 text-xs font-bold transition-colors ${tabMode === "next" ? "bg-primary text-white" : "text-muted-foreground"}`}>Próximas</button>
                </div>
              </div>
              <button onClick={() => setShowSearch(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-white/5 rounded" />)}
                </div>
              ) : (
                events.map((event: any) => (
                  <SofascoreEventRow
                    key={event.id}
                    event={event}
                    alreadyAdded={managedIds.has(event.id)}
                    onAdd={onAdd}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminMatches() {
  const { data: matches = [], isLoading } = useAdminMatches();
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const deleteMatch = useDeleteMatch();
  const { toast } = useToast();

  const managedIds = new Set<number>(matches.map((m: any) => m.sofascoreId));

  async function handleAdd(event: any) {
    try {
      await createMatch.mutateAsync({
        sofascoreId: event.id,
        homeTeamName: event.homeTeam.name,
        awayTeamName: event.awayTeam.name,
        homeTeamSofascoreId: event.homeTeam.id,
        awayTeamSofascoreId: event.awayTeam.id,
        tournament: event.tournament?.name || "La Liga",
        showInResults: true,
        featuredOnHome: false,
        pinnedOrder: 0,
      });
      toast({ title: "Partida adicionada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao adicionar partida", description: e.message, variant: "destructive" });
    }
  }

  async function handleToggleResults(match: any) {
    await updateMatch.mutateAsync({ id: match.id, showInResults: !match.showInResults });
  }

  async function handleToggleFeatured(match: any) {
    await updateMatch.mutateAsync({ id: match.id, featuredOnHome: !match.featuredOnHome });
    toast({ title: match.featuredOnHome ? "Removida dos destaques" : "Partida em destaque na homepage!" });
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover essa partida da gestão?")) return;
    await deleteMatch.mutateAsync(id);
    toast({ title: "Partida removida." });
  }

  const featuredCount = matches.filter((m: any) => m.featuredOnHome).length;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black mb-2">Partidas</h1>
          <p className="text-muted-foreground">Gerencie quais partidas aparecem na página de Resultados e no destaque da homepage.</p>
        </div>

        <SearchSofaScore managedIds={managedIds} onAdd={handleAdd} />

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl" />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhuma partida adicionada ainda.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Partida" para buscar jogos da La Liga.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match: any) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <MatchPreview sofascoreId={match.sofascoreId} />
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${match.showInResults ? "bg-green-500/10 text-green-400" : "bg-white/5 text-muted-foreground"}`}>
                      {match.showInResults ? "Nos Resultados" : "Oculto"}
                    </span>
                    {match.featuredOnHome && (
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-yellow-500/10 text-yellow-400">Destaque Homepage</span>
                    )}
                    <span className="text-xs text-muted-foreground">ID: {match.sofascoreId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(match)}
                    title={match.featuredOnHome ? "Remover destaque" : "Destacar na homepage"}
                    disabled={!match.featuredOnHome && featuredCount >= 1}
                    className={`p-2 rounded-lg transition-colors ${match.featuredOnHome ? "text-yellow-400 hover:bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {match.featuredOnHome ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleToggleResults(match)}
                    title={match.showInResults ? "Ocultar dos resultados" : "Mostrar nos resultados"}
                    className={`p-2 rounded-lg transition-colors ${match.showInResults ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:text-green-400 hover:bg-green-500/10"}`}
                  >
                    {match.showInResults ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDelete(match.id)}
                    className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
