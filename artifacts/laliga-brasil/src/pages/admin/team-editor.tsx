import React, { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Save, Archive, ArchiveRestore, Plus, Trash2,
  ChevronLeft, MapPin, Building2, Calendar, Palette,
  Link as LinkIcon, Trophy, AlertTriangle, Check, Image
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TITLE_COMPETITIONS = [
  "La Liga", "Copa del Rey", "Supercopa de España",
  "UEFA Champions League", "UEFA Europa League", "UEFA Conference League",
  "UEFA Super Cup", "FIFA Club World Cup", "Intercontinental Cup",
  "Segunda División", "Copa de la Liga",
];

interface TeamTitle {
  competition: string;
  count: number;
  lastYear?: string;
}

interface TeamData {
  id: number;
  name: string;
  slug: string;
  shortName: string;
  city: string;
  stadium: string;
  foundedYear: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  titles: TeamTitle[];
  archived: boolean;
  articleCount: number;
}

export default function AdminTeamEditor() {
  const [, params] = useRoute("/dashboard/times/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const [newTitle, setNewTitle] = useState<TeamTitle>({ competition: TITLE_COMPETITIONS[0], count: 1, lastYear: "" });
  const [addingTitle, setAddingTitle] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE}/api/admin/teams/${id}`)
      .then(r => r.json())
      .then(data => {
        setTeam({
          ...data,
          foundedYear: data.foundedYear ? String(data.foundedYear) : "",
          titles: Array.isArray(data.titles) ? data.titles : [],
        });
      })
      .catch(() => toast({ title: "Erro", description: "Não foi possível carregar o clube.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: keyof TeamData, value: any) => setTeam(prev => prev ? { ...prev, [key]: value } : prev);

  const handleSave = async () => {
    if (!team) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/admin/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...team,
          foundedYear: team.foundedYear ? parseInt(team.foundedYear) : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setTeam(prev => prev ? { ...prev, ...updated, titles: Array.isArray(updated.titles) ? updated.titles : [] } : prev);
      toast({ title: "Salvo!", description: "Clube atualizado com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!team) return;
    setArchiving(true);
    const action = team.archived ? "unarchive" : "archive";
    try {
      const res = await fetch(`${BASE}/api/admin/teams/${team.id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error();
      setTeam(prev => prev ? { ...prev, archived: !prev.archived } : prev);
      toast({
        title: team.archived ? "Clube reativado!" : "Clube arquivado (rebaixado).",
        description: team.archived ? "A página do clube está acessível novamente." : "A página pública do clube foi desativada.",
      });
    } catch {
      toast({ title: "Erro", description: "Falha na operação.", variant: "destructive" });
    } finally {
      setArchiving(false);
      setConfirmArchive(false);
    }
  };

  const addTitle = () => {
    if (!team || !newTitle.competition || newTitle.count < 1) return;
    const exists = team.titles.findIndex(t => t.competition === newTitle.competition);
    if (exists >= 0) {
      const updated = [...team.titles];
      updated[exists] = { ...newTitle };
      set("titles", updated);
    } else {
      set("titles", [...team.titles, { ...newTitle }]);
    }
    setAddingTitle(false);
    setNewTitle({ competition: TITLE_COMPETITIONS[0], count: 1, lastYear: "" });
  };

  const removeTitle = (competition: string) => {
    set("titles", team!.titles.filter(t => t.competition !== competition));
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!team) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <Shield className="w-16 h-16 opacity-20" />
      <p>Clube não encontrado.</p>
      <Link href="/dashboard/times" className="text-primary hover:underline">← Voltar aos clubes</Link>
    </div>
  );

  const totalTitles = team.titles.reduce((s, t) => s + (Number(t.count) || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/times" className="text-muted-foreground hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `${team.primaryColor}25`, border: `1.5px solid ${team.primaryColor}60` }}
            >
              {team.logoUrl
                ? <img src={team.logoUrl} alt={team.name} className="w-6 h-6 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                : <Shield className="w-4 h-4" style={{ color: team.primaryColor }} />}
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">{team.name}</h1>
              <span className="text-xs text-muted-foreground">{team.archived ? "🔴 Rebaixado / Arquivado" : "🟢 Ativo"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmArchive(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors border ${team.archived ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"}`}
          >
            {team.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            <span className="hidden sm:inline">{team.archived ? "Reativar" : "Arquivar (Rebaixamento)"}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-accent text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column — identity */}
          <div className="lg:col-span-1 space-y-6">

            {/* Logo preview */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Image className="w-3.5 h-3.5" /> Escudo</h2>
              <div
                className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{
                  background: `radial-gradient(circle, ${team.primaryColor}20, ${team.secondaryColor}10)`,
                  border: `3px solid ${team.primaryColor}50`,
                  boxShadow: `0 0 30px ${team.primaryColor}20`,
                }}
              >
                {team.logoUrl
                  ? <img src={team.logoUrl} alt={team.name} className="w-24 h-24 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                  : <Shield className="w-14 h-14" style={{ color: team.primaryColor }} />}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><LinkIcon className="w-3 h-3" /> URL do escudo</label>
                <input
                  type="text"
                  value={team.logoUrl || ""}
                  onChange={e => set("logoUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-muted-foreground mt-1">Cole a URL de uma imagem PNG/SVG do escudo.</p>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Palette className="w-3.5 h-3.5" /> Cores do Clube</h2>
              <div className="space-y-4">
                {([
                  { key: "primaryColor", label: "Cor Principal" },
                  { key: "secondaryColor", label: "Cor Secundária" },
                ] as const).map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="color"
                          value={team[key] || "#000000"}
                          onChange={e => set(key, e.target.value)}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                        />
                      </div>
                      <input
                        type="text"
                        value={team[key] || ""}
                        onChange={e => set(key, e.target.value)}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-primary focus:outline-none uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                ))}
                <div className="h-4 rounded-lg mt-2" style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor})` }} />
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-background rounded-xl p-3">
                  <div className="text-2xl font-black text-white">{team.articleCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">matérias</div>
                </div>
                <div className="bg-background rounded-xl p-3">
                  <div className="text-2xl font-black text-amber-400">{totalTitles}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">títulos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Identity */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary" /> Identidade</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: "name", label: "Nome completo", span: 2 },
                  { key: "shortName", label: "Nome curto / abreviação" },
                  { key: "slug", label: "Slug (URL)" },
                  { key: "city", label: "Cidade" },
                  { key: "stadium", label: "Estádio" },
                  { key: "foundedYear", label: "Ano de fundação" },
                ] as const).map(({ key, label, span }) => (
                  <div key={key} className={span === 2 ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={(team[key] as string) || ""}
                      onChange={e => set(key, e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Biography */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-primary" /> Biografia / Descrição</h2>
              <textarea
                value={team.description || ""}
                onChange={e => set("description", e.target.value)}
                rows={6}
                placeholder="Escreva uma descrição sobre o clube, sua história, conquistas marcantes, estilo de jogo..."
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white text-sm focus:border-primary focus:outline-none resize-none leading-relaxed transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1.5">{team.description?.length || 0} caracteres</p>
            </div>

            {/* Titles */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-amber-400" /> Títulos</h2>
                <button
                  onClick={() => setAddingTitle(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-white border border-primary/30 hover:border-primary px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>

              {team.titles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Nenhum título cadastrado ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {team.titles.sort((a, b) => b.count - a.count).map(title => (
                    <div key={title.competition} className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-2.5 group">
                      <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white text-sm">{title.competition}</span>
                        {title.lastYear && <span className="text-muted-foreground text-xs ml-2">(último: {title.lastYear})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">{title.count}</span>
                        <button
                          onClick={() => removeTitle(title.competition)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add title form */}
              {addingTitle && (
                <div className="mt-4 p-4 bg-background border border-primary/30 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-white">Adicionar título</h3>
                  <div>
                    <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Competição</label>
                    <select
                      value={newTitle.competition}
                      onChange={e => setNewTitle(p => ({ ...p, competition: e.target.value }))}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                    >
                      {TITLE_COMPETITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__custom">Outra competição...</option>
                    </select>
                  </div>
                  {newTitle.competition === "__custom" && (
                    <input
                      type="text"
                      placeholder="Nome da competição"
                      onChange={e => setNewTitle(p => ({ ...p, competition: e.target.value }))}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Quantidade</label>
                      <input
                        type="number"
                        min={1}
                        value={newTitle.count}
                        onChange={e => setNewTitle(p => ({ ...p, count: parseInt(e.target.value) || 1 }))}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Último ano</label>
                      <input
                        type="text"
                        placeholder="ex: 2023-24"
                        value={newTitle.lastYear || ""}
                        onChange={e => setNewTitle(p => ({ ...p, lastYear: e.target.value }))}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAddingTitle(false)} className="flex-1 py-2 bg-muted text-white rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancelar</button>
                    <button onClick={addTitle} className="flex-1 py-2 bg-primary hover:bg-accent text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Archive confirmation dialog */}
      {confirmArchive && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setConfirmArchive(false)}>
          <div className="bg-card border border-amber-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {team.archived ? "Reativar clube?" : "Arquivar clube?"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {team.archived
                ? `O clube <strong>${team.name}</strong> será reativado. A página pública ficará acessível novamente e ele voltará a aparecer na lista de times.`
                : `O clube <strong>${team.name}</strong> será marcado como rebaixado. A página pública ficará inacessível e ele não aparecerá na lista de times. As matérias vinculadas serão preservadas.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmArchive(false)} className="flex-1 py-2.5 bg-muted text-white rounded-xl font-bold hover:bg-white/10 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleArchive}
                disabled={archiving}
                className={`flex-1 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 ${team.archived ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-amber-600 hover:bg-amber-500 text-white"}`}
              >
                {archiving ? "Aguarde..." : team.archived ? "Sim, reativar" : "Sim, arquivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
