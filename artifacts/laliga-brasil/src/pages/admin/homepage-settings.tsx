import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useHomepageSettings, useUpdateHomepageSettings, HomepageSettings } from "@/hooks/use-homepage-settings";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Eye, LayoutDashboard, Flame, Mic, Newspaper, Tv, RotateCcw } from "lucide-react";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-primary" : "bg-white/10"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function NumberPicker({ value, onChange, min = 1, max = 12 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-lg bg-card border border-border hover:border-primary/50 text-white font-bold transition-colors flex items-center justify-center"
        disabled={value <= min}
      >
        –
      </button>
      <span className="w-8 text-center font-black text-white text-lg">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-lg bg-card border border-border hover:border-primary/50 text-white font-bold transition-colors flex items-center justify-center"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`bg-card border rounded-xl p-5 transition-all ${enabled ? "border-border" : "border-border/30 opacity-60"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${enabled ? "bg-primary/10" : "bg-white/5"}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-1">
            <h3 className="font-bold text-white">{title}</h3>
            <Toggle checked={enabled} onChange={onToggle} />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {enabled && children && (
            <div className="mt-4 space-y-4 pt-4 border-t border-border/50">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminHomepageSettings() {
  const { data: settings, isLoading } = useHomepageSettings();
  const updateSettings = useUpdateHomepageSettings();
  const { toast } = useToast();

  const [form, setForm] = useState<HomepageSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings && !form) {
      setForm(settings);
    }
  }, [settings]);

  function update<K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setIsDirty(true);
  }

  async function handleSave() {
    if (!form) return;
    try {
      await updateSettings.mutateAsync(form);
      setIsDirty(false);
      toast({ title: "Configurações salvas com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message, variant: "destructive" });
    }
  }

  function handleReset() {
    if (settings) {
      setForm(settings);
      setIsDirty(false);
    }
  }

  if (isLoading || !form) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl sm:text-3xl font-black">Página Inicial</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Controle quais seções aparecem na homepage, seus títulos e quantidades.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-muted-foreground hover:text-white border border-border hover:border-white/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </a>
            {isDirty && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-muted-foreground hover:text-white border border-border hover:border-white/30 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Desfazer</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty || updateSettings.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-sm"
            >
              {updateSettings.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </div>

        {isDirty && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2 text-sm text-primary font-bold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Há alterações não salvas
          </div>
        )}

        <div className="space-y-4">
          {/* Destaques */}
          <SectionCard
            icon={<Flame className={`w-5 h-5 ${form.showFeatured ? "text-yellow-400" : "text-muted-foreground"}`} />}
            title="Destaques"
            description="Artigos marcados como destaque no topo da homepage."
            enabled={form.showFeatured}
            onToggle={(v) => update("showFeatured", v)}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Título da seção</label>
                <input
                  type="text"
                  value={form.featuredTitle}
                  onChange={(e) => update("featuredTitle", e.target.value)}
                  className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Máximo de artigos</label>
                <p className="text-xs text-muted-foreground mt-0.5">Quantos destaques aparecem no carrossel</p>
              </div>
              <NumberPicker value={form.maxFeatured} onChange={(v) => update("maxFeatured", v)} min={1} max={6} />
            </div>
          </SectionCard>

          {/* Colunas */}
          <SectionCard
            icon={<Mic className={`w-5 h-5 ${form.showColunas ? "text-amber-400" : "text-muted-foreground"}`} />}
            title="Colunas / Colunistas"
            description="Seção com colunas recentes ou perfis dos colunistas."
            enabled={form.showColunas}
            onToggle={(v) => update("showColunas", v)}
          >
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Título da seção</label>
              <input
                type="text"
                value={form.colunasTitle}
                onChange={(e) => update("colunasTitle", e.target.value)}
                className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </SectionCard>

          {/* Últimas Notícias */}
          <SectionCard
            icon={<Newspaper className={`w-5 h-5 ${form.showLatest ? "text-primary" : "text-muted-foreground"}`} />}
            title="Últimas Notícias"
            description="Grade de artigos mais recentes publicados."
            enabled={form.showLatest}
            onToggle={(v) => update("showLatest", v)}
          >
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Título da seção</label>
              <input
                type="text"
                value={form.latestTitle}
                onChange={(e) => update("latestTitle", e.target.value)}
                className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Máximo de artigos</label>
                <p className="text-xs text-muted-foreground mt-0.5">Quantas notícias aparecem na grade</p>
              </div>
              <NumberPicker value={form.maxLatest} onChange={(v) => update("maxLatest", v)} min={2} max={12} />
            </div>
          </SectionCard>

          {/* Partida em Destaque (Sidebar) */}
          <SectionCard
            icon={<Tv className={`w-5 h-5 ${form.showSidebarMatch ? "text-blue-400" : "text-muted-foreground"}`} />}
            title="Partida em Destaque (Sidebar)"
            description="Card de partida fixada na coluna lateral da homepage."
            enabled={form.showSidebarMatch}
            onToggle={(v) => update("showSidebarMatch", v)}
          >
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Título do card</label>
              <input
                type="text"
                value={form.sidebarMatchTitle}
                onChange={(e) => update("sidebarMatchTitle", e.target.value)}
                className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-white">Dica:</span> As alterações entram em vigor assim que salvas. Clique em "Preview" para ver a homepage em tempo real após salvar.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
