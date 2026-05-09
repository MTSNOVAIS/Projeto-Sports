import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/use-site-settings";
import { useAdminLeagues } from "@/hooks/use-leagues";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, Globe, Image, AlignLeft, Share2, Save, Eye,
  Twitter, Instagram, Youtube, Facebook, Link2, AlertCircle,
} from "lucide-react";

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.27 8.27 0 004.84 1.55V6.85a4.85 4.85 0 01-1.07-.16z" />
  </svg>
);

export default function AdminSiteSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const { data: leagues } = useAdminLeagues();
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
                Alterações não salvas
              </div>
            )}
            <a href="/" target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-white hover:border-white/20 transition-colors text-sm font-medium">
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

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Liga Principal</label>
              <select
                value={form.primaryLeagueId}
                onChange={(e) => handleChange("primaryLeagueId", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors"
              >
                <option value="">Nenhuma selecionada</option>
                {leagues?.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name} {l.country ? `(${l.country})` : ""}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Define qual liga é exibida por padrão nas seções de resultados e partidas.</p>
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
