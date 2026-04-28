import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminMatches, useCreateMatch, useUpdateMatch, useDeleteMatch, useBulkImportMatches } from "@/hooks/use-matches";
import { useAdminLeagues } from "@/hooks/use-leagues";
import {
  useSofascoreEvent,
  useSofascoreTournamentSeasons,
  useSofascoreTournamentLastEvents,
  useSofascoreTournamentNextEvents,
  useSofascoreTeamLastEvents,
  useSofascoreTeamNextEvents,
  teamImageUrl,
} from "@/hooks/use-sofascore";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Eye, EyeOff, Star, StarOff, Circle, ChevronDown, ChevronUp, X,
  Trophy, Users, Hash, CheckSquare, Square,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function MatchPreview({ sofascoreId }: { sofascoreId: number }) {
  const { data } = useSofascoreEvent(sofascoreId);
  const event = data?.event;
  if (!event) return <span className="text-xs text-muted-foreground">ID: {sofascoreId}</span>;
  const homeScore = event.homeScore?.current;
  const awayScore = event.awayScore?.current;
  return (
    <div className="flex items-center gap-2">
      <img src={teamImageUrl(event.homeTeam.id)} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <span className="font-bold text-sm text-white">{event.homeTeam.shortName || event.homeTeam.name}</span>
      {homeScore !== undefined ? (
        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{homeScore}–{awayScore}</span>
      ) : (
        <span className="text-xs text-muted-foreground">vs</span>
      )}
      <span className="font-bold text-sm text-white">{event.awayTeam.shortName || event.awayTeam.name}</span>
      <img src={teamImageUrl(event.awayTeam.id)} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <span className={`text-xs font-bold ml-1 ${event.status.type === "inprogress" ? "text-green-400" : "text-muted-foreground"}`}>
        {event.status.type === "inprogress" ? "Ao Vivo" : event.status.type === "finished" ? "Encerrado" : ""}
      </span>
    </div>
  );
}

function SofascoreEventRow({ event, onAdd, alreadyAdded, selected, onToggleSelect, multiMode }: {
  event: any;
  onAdd: (e: any) => void;
  alreadyAdded: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  multiMode?: boolean;
}) {
  const homeScore = event.homeScore?.current;
  const awayScore = event.awayScore?.current;
  const d = new Date(event.startTimestamp * 1000);

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 ${selected ? "bg-primary/5" : ""}`}>
      {multiMode && !alreadyAdded && (
        <button onClick={onToggleSelect} className="flex-shrink-0">
          {selected
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-muted-foreground" />}
        </button>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <img src={teamImageUrl(event.homeTeam.id)} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="font-bold text-sm text-white">{event.homeTeam.name}</span>
          {homeScore !== undefined ? (
            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{homeScore}–{awayScore}</span>
          ) : (
            <span className="text-xs text-muted-foreground">vs</span>
          )}
          <span className="font-bold text-sm text-white">{event.awayTeam.name}</span>
          <img src={teamImageUrl(event.awayTeam.id)} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" })}
          {event.roundInfo?.round && ` · Rodada ${event.roundInfo.round}`}
          {event.status.type === "inprogress" && <span className="text-green-400 ml-2 font-bold">• Ao Vivo</span>}
        </div>
      </div>
      {!multiMode && (
        <button
          onClick={() => onAdd(event)}
          disabled={alreadyAdded}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${
            alreadyAdded
              ? "bg-white/10 text-muted-foreground cursor-not-allowed"
              : "bg-primary text-white hover:bg-accent"
          }`}
        >
          {alreadyAdded ? "Adicionado" : <><Plus className="w-3.5 h-3.5" /> Adicionar</>}
        </button>
      )}
      {multiMode && alreadyAdded && (
        <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded flex-shrink-0">Já adicionado</span>
      )}
    </div>
  );
}

