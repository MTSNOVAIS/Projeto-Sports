import React, { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminLeagues, useCreateLeague, useUpdateLeague, useDeleteLeague } from "@/hooks/use-leagues";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Globe, Trash2, Search, X, Check, Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { sofascoreSearch, sofascoreTournamentSeasons, tournamentImageUrl } from "@/hooks/use-sofascore";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function LeagueSearchPanel({ onAdded }: { onAdded: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const { toast } = useToast();
  const createLeague = useCreateLeague();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await sofascoreSearch(query);
        const tournaments = (data.uniqueTournaments || []).filter((t: any) =>
          t.category?.sport?.slug === "football" || !t.category?.sport?.slug
        );
        setResults(tournaments.slice(0, 12));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  async function handleAdd(tournament: any) {
    setAdding(tournament.id);
    try {
      const seasonsData = await sofascoreTournamentSeasons(tournament.id);
      const seasons: any[] = seasonsData.seasons || [];
      const currentSeason = seasons[0];

      await createLeague.mutateAsync({
        name: tournament.name,
        slug: slugify(tournament.name),
        country: tournament.category?.name || null,
        logoUrl: null,
        sofascoreId: tournament.id,
        currentSeasonId: currentSeason?.id || null,
      });

      toast({ title: "Liga adicionada!", description: `${tournament.name} adicionada com sucesso.` });
      setQuery("");
      setResults([]);
      onAdded();
    } catch (e: any) {
      if (e.message?.includes("409") || e.message?.includes("duplicate")) {
        toast({ title: "Já existe", description: "Essa liga já foi adicionada.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: e.message, variant: "destructive" });
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-6">
      <h2 className="font-bold text-white mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" /> Adicionar Liga
      </h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Digite o nome da liga (ex: Premier League, Brasileirão...)"
          className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-white text-sm focus:border-primary focus:outline-none transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 space-y-2"
          >
            {results.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 hover:border-primary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={tournamentImageUrl(t.id)}
                    alt=""
                    className="w-8 h-8 object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.category?.name}{t.category?.country?.name ? ` · ${t.category.country.name}` : ""}</p>
                </div>
                <button
                  onClick={() => handleAdd(t)}
                  disabled={adding === t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {adding === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Adicionar
                </button>
              </div>
            ))}
          </motion.div>
        )}
        {query && !searching && results.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground text-center py-4">Nenhum resultado encontrado para "{query}"</p>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeagueCard({ league, onDelete, onEdit }: { league: any; onDelete: () => void; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editingSeason, setEditingSeason] = useState(false);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const updateLeague = useUpdateLeague();
  const { toast } = useToast();

  async function loadSeasons() {
    if (!league.sofascoreId) return;
    setLoadingSeasons(true);
    try {
      const data = await sofascoreTournamentSeasons(league.sofascoreId);
      setSeasons(data.seasons || []);
    } catch {
      setSeasons([]);
    } finally {
      setLoadingSeasons(false);
    }
  }

  async function pickSeason(season: any) {
    try {
      await updateLeague.mutateAsync({ id: league.id, currentSeasonId: season.id });
      toast({ title: "Temporada atualizada!", description: season.name });
      setEditingSeason(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src={league.sofascoreId ? tournamentImageUrl(league.sofascoreId) : (league.logoUrl || "")}
            alt={league.name}
            className="w-8 h-8 object-contain"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white">{league.name}</h3>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
            {league.country && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{league.country}</span>}
            {league.sofascoreId && <span className="font-mono">Sofascore ID: {league.sofascoreId}</span>}
            {league.currentSeasonId && <span className="font-mono">Temporada: {league.currentSeasonId}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { setExpanded(v => !v); if (!expanded && seasons.length === 0) loadSeasons(); }}
            className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors text-xs flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Temporada ativa</p>
                {league.sofascoreId && (
                  <button
                    onClick={() => { setEditingSeason(v => !v); if (seasons.length === 0) loadSeasons(); }}
                    className="text-xs text-primary hover:underline font-bold"
                  >
                    Trocar temporada
                  </button>
                )}
              </div>
              {league.currentSeasonId ? (
                <p className="text-sm text-white font-mono">ID {league.currentSeasonId}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma temporada definida</p>
              )}

              {editingSeason && (
                <div className="mt-2">
                  {loadingSeasons ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando temporadas...</div>
                  ) : seasons.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem temporadas disponíveis</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {seasons.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => pickSeason(s)}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${s.id === league.currentSeasonId ? "bg-primary/10 text-primary font-bold border border-primary/30" : "hover:bg-white/5 text-white"}`}
                        >
                          <span>{s.name || s.year}</span>
                          <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminLeagues() {
  const { data: leagues = [], isLoading, refetch } = useAdminLeagues();
  const deleteLeague = useDeleteLeague();
  const { toast } = useToast();

  async function handleDelete(league: any) {
    if (!confirm(`Remover a liga "${league.name}"? Os times e partidas vinculados não serão removidos.`)) return;
    try {
      await deleteLeague.mutateAsync(league.id);
      toast({ title: "Liga removida." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black mb-1">Ligas</h1>
          <p className="text-muted-foreground text-sm">Pesquise e adicione ligas automaticamente. Todos os dados são importados do Sofascore.</p>
        </div>

        <LeagueSearchPanel onAdded={() => refetch()} />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">Nenhuma liga ainda.</p>
            <p className="text-sm mt-1">Use a busca acima para adicionar a primeira liga.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">{leagues.length} liga{leagues.length !== 1 ? "s" : ""} cadastrada{leagues.length !== 1 ? "s" : ""}</p>
            {(leagues as any[]).map((league: any) => (
              <LeagueCard
                key={league.id}
                league={league}
                onDelete={() => handleDelete(league)}
                onEdit={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
