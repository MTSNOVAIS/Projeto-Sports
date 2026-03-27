import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminLeagues, useCreateLeague, useUpdateLeague, useDeleteLeague } from "@/hooks/use-leagues";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Trophy, Globe, X, Check, Search, ExternalLink } from "lucide-react";

interface LeagueForm {
  name: string;
  slug: string;
  country: string;
  logoUrl: string;
  sofascoreId: string;
  currentSeasonId: string;
}

const emptyForm: LeagueForm = {
  name: "",
  slug: "",
  country: "",
  logoUrl: "",
  sofascoreId: "",
  currentSeasonId: "",
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function LeagueFormModal({ league, onClose, onSave }: {
  league?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState<LeagueForm>(league ? {
    name: league.name,
    slug: league.slug,
    country: league.country || "",
    logoUrl: league.logoUrl || "",
    sofascoreId: league.sofascoreId ? String(league.sofascoreId) : "",
    currentSeasonId: league.currentSeasonId ? String(league.currentSeasonId) : "",
  } : emptyForm);

  const set = (k: keyof LeagueForm, v: string) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === "name" && !league) next.slug = slugify(v);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{league ? "Editar Liga" : "Nova Liga"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Nome *</label>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Ex: La Liga, Premier League..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Slug (URL) *</label>
              <input
                value={form.slug}
                onChange={e => set("slug", e.target.value)}
                placeholder="la-liga"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">País</label>
              <input
                value={form.country}
                onChange={e => set("country", e.target.value)}
                placeholder="Espanha"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">URL do Logo</label>
              <input
                value={form.logoUrl}
                onChange={e => set("logoUrl", e.target.value)}
                placeholder="https://..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">ID Sofascore</label>
              <input
                value={form.sofascoreId}
                onChange={e => set("sofascoreId", e.target.value)}
                placeholder="Ex: 8 (La Liga)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground mt-1">ID do torneio na Sofascore</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">ID Temporada Atual</label>
              <input
                value={form.currentSeasonId}
                onChange={e => set("currentSeasonId", e.target.value)}
                placeholder="Ex: 61643"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Busque na aba Partidas</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-muted/50 text-muted-foreground hover:text-white rounded-lg text-sm font-bold transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onSave({
              name: form.name,
              slug: form.slug,
              country: form.country,
              logoUrl: form.logoUrl || null,
              sofascoreId: form.sofascoreId ? Number(form.sofascoreId) : null,
              currentSeasonId: form.currentSeasonId ? Number(form.currentSeasonId) : null,
            })}
            className="flex-1 py-2.5 bg-primary hover:bg-accent text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLeagues() {
  const { data: leagues = [], isLoading } = useAdminLeagues();
  const createLeague = useCreateLeague();
  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editingLeague, setEditingLeague] = useState<any | null>(null);

  async function handleSave(data: any) {
    try {
      if (editingLeague) {
        await updateLeague.mutateAsync({ id: editingLeague.id, ...data });
        toast({ title: "Liga atualizada!" });
        setEditingLeague(null);
      } else {
        await createLeague.mutateAsync(data);
        toast({ title: "Liga criada!" });
        setShowCreate(false);
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-black mb-2">Ligas</h1>
            <p className="text-muted-foreground">Gerencie as ligas e campeonatos do site.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-bold hover:bg-accent transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Liga
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl" />)}
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">Nenhuma liga cadastrada.</p>
            <p className="text-sm mt-1">Adicione ligas para organizar times e partidas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map((league: any) => (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  {league.logoUrl ? (
                    <img src={league.logoUrl} alt={league.name} className="w-8 h-8 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <Trophy className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white">{league.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {league.country && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{league.country}</span>}
                    {league.sofascoreId && <span className="font-mono">ID: {league.sofascoreId}</span>}
                    {league.currentSeasonId && <span className="font-mono">Temporada: {league.currentSeasonId}</span>}
                    <span className="font-mono text-primary/70">/{league.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingLeague(league)}
                    className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(league)}
                    className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-card/50 border border-border rounded-xl">
          <h3 className="text-sm font-bold text-white mb-2">IDs Sofascore conhecidos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            {[
              { name: "La Liga", id: 8 },
              { name: "Premier League", id: 17 },
              { name: "Bundesliga", id: 35 },
              { name: "Serie A", id: 23 },
              { name: "Ligue 1", id: 34 },
              { name: "Champions League", id: 7 },
              { name: "Europa League", id: 679 },
              { name: "Brasileirão", id: 325 },
              { name: "Copa do Brasil", id: 390 },
            ].map(l => (
              <div key={l.id} className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                <span>{l.name}</span>
                <span className="font-mono text-primary">{l.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(showCreate || editingLeague) && (
        <LeagueFormModal
          league={editingLeague}
          onClose={() => { setShowCreate(false); setEditingLeague(null); }}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
}