function TournamentImport({ managedIds, leagues, onAddSingle, onBulkAdd }: {
  managedIds: Set<number>;
  leagues: any[];
  onAddSingle: (e: any, leagueId?: number) => void;
  onBulkAdd: (events: any[], leagueId?: number) => void;
}) {
  const [tournamentId, setTournamentId] = useState("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [seasonId, setSeasonId] = useState<string>("");
  const [tabMode, setTabMode] = useState<"last" | "next">("last");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const effectiveTournamentId = selectedLeagueId
    ? leagues.find(l => l.id === Number(selectedLeagueId))?.sofascoreId
    : tournamentId;
  const effectiveSeasonId = selectedLeagueId
    ? (leagues.find(l => l.id === Number(selectedLeagueId))?.currentSeasonId || seasonId)
    : seasonId;

  const { data: seasonsData } = useSofascoreTournamentSeasons(effectiveTournamentId || undefined);
  const { data: lastData, isLoading: loadingLast } = useSofascoreTournamentLastEvents(effectiveTournamentId || undefined, effectiveSeasonId || undefined);
  const { data: nextData, isLoading: loadingNext } = useSofascoreTournamentNextEvents(effectiveTournamentId || undefined, effectiveSeasonId || undefined);

  const events: any[] = tabMode === "last"
    ? (lastData?.events || []).slice().reverse()
    : (nextData?.events || []);
  const isLoading = tabMode === "last" ? loadingLast : loadingNext;
  const leagueId = selectedLeagueId ? Number(selectedLeagueId) : undefined;

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedEvents = events.filter(e => selected.has(e.id) && !managedIds.has(e.id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Liga cadastrada</label>
          <select
            value={selectedLeagueId}
            onChange={e => { setSelectedLeagueId(e.target.value); setSeasonId(""); setSelected(new Set()); }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
          >
            <option value="">— Selecionar liga —</option>
            {leagues.filter(l => l.sofascoreId).map(l => (
              <option key={l.id} value={l.id}>{l.name} (ID: {l.sofascoreId})</option>
            ))}
          </select>
        </div>
        {!selectedLeagueId && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Ou ID manual do torneio</label>
            <input
              value={tournamentId}
              onChange={e => { setTournamentId(e.target.value); setSeasonId(""); setSelected(new Set()); }}
              placeholder="Ex: 8 (La Liga)"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            Temporada {selectedLeagueId && leagues.find(l => l.id === Number(selectedLeagueId))?.currentSeasonId ? "(detectada automaticamente)" : ""}
          </label>
          {seasonsData?.seasons?.length > 0 ? (
            <select
              value={seasonId || effectiveSeasonId}
              onChange={e => { setSeasonId(e.target.value); setSelected(new Set()); }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
            >
              <option value="">— Selecionar temporada —</option>
              {seasonsData.seasons.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
              ))}
            </select>
          ) : (
            <input
              value={seasonId}
              onChange={e => { setSeasonId(e.target.value); setSelected(new Set()); }}
              placeholder="Ex: 61643"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-primary focus:outline-none"
            />
          )}
        </div>
      </div>

      {(effectiveTournamentId && effectiveSeasonId) && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex bg-background border border-border rounded-lg overflow-hidden">
              <button onClick={() => setTabMode("last")} className={`px-3 py-1.5 text-xs font-bold transition-colors ${tabMode === "last" ? "bg-primary text-white" : "text-muted-foreground"}`}>Recentes</button>
              <button onClick={() => setTabMode("next")} className={`px-3 py-1.5 text-xs font-bold transition-colors ${tabMode === "next" ? "bg-primary text-white" : "text-muted-foreground"}`}>Próximas</button>
            </div>
            {selected.size > 0 && (
              <button
                onClick={() => { onBulkAdd(selectedEvents, leagueId); setSelected(new Set()); }}
                className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Importar {selected.size} selecionadas
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto border border-border rounded-xl p-3">
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-white/5 rounded" />)}
              </div>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma partida encontrada.</p>
            ) : (
              events.map((event: any) => (
                <SofascoreEventRow
                  key={event.id}
                  event={event}
                  alreadyAdded={managedIds.has(event.id)}
                  selected={selected.has(event.id)}
                  onToggleSelect={() => toggleSelect(event.id)}
                  multiMode
                  onAdd={(e) => onAddSingle(e, leagueId)}
                />
              ))
            )}
          </div>
          {selected.size === 0 && events.length > 0 && (
            <p className="text-xs text-muted-foreground">Selecione partidas para importar em lote, ou clique em uma para adicionar individualmente.</p>
          )}
        </>
      )}
    </div>
  );
}

function TeamImport({ managedIds, leagues, onAddSingle, onBulkAdd }: {
  managedIds: Set<number>;
  leagues: any[];
  onAddSingle: (e: any, leagueId?: number) => void;
  onBulkAdd: (events: any[], leagueId?: number) => void;
}) {
  const [teamId, setTeamId] = useState("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [tabMode, setTabMode] = useState<"last" | "next">("last");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: lastData, isLoading: loadingLast } = useSofascoreTeamLastEvents(teamId || undefined);
  const { data: nextData, isLoading: loadingNext } = useSofascoreTeamNextEvents(teamId || undefined);

  const events: any[] = tabMode === "last"
    ? (lastData?.events || []).slice().reverse()
    : (nextData?.events || []);
  const isLoading = tabMode === "last" ? loadingLast : loadingNext;
  const leagueId = selectedLeagueId ? Number(selectedLeagueId) : undefined;

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedEvents = events.filter(e => selected.has(e.id) && !managedIds.has(e.id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">ID do time na Sofascore</label>
          <input
            value={teamId}
            onChange={e => { setTeamId(e.target.value); setSelected(new Set()); }}
            placeholder="Ex: 2697 (Real Madrid)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-primary focus:outline-none"
          />
          <p className="text-xs text-muted-foreground mt-1">Encontre o ID na URL da Sofascore</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Liga (opcional)</label>
          <select
            value={selectedLeagueId}
            onChange={e => setSelectedLeagueId(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
          >
            <option value="">— Sem liga associada —</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {teamId && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex bg-background border border-border rounded-lg overflow-hidden">
              <button onClick={() => setTabMode("last")} className={`px-3 py-1.5 text-xs font-bold transition-colors ${tabMode === "last" ? "bg-primary text-white" : "text-muted-foreground"}`}>Recentes</button>
              <button onClick={() => setTabMode("next")} className={`px-3 py-1.5 text-xs font-bold transition-colors ${tabMode === "next" ? "bg-primary text-white" : "text-muted-foreground"}`}>Próximas</button>
            </div>
            {selected.size > 0 && (
              <button
                onClick={() => { onBulkAdd(selectedEvents, leagueId); setSelected(new Set()); }}
                className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Importar {selected.size} selecionadas
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto border border-border rounded-xl p-3">
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-white/5 rounded" />)}
              </div>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma partida encontrada.</p>
            ) : (
              events.map((event: any) => (
                <SofascoreEventRow
                  key={event.id}
                  event={event}
                  alreadyAdded={managedIds.has(event.id)}
                  selected={selected.has(event.id)}
                  onToggleSelect={() => toggleSelect(event.id)}
                  multiMode
                  onAdd={(e) => onAddSingle(e, leagueId)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ManualImport({ managedIds, leagues, onAddSingle }: {
  managedIds: Set<number>;
  leagues: any[];
  onAddSingle: (e: any, leagueId?: number) => void;
}) {
  const [sofascoreId, setSofascoreId] = useState("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [fetchId, setFetchId] = useState<string>("");

  const { data, isLoading, isError } = useSofascoreEvent(fetchId || undefined);
  const event = data?.event;
  const leagueId = selectedLeagueId ? Number(selectedLeagueId) : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">ID da partida (Sofascore)</label>
          <div className="flex gap-2">
            <input
              value={sofascoreId}
              onChange={e => setSofascoreId(e.target.value)}
              placeholder="Ex: 12345678"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => setFetchId(sofascoreId)}
              disabled={!sofascoreId}
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-accent transition-colors disabled:opacity-40"
            >
              Buscar
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Cole o ID da URL da Sofascore: sofascore.com/pt/futebol/.../ID</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Liga (opcional)</label>
          <select
            value={selectedLeagueId}
            onChange={e => setSelectedLeagueId(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
          >
            <option value="">— Sem liga associada —</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {fetchId && (
        <div className="border border-border rounded-xl p-4">
          {isLoading ? (
            <div className="animate-pulse h-12 bg-white/5 rounded" />
          ) : isError || !event ? (
            <p className="text-red-400 text-sm">Partida não encontrada. Verifique o ID.</p>
          ) : (
            <SofascoreEventRow
              event={event}
              alreadyAdded={managedIds.has(event.id)}
              onAdd={(e) => onAddSingle(e, leagueId)}
            />
          )}
        </div>
      )}
    </div>
  );
}

type ImportMode = "tournament" | "team" | "manual";

function SearchPanel({ managedIds, leagues, onAdd, onBulkAdd }: {
  managedIds: Set<number>;
  leagues: any[];
  onAdd: (e: any, leagueId?: number) => void;
  onBulkAdd: (events: any[], leagueId?: number) => void;
}) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<ImportMode>("tournament");

  const modes: { key: ImportMode; label: string; icon: React.ReactNode }[] = [
    { key: "tournament", label: "Por Campeonato", icon: <Trophy className="w-4 h-4" /> },
    { key: "team", label: "Por Clube", icon: <Users className="w-4 h-4" /> },
    { key: "manual", label: "Por ID", icon: <Hash className="w-4 h-4" /> },
  ];

  return (
    <div className="mb-6">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-bold hover:bg-accent transition-colors"
      >
        <Plus className="w-4 h-4" />
        Adicionar Partidas
        {show ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                {modes.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${mode === m.key ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {mode === "tournament" && (
                <TournamentImport managedIds={managedIds} leagues={leagues} onAddSingle={onAdd} onBulkAdd={onBulkAdd} />
              )}
              {mode === "team" && (
                <TeamImport managedIds={managedIds} leagues={leagues} onAddSingle={onAdd} onBulkAdd={onBulkAdd} />
              )}
              {mode === "manual" && (
                <ManualImport managedIds={managedIds} leagues={leagues} onAddSingle={onAdd} />
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
  const { data: leagues = [] } = useAdminLeagues();
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const deleteMatch = useDeleteMatch();
  const bulkImport = useBulkImportMatches();
  const { toast } = useToast();

  const managedIds = new Set<number>(matches.map((m: any) => m.sofascoreId));

  async function handleAdd(event: any, leagueId?: number) {
    try {
      await createMatch.mutateAsync({
        sofascoreId: event.id,
        homeTeamName: event.homeTeam.name,
        awayTeamName: event.awayTeam.name,
        homeTeamSofascoreId: event.homeTeam.id,
        awayTeamSofascoreId: event.awayTeam.id,
        tournament: event.tournament?.name || "La Liga",
        leagueId: leagueId || null,
        showInResults: true,
        featuredOnHome: false,
        pinnedOrder: 0,
      });
      toast({ title: "Partida adicionada!" });
    } catch (e: any) {
      toast({ title: "Erro ao adicionar partida", description: e.message, variant: "destructive" });
    }
  }

  async function handleBulkAdd(events: any[], leagueId?: number) {
    if (events.length === 0) { toast({ title: "Nenhuma partida nova selecionada." }); return; }
    try {
      const payload = events.map(event => ({
        sofascoreId: event.id,
        homeTeamName: event.homeTeam.name,
        awayTeamName: event.awayTeam.name,
        homeTeamSofascoreId: event.homeTeam.id,
        awayTeamSofascoreId: event.awayTeam.id,
        tournament: event.tournament?.name || "La Liga",
        leagueId: leagueId || null,
      }));
      const result = await bulkImport.mutateAsync(payload);
      toast({ title: `${result.added} partidas importadas!`, description: result.skipped > 0 ? `${result.skipped} já existiam.` : undefined });
    } catch (e: any) {
      toast({ title: "Erro na importação", description: e.message, variant: "destructive" });
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

        <SearchPanel managedIds={managedIds} leagues={leagues} onAdd={handleAdd} onBulkAdd={handleBulkAdd} />

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl" />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhuma partida adicionada ainda.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Partidas" para importar.</p>
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
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${match.showInResults ? "bg-green-500/10 text-green-400" : "bg-white/5 text-muted-foreground"}`}>
                      {match.showInResults ? "Nos Resultados" : "Oculto"}
                    </span>
                    {match.featuredOnHome && (
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-yellow-500/10 text-yellow-400">Destaque Homepage</span>
                    )}
                    {match.leagueId && leagues.find((l: any) => l.id === match.leagueId) && (
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-400">
                        {leagues.find((l: any) => l.id === match.leagueId)?.name}
                      </span>
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
