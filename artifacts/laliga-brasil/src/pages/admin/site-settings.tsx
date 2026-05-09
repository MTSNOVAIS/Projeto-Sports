import React, { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/use-site-settings";
import { useAdminLeagues, useCreateLeague } from "@/hooks/use-leagues";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, Globe, Image, AlignLeft, Share2, Save, Eye,
  Twitter, Instagram, Youtube, Facebook, Link2, AlertCircle,
  Search, X, Loader2, Plus, Trophy, Check, ChevronDown,
} from "lucide-react";
import { sofascoreSearch, sofascoreTournamentSeasons, tournamentImageUrl } from "@/hooks/use-sofascore";
import { AnimatePresence, motion } from "framer-motion";

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.27 8.27 0 004.84 1.55V6.85a4.85 4.85 0 01-1.07-.16z" />
  </svg>
);

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function LeaguePicker({
  value,
  onChange,
}: {
  value: string | number;
  onChange: (id: number) => void;
}) {
  const { data: leagues = [], refetch } = useAdminLeagues();
  const createLeague = useCreateLeague();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const leagueList = leagues as any[];
  const selected = leagueList.find((l) => l.id === Number(value));

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await sofascoreSearch(query);
        const tournaments = (data.uniqueTournaments || []).filter(
          (t: any) => t.category?.sport?.slug === "football" || !t.category?.sport?.slug
        );
        setResults(tournaments.slice(0, 10));
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

      const created = await createLeague.mutateAsync({
        name: tournament.name,
        slug: slugify(tournament.name),
        country: tournament.category?.name || null,
        logoUrl: null,
        sofascoreId: tournament.id,
        currentSeasonId: currentSeason?.id || null,
      });

      await refetch();
      onChange(created.id);
      setQuery("");
      setResults([]);
      setShowSearch(false);
      toast({ title: "Liga adicionada e selecionada!", description: tournament.name });
    } catch (e: any) {
      if (e.message?.includes("409") || e.message?.includes("duplicate")) {
        toast({ title: "Liga já existe", description: "Selecione ela na lista acima.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: e.message, variant: "destructive" });
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Dropdown of existing leagues */}
      <div className="relative">
        <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-background border border-border rounded-lg pl-10 pr-10 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors appearance-none"
        >
          <option value="">Nenhuma selecionada</option>
          {leagueList.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}{l.country ? ` (${l.country})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Selected league preview */}
      {selected && (
        <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={selected.sofascoreId ? tournamentImageUrl(selected.sofascoreId) : ""}
              alt={selected.name}
              className="w-6 h-6 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{selected.name}</p>
            {selected.country && <p className="text-xs text-muted-foreground">{selected.country}</p>}
          </div>
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </div>
      )}

      {/* Toggle search panel */}
      <button
        type="button"
        onClick={() => setShowSearch((v) => !v)}
        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-accent transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        {showSearch ? "Fechar busca" : leagueList.length === 0 ? "Buscar liga no SofaScore" : "Adicionar outra liga"}
      </button>

      {/* Inline SofaScore search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-background border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Buscar no SofaScore</p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                )}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: La Liga, Premier League, Champions…"
                  className="w-full bg-card border border-border rounded-lg pl-10 pr-10 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1.5 max-h-56 overflow-y-auto"
                  >
                    {results.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5 hover:border-primary/40 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img
                            src={tournamentImageUrl(t.id)}
                            alt=""
                            className="w-6 h-6 object-contain"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.category?.name}
                            {t.category?.country?.name ? ` · ${t.category.country.name}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdd(t)}
                          disabled={adding === t.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-accent text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {adding === t.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Plus className="w-3.5 h-3.5" />
                          }
                          {adding === t.id ? "Adicionando…" : "Adicionar"}
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
                {query && !searching && results.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    Nenhum resultado para "{query}"
                  </p>
                )}
                {!query && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Digite o nome da liga para buscar
                  </p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminSiteSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const update = useUpdateSiteSettings();
  const { toast } = useToast();

  const [form, setForm] = useState({
    siteName: "",
    siteTagline: "",
    logoUrl: "",
    logoText: "",
    footerBio: "",
    primaryLeagueId: "" as string | number,
    twitterUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings.siteName ?? "",
        siteTagline: settings.siteTagline ?? "",
        logoUrl: settings.logoUrl ?? "",
        logoText: settings.logoText ?? "",
        footerBio: settings.footerBio ?? "",
        primaryLeagueId: settings.primaryLeagueId ?? "",
        twitterUrl: settings.twitterUrl ?? "",
        instagramUrl: settings.instagramUrl ?? "",
        youtubeUrl: settings.youtubeUrl ?? "",
        facebookUrl: settings.facebookUrl ?? "",
        tiktokUrl: settings.tiktokUrl ?? "",
      });
      setDirty(false);
    }
  }, [settings]);

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function handleSave() {
    try {
      await update.mutateAsync({
        ...form,
        logoUrl: form.logoUrl || null,
        primaryLeagueId: form.primaryLeagueId ? Number(form.primaryLeagueId) : null,
        twitterUrl: form.twitterUrl || null,
        instagramUrl: form.instagramUrl || null,
        youtubeUrl: form.youtubeUrl || null,
        facebookUrl: form.facebookUrl || null,
        tiktokUrl: form.tiktokUrl || null,
      } as any);
      setDirty(false);
      toast({ title: "Configurações salvas", description: "As configurações do site foram atualizadas." });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Carregando...</div>
      </AdminLayout>
    );
  }

  const socialFields = [
    { key: "twitterUrl", label: "Twitter / X", icon: <Twitter className="w-5 h-5" />, placeholder: "https://twitter.com/seusite" },
    { key: "instagramUrl", label: "Instagram", icon: <Instagram className="w-5 h-5" />, placeholder: "https://instagram.com/seusite" },
    { key: "youtubeUrl", label: "YouTube", icon: <Youtube className="w-5 h-5" />, placeholder: "https://youtube.com/@seusite" },
    { key: "facebookUrl", label: "Facebook", icon: <Facebook className="w-5 h-5" />, placeholder: "https://facebook.com/seusite" },
    { key: "tiktokUrl", label: "TikTok", icon: <TikTokIcon />, placeholder: "https://tiktok.com/@seusite" },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black tracking-tight text-white">Configurações do Site</h1>
              <p className="text-sm text-muted-foreground">Identidade, bio e redes sociais</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dirty && (
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Alterações não salvas</span>
              </div>
            )}
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-white hover:border-white/20 transition-colors text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Ver Site
            </a>
            <button
              onClick={handleSave}
              disabled={update.isPending || !dirty}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-accent text-white text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {update.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        {/* Identity */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-white">Identidade do Site</h2>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nome do Site</label>
                <input
                  type="text"
                  value={form.siteName}
                  onChange={(e) => handleChange("siteName", e.target.value)}
                  placeholder="La Liga Brasil"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tagline / Subtítulo</label>
                <input
                  type="text"
                  value={form.siteTagline}
                  onChange={(e) => handleChange("siteTagline", e.target.value)}
                  placeholder="O futebol espanhol em português"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Liga Principal — with inline SofaScore search */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Liga Principal
              </label>
              <LeaguePicker
                value={form.primaryLeagueId}
                onChange={(id) => {
                  setForm((prev) => ({ ...prev, primaryLeagueId: id }));
                  setDirty(true);
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Define qual liga é exibida por padrão nas seções de resultados e partidas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Texto da Logo (fallback)</label>
              <input
                type="text"
                value={form.logoText}
                onChange={(e) => handleChange("logoText", e.target.value.slice(0, 4))}
                placeholder="LL"
                maxLength={4}
                className="w-32 bg-background border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">Exibido quando não há logo em imagem (máx. 4 caracteres).</p>
            </div>
          </div>
        </section>

        {/* Logo */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Image className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-white">Logo do Site</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">URL da Logo</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors"
                />
                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange("logoUrl", "")}
                    className="px-3 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-white hover:border-white/20 text-sm transition-colors"
                  >
                    Remover
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cole a URL de uma imagem PNG ou SVG (recomendado: fundo transparente).</p>
            </div>
            {form.logoUrl && (
              <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold">Preview:</div>
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="h-10 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
            {!form.logoUrl && (
              <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold">Fallback atual:</div>
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-display font-black">
                  {form.logoText || "LL"}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Bio */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <AlignLeft className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-white">Biografia do Site</h2>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Texto exibido no rodapé</label>
            <textarea
              value={form.footerBio}
              onChange={(e) => handleChange("footerBio", e.target.value)}
              rows={4}
              placeholder="Descreva o seu site..."
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white text-sm focus:border-primary focus:outline-none transition-colors resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.footerBio.length} caracteres</p>
          </div>
        </section>

        {/* Social */}
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-white">Redes Sociais</h2>
          </div>
          <div className="space-y-4">
            {socialFields.map(({ key, label, icon, placeholder }) => (
              <div key={key}>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <span className="text-muted-foreground">{icon}</span>
                  {label}
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={(form as any)[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Os ícones das redes sociais serão exibidos no rodapé do site. Deixe em branco para não exibir.</p>
        </section>

        {/* Save bottom */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={update.isPending || !dirty}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-accent text-white font-bold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {update.isPending ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
