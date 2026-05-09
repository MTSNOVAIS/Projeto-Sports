import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useHomepageSettings, useUpdateHomepageSettings, HomepageSettings } from "@/hooks/use-homepage-settings";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Save, Eye, LayoutDashboard, Flame, Mic, Newspaper, Tv,
  RotateCcw, Megaphone, Tag, Grid2x2, Grid3x3, Search,
} from "lucide-react";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-primary" : "bg-white/10"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function NumberPicker({ value, onChange, min = 1, max = 12 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-lg bg-card border border-border hover:border-primary/50 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-30"
        disabled={value <= min}
      >–</button>
      <span className="w-8 text-center font-black text-white text-lg">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-lg bg-card border border-border hover:border-primary/50 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-30"
        disabled={value >= max}
      >+</button>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{children}</label>
      {hint && <p className="text-xs text-muted-foreground/70 mt-0.5">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
    />
  );
}

function SectionCard({
  icon, title, description, enabled, onToggle, children,
}: {
  icon: React.ReactNode; title: string; description: string;
  enabled: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode;
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

const ANNOUNCEMENT_COLORS = [
  { value: "primary", label: "Vermelho", bg: "bg-primary", text: "text-white" },
  { value: "blue", label: "Azul", bg: "bg-blue-600", text: "text-white" },
  { value: "green", label: "Verde", bg: "bg-emerald-600", text: "text-white" },
  { value: "yellow", label: "Amarelo", bg: "bg-yellow-500", text: "text-black" },
  { value: "purple", label: "Roxo", bg: "bg-purple-600", text: "text-white" },
];

const CATEGORIES = [
  "Real Madrid", "Barcelona", "Atlético de Madrid", "Sevilla", "Valencia",
  "Villarreal", "Athletic Club", "Real Sociedad", "Betis", "Espanyol",
  "Getafe", "Osasuna", "Celta de Vigo", "Girona", "Rayo Vallecano",
  "Análise", "Transferências", "La Liga", "Champions League",
];

export default function AdminHomepageSettings() {
  const { data: settings, isLoading } = useHomepageSettings();
  const updateSettings = useUpdateHomepageSettings();
  const { toast } = useToast();

  const [form, setForm] = useState<HomepageSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings && !form) setForm(settings);
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
    if (settings) { setForm(settings); setIsDirty(false); }
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

  const selectedColor = ANNOUNCEMENT_COLORS.find((c) => c.value === form.announcementColor) ?? ANNOUNCEMENT_COLORS[0];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl sm:text-3xl font-black">Página Inicial</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Controle seções, títulos, quantidades, anúncios e SEO da homepage.
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
              {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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

          {/* ── Barra de Anúncio ── */}
          <SectionCard
            icon={<Megaphone className={`w-5 h-5 ${form.announcementEnabled ? "text-yellow-400" : "text-muted-foreground"}`} />}
            title="Barra de Anúncio"
            description="Faixa colorida no topo da homepage com texto e link opcionais."
            enabled={form.announcementEnabled}
            onToggle={(v) => update("announcementEnabled", v)}
          >
            <div>
              <FieldLabel hint="Texto exibido na barra">Mensagem</FieldLabel>
              <TextInput
                value={form.announcementText}
                onChange={(v) => update("announcementText", v)}
                placeholder="Ex: Acompanhe a La Liga ao vivo todos os fins de semana!"
              />
            </div>
            <div>
              <FieldLabel hint="Link para onde a barra redireciona ao clicar (opcional)">Link (opcional)</FieldLabel>
              <TextInput
                value={form.announcementLink ?? ""}
                onChange={(v) => update("announcementLink", v || null)}
                placeholder="https://... ou /resultados"
              />
            </div>
            <div>
              <FieldLabel>Cor</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {ANNOUNCEMENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => update("announcementColor", c.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${c.bg} ${c.text} ${form.announcementColor === c.value ? "border-white scale-105 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Preview */}
            {form.announcementText && (
              <div className={`rounded-lg px-4 py-2.5 text-sm font-bold text-center ${selectedColor.bg} ${selectedColor.text}`}>
                {form.announcementText}
                {form.announcementLink && <span className="ml-2 opacity-70 text-xs">→ {form.announcementLink}</span>}
              </div>
            )}
          </SectionCard>

          {/* ── Destaques ── */}
          <SectionCard
            icon={<Flame className={`w-5 h-5 ${form.showFeatured ? "text-yellow-400" : "text-muted-foreground"}`} />}
            title="Destaques"
            description="Artigos marcados como destaque no topo da homepage."
            enabled={form.showFeatured}
            onToggle={(v) => update("showFeatured", v)}
          >
            <div>
              <FieldLabel>Título da seção</FieldLabel>
              <TextInput value={form.featuredTitle} onChange={(v) => update("featuredTitle", v)} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <FieldLabel hint="Quantos destaques aparecem no carrossel">Máximo de artigos</FieldLabel>
              <NumberPicker value={form.maxFeatured} onChange={(v) => update("maxFeatured", v)} min={1} max={6} />
            </div>
          </SectionCard>

          {/* ── Seção de Categoria ── */}
          <SectionCard
            icon={<Tag className={`w-5 h-5 ${form.showCategorySection ? "text-sky-400" : "text-muted-foreground"}`} />}
            title="Seção de Categoria em Destaque"
            description="Exibe artigos de uma categoria específica em uma seção dedicada."
            enabled={form.showCategorySection}
            onToggle={(v) => update("showCategorySection", v)}
          >
            <div>
              <FieldLabel>Título da seção</FieldLabel>
              <TextInput
                value={form.categorySectionTitle}
                onChange={(v) => update("categorySectionTitle", v)}
                placeholder="Ex: Tudo sobre o Real Madrid"
              />
            </div>
            <div>
              <FieldLabel hint="Digite o nome da categoria ou selecione uma sugerida">Categoria</FieldLabel>
              <TextInput
                value={form.categorySection}
                onChange={(v) => update("categorySection", v)}
                placeholder="Ex: Real Madrid"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => update("categorySection", cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${form.categorySection === cat ? "bg-sky-500/20 border-sky-500/50 text-sky-300" : "bg-card border-border text-muted-foreground hover:text-white hover:border-white/30"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <FieldLabel hint="Quantos artigos mostrar nessa seção">Máximo de artigos</FieldLabel>
              <NumberPicker value={form.maxCategorySection} onChange={(v) => update("maxCategorySection", v)} min={2} max={8} />
            </div>
          </SectionCard>

          {/* ── Colunas ── */}
          <SectionCard
            icon={<Mic className={`w-5 h-5 ${form.showColunas ? "text-amber-400" : "text-muted-foreground"}`} />}
            title="Colunas / Colunistas"
            description="Seção com colunas recentes ou perfis dos colunistas."
            enabled={form.showColunas}
            onToggle={(v) => update("showColunas", v)}
          >
            <div>
              <FieldLabel>Título da seção</FieldLabel>
              <TextInput value={form.colunasTitle} onChange={(v) => update("colunasTitle", v)} />
            </div>
          </SectionCard>

          {/* ── Últimas Notícias ── */}
          <SectionCard
            icon={<Newspaper className={`w-5 h-5 ${form.showLatest ? "text-primary" : "text-muted-foreground"}`} />}
            title="Últimas Notícias"
            description="Grade de artigos mais recentes publicados."
            enabled={form.showLatest}
            onToggle={(v) => update("showLatest", v)}
          >
            <div>
              <FieldLabel>Título da seção</FieldLabel>
              <TextInput value={form.latestTitle} onChange={(v) => update("latestTitle", v)} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <FieldLabel hint="Quantas notícias aparecem na grade">Máximo de artigos</FieldLabel>
              <NumberPicker value={form.maxLatest} onChange={(v) => update("maxLatest", v)} min={2} max={12} />
            </div>
            <div>
              <FieldLabel hint="Número de colunas na grade de notícias">Layout da grade</FieldLabel>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => update("latestColumns", 2)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-colors ${form.latestColumns === 2 ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-white"}`}
                >
                  <Grid2x2 className="w-4 h-4" /> 2 colunas
                </button>
                <button
                  type="button"
                  onClick={() => update("latestColumns", 3)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-colors ${form.latestColumns === 3 ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-white"}`}
                >
                  <Grid3x3 className="w-4 h-4" /> 3 colunas
                </button>
              </div>
            </div>
          </SectionCard>

          {/* ── Partida em Destaque ── */}
          <SectionCard
            icon={<Tv className={`w-5 h-5 ${form.showSidebarMatch ? "text-blue-400" : "text-muted-foreground"}`} />}
            title="Partida em Destaque (Sidebar)"
            description="Card de partida fixada na coluna lateral da homepage."
            enabled={form.showSidebarMatch}
            onToggle={(v) => update("showSidebarMatch", v)}
          >
            <div>
              <FieldLabel>Título do card</FieldLabel>
              <TextInput value={form.sidebarMatchTitle} onChange={(v) => update("sidebarMatchTitle", v)} />
            </div>
          </SectionCard>

          {/* ── SEO ── */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white mb-1">SEO da Homepage</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Título e descrição exibidos nos resultados de busca e ao compartilhar o site.
                </p>
                <div className="space-y-4">
                  <div>
                    <FieldLabel hint="Deixe vazio para usar o nome padrão do site">Título da página</FieldLabel>
                    <TextInput
                      value={form.seoTitle ?? ""}
                      onChange={(v) => update("seoTitle", v || null)}
                      placeholder="La Liga Brasil — O futebol espanhol em português"
                    />
                  </div>
                  <div>
                    <FieldLabel hint="Recomendado: 150–160 caracteres">Meta descrição</FieldLabel>
                    <textarea
                      value={form.seoDescription ?? ""}
                      onChange={(e) => update("seoDescription", e.target.value || null)}
                      placeholder="Notícias, análises e resultados da La Liga em português. Acompanhe Real Madrid, Barcelona e todos os clubes espanhóis."
                      rows={3}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(form.seoDescription ?? "").length} / 160 caracteres
                    </p>
                  </div>
                  {(form.seoTitle || form.seoDescription) && (
                    <div className="bg-background border border-border/50 rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">Pré-visualização no Google</p>
                      <p className="text-blue-400 text-sm font-medium truncate">{form.seoTitle || "La Liga Brasil"}</p>
                      <p className="text-emerald-600 text-xs">laligabrasil.com.br</p>
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{form.seoDescription || "—"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
