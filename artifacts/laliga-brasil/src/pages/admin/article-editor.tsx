import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import {
  useAdminGetArticle,
  useCreateArticle,
  useUpdateArticle,
  usePublishArticle,
  useScheduleArticle,
  useUnpublishArticle,
} from "@/hooks/use-articles";
import { useListTeams, useListCategories } from "@/hooks/use-system";
import { useAuth } from "@/contexts/AuthContext";
import { CustomDateTimePicker } from "@/components/ui/custom-datetime-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
  Users,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Undo2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CreateArticleRequestStatus,
  CreateArticleRequest,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_BADGE: Record<
  string,
  { label: string; className: string; emoji: string }
> = {
  draft: {
    label: "Rascunho",
    className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    emoji: "📝",
  },
  published: {
    label: "Publicado",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    emoji: "🟢",
  },
  scheduled: {
    label: "Agendado",
    className: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    emoji: "⏱️",
  },
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default function AdminArticleEditor() {
  const [, setLocation] = useLocation();
  const [, editParams] = useRoute("/dashboard/artigos/:id/editar");
  const [, newParams] = useRoute("/dashboard/artigos/new");

  const isNewArticle = !!newParams;
  const isEditing = !!editParams?.id;
  const articleId = isEditing ? parseInt(editParams!.id) : undefined;

  const { user } = useAuth();
  const { data: existingArticle, isLoading: loadingArticle } = useAdminGetArticle(
    articleId as number,
    { query: { enabled: isEditing } },
  );
  const { data: teams } = useListTeams();
  const { data: categories } = useListCategories();

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const publishMutation = usePublishArticle();
  const scheduleMutation = useScheduleArticle();
  const unpublishMutation = useUnpublishArticle();
  const { toast } = useToast();

  const [formData, setFormData] = useState<
    CreateArticleRequest & { coAuthors?: string; subtitle?: string }
  >({
    title: "",
    subtitle: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "La Liga",
    teamId: null as any,
    authorName: user?.name || "Redação La Liga Brasil",
    status: CreateArticleRequestStatus.draft,
    featured: false,
    breakingNews: false,
    scheduledAt: null as any,
    sourceName: "",
    sourceUrl: "",
    coAuthors: "",
  });

  const [generatingSubtitle, setGeneratingSubtitle] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    null | "publish" | "schedule" | "unpublish"
  >(null);
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [tempScheduledAt, setTempScheduledAt] = useState<string>("");
  const [articleSlug, setArticleSlug] = useState<string | null>(null);

  // Track current persisted status for the badge (so it updates after publish)
  const [persistedStatus, setPersistedStatus] = useState<string>("draft");

  useEffect(() => {
    if (existingArticle) {
      setFormData({
        title: existingArticle.title,
        subtitle: existingArticle.subtitle || "",
        excerpt: existingArticle.excerpt,
        content: existingArticle.content,
        coverImage: existingArticle.coverImage || "",
        category: existingArticle.category,
        teamId: existingArticle.teamId || null,
        authorName: existingArticle.authorName,
        status: existingArticle.status as CreateArticleRequestStatus,
        featured: existingArticle.featured,
        breakingNews: existingArticle.breakingNews,
        scheduledAt: existingArticle.scheduledAt || null,
        sourceName: existingArticle.sourceName || "",
        sourceUrl: existingArticle.sourceUrl || "",
        coAuthors: "",
      });
      setPersistedStatus(existingArticle.status);
      setArticleSlug(existingArticle.slug);
      if (existingArticle.scheduledAt) {
        setTempScheduledAt(existingArticle.scheduledAt);
      }
    }
  }, [existingArticle]);

  useEffect(() => {
    if (!isEditing && user && formData.authorName === "Redação La Liga Brasil") {
      setFormData((prev) => ({ ...prev, authorName: user.name }));
    }
  }, [user, isEditing]);

  // Close publish menu when clicking outside
  useEffect(() => {
    if (!showPublishMenu) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-publish-menu]")) {
        setShowPublishMenu(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showPublishMenu]);

  // ---- Validation ----
  const validation = useMemo(() => {
    const issues: { field: string; message: string }[] = [];
    const plainContent = (formData.content || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!formData.title?.trim()) {
      issues.push({ field: "title", message: "Título é obrigatório" });
    } else if (formData.title.trim().length < 8) {
      issues.push({ field: "title", message: "Título muito curto (mín. 8 caracteres)" });
    }
    if (!plainContent) {
      issues.push({ field: "content", message: "Conteúdo é obrigatório" });
    } else if (plainContent.length < 80) {
      issues.push({
        field: "content",
        message: "Conteúdo muito curto (mín. 80 caracteres)",
      });
    }
    return { issues, isValid: issues.length === 0 };
  }, [formData.title, formData.content]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" && name === "teamId" ? null : value,
      }));
    }
  };

  const handleContentChange = (newContent: string) => {
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleGenerateSubtitle = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são necessários.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingSubtitle(true);
    try {
      const response = await fetch(`${BASE}/api/scraper/generate-subtitle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, content: formData.content }),
      });
      if (!response.ok) throw new Error("Failed to generate subtitle");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, subtitle: data.subtitle }));
      toast({ title: "Sucesso", description: "Subtítulo gerado com IA!" });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: "Falha ao gerar subtítulo.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSubtitle(false);
    }
  };

  function buildPayload(forceStatus?: CreateArticleRequestStatus) {
    const payload = { ...formData };
    if (forceStatus) payload.status = forceStatus;
    if (payload.teamId) payload.teamId = parseInt(payload.teamId as any);

    if (!payload.excerpt?.trim()) {
      if (payload.subtitle?.trim()) {
        payload.excerpt = payload.subtitle;
      } else {
        const plain = payload.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        payload.excerpt = plain.substring(0, 200).trim() + (plain.length > 200 ? "..." : "");
      }
    }
    const { coAuthors, ...apiPayload } = payload;
    return apiPayload as CreateArticleRequest;
  }

  /**
   * Save draft / schedule / generic save.
   * For instant publish on existing articles, we use the dedicated publish endpoint
   * (lighter and atomic) — see handlePublishNow below.
   */
  const handleSave = async (
    forceStatus?: CreateArticleRequestStatus,
    options?: { silent?: boolean },
  ) => {
    if (!validation.isValid) {
      toast({
        title: "Validação",
        description: validation.issues[0].message,
        variant: "destructive",
      });
      return null;
    }

    const apiPayload = buildPayload(forceStatus);

    try {
      if (isEditing && articleId) {
        const updated = await updateMutation.mutateAsync({
          id: articleId,
          data: apiPayload,
        });
        setPersistedStatus(updated.status);
        if ((updated as any).slug) setArticleSlug((updated as any).slug);
        if (!options?.silent) {
          toast({ title: "Sucesso", description: "Artigo atualizado." });
        }
        return updated;
      } else {
        const created = await createMutation.mutateAsync({ data: apiPayload });
        toast({ title: "Sucesso", description: "Artigo criado." });
        // Navigate to edit URL so subsequent actions can use the new id
        if ((created as any).id) {
          setLocation(`/dashboard/artigos/${(created as any).id}/editar`);
        } else {
          setLocation("/dashboard/artigos");
        }
        return created;
      }
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e.message || "Falha ao salvar.",
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Atomic publish for an existing article. First saves any pending changes,
   * then calls the dedicated publish endpoint.
   */
  const handlePublishNow = async () => {
    setShowPublishMenu(false);
    if (!validation.isValid) {
      toast({
        title: "Não é possível publicar",
        description: validation.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!isEditing) {
      // Create + publish in one save
      await handleSave(CreateArticleRequestStatus.published);
      return;
    }

    if (!articleId) return;

    try {
      // Save current changes first (silent), then publish atomically
      const saved = await handleSave(undefined, { silent: true });
      if (!saved) return;

      const published = await publishMutation.mutateAsync({ id: articleId });
      setPersistedStatus("published");
      setFormData((prev) => ({
        ...prev,
        status: CreateArticleRequestStatus.published,
        scheduledAt: null,
      }));
      if ((published as any).slug) setArticleSlug((published as any).slug);

      toast({
        title: "Publicado!",
        description: "Seu artigo está no ar e visível no site.",
      });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e.message || "Falha ao publicar.",
        variant: "destructive",
      });
    }
    setConfirmAction(null);
  };

  const handleScheduleConfirm = async () => {
    setShowPublishMenu(false);
    if (!tempScheduledAt) {
      toast({
        title: "Selecione uma data",
        description: "Defina quando o artigo deve ser publicado.",
        variant: "destructive",
      });
      return;
    }
    if (new Date(tempScheduledAt) <= new Date()) {
      toast({
        title: "Data inválida",
        description: "A data de agendamento precisa ser no futuro.",
        variant: "destructive",
      });
      return;
    }
    if (!validation.isValid) {
      toast({
        title: "Validação",
        description: validation.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!isEditing) {
      // Create then schedule
      const created = await handleSave(CreateArticleRequestStatus.draft);
      if (!created || !(created as any).id) return;
      try {
        await scheduleMutation.mutateAsync({
          id: (created as any).id,
          data: { scheduledAt: tempScheduledAt },
        });
        toast({
          title: "Agendado",
          description: `Será publicado em ${formatDate(tempScheduledAt)}.`,
        });
      } catch (e: any) {
        toast({
          title: "Erro",
          description: e.message || "Falha ao agendar.",
          variant: "destructive",
        });
      }
    } else if (articleId) {
      try {
        await handleSave(undefined, { silent: true });
        await scheduleMutation.mutateAsync({
          id: articleId,
          data: { scheduledAt: tempScheduledAt },
        });
        setPersistedStatus("scheduled");
        setFormData((prev) => ({
          ...prev,
          status: CreateArticleRequestStatus.scheduled,
          scheduledAt: tempScheduledAt as any,
        }));
        toast({
          title: "Agendado",
          description: `Será publicado em ${formatDate(tempScheduledAt)}.`,
        });
      } catch (e: any) {
        toast({
          title: "Erro",
          description: e.message || "Falha ao agendar.",
          variant: "destructive",
        });
      }
    }
    setConfirmAction(null);
  };

  const handleUnpublish = async () => {
    if (!articleId) return;
    try {
      await unpublishMutation.mutateAsync(articleId);
      setPersistedStatus("draft");
      setFormData((prev) => ({
        ...prev,
        status: CreateArticleRequestStatus.draft,
        scheduledAt: null,
      }));
      toast({
        title: "Despublicado",
        description: "O artigo voltou para rascunho.",
      });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e.message || "Falha ao despublicar.",
        variant: "destructive",
      });
    }
    setConfirmAction(null);
  };

  const isSavingAny =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    scheduleMutation.isPending ||
    unpublishMutation.isPending;

  if (isEditing && loadingArticle) {
    return <div className="p-12 text-center text-white">Carregando editor...</div>;
  }

  const badge = STATUS_BADGE[persistedStatus] ?? STATUS_BADGE.draft;
  const previewUrl = articleSlug ? `${BASE}/noticias/${articleSlug}` : null;

  return (
    <AdminLayout>
      <div className="min-h-full bg-background text-foreground pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-card to-card/80 border-b border-border/50 backdrop-blur py-4 px-6 flex justify-between items-center shadow-lg gap-3 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setLocation("/dashboard/artigos")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold font-display uppercase tracking-tight flex items-center gap-2 truncate">
                <FileText className="w-5 h-5 flex-shrink-0" />
                {isEditing ? "Editar Artigo" : "Novo Artigo"}
              </h1>
              {user && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Por {user.name}
                  {persistedStatus === "scheduled" && formData.scheduledAt && (
                    <> · agendado para {formatDate(formData.scheduledAt as any)}</>
                  )}
                  {persistedStatus === "published" && existingArticle?.publishedAt && (
                    <> · publicado em {formatDate(existingArticle.publishedAt)}</>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${badge.className}`}
            >
              {badge.emoji} {badge.label}
            </span>

            {previewUrl && persistedStatus === "published" && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                title="Abrir no site"
              >
                <Eye className="w-4 h-4" /> Visualizar
              </a>
            )}

            <button
              onClick={() => handleSave(CreateArticleRequestStatus.draft)}
              disabled={isSavingAny}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending || createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}{" "}
              Salvar
            </button>

            {persistedStatus === "published" ? (
              <button
                onClick={() => setConfirmAction("unpublish")}
                disabled={isSavingAny}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Undo2 className="w-4 h-4" /> Despublicar
              </button>
            ) : (
              <div className="relative" data-publish-menu>
                <div className="flex">
                  <button
                    onClick={() =>
                      validation.isValid
                        ? setConfirmAction("publish")
                        : toast({
                            title: "Não é possível publicar",
                            description: validation.issues[0].message,
                            variant: "destructive",
                          })
                    }
                    disabled={isSavingAny}
                    className="px-5 py-2 bg-primary hover:bg-accent text-white rounded-l-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {publishMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Publicar
                  </button>
                  <button
                    onClick={() => setShowPublishMenu((v) => !v)}
                    disabled={isSavingAny}
                    className="px-2 py-2 bg-primary hover:bg-accent text-white rounded-r-lg border-l border-white/10 transition-colors disabled:opacity-50"
                    aria-label="Mais opções de publicação"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {showPublishMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl p-3 z-20">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Agendar publicação
                    </p>
                    <CustomDateTimePicker
                      label=""
                      value={tempScheduledAt}
                      onChange={(iso) => setTempScheduledAt(iso)}
                    />
                    <button
                      onClick={() => setConfirmAction("schedule")}
                      disabled={!tempScheduledAt || isSavingAny}
                      className="w-full mt-3 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <CalendarClock className="w-4 h-4" /> Agendar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Validation banner */}
        {!validation.isValid && (
          <div className="container mx-auto px-4 max-w-7xl mt-6">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-300">
                  Antes de publicar, resolva:
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-yellow-200/90 list-disc list-inside">
                  {validation.issues.map((iss) => (
                    <li key={iss.field}>{iss.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="container mx-auto px-4 max-w-7xl mt-6 grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
          {/* Content column */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-sm">
              <div>
                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Título
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Insira um título impactante e descritivo..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-4 text-white font-display text-2xl font-bold focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all placeholder-muted-foreground/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length} caracteres
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2 justify-between">
                  <span>Subtítulo (IA)</span>
                  <button
                    type="button"
                    onClick={handleGenerateSubtitle}
                    disabled={generatingSubtitle || !formData.title || !formData.content}
                    className="px-3 py-1 bg-accent/20 hover:bg-accent/40 text-accent rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingSubtitle ? "Gerando..." : "Gerar com IA"}
                  </button>
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle || ""}
                  onChange={handleChange}
                  placeholder="Subtítulo complementar (gerado automaticamente ou manual)..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all placeholder-muted-foreground/50"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 space-y-4 shadow-sm">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Conteúdo do Artigo
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Comece a escrever seu artigo aqui. Use a barra de ferramentas acima para formatar..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6 h-fit">
            {/* Pre-publish checklist */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold uppercase text-sm tracking-widest text-muted-foreground border-b border-border pb-3 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Pronto para publicar
              </h3>
              <ul className="space-y-2 text-sm">
                <ChecklistItem
                  ok={!!formData.title.trim() && formData.title.trim().length >= 8}
                  label="Título com 8+ caracteres"
                />
                <ChecklistItem
                  ok={
                    (formData.content || "")
                      .replace(/<[^>]*>/g, " ")
                      .trim().length >= 80
                  }
                  label="Conteúdo com 80+ caracteres"
                />
                <ChecklistItem
                  ok={!!formData.coverImage}
                  label="Imagem de capa"
                  optional
                />
                <ChecklistItem
                  ok={!!formData.subtitle?.trim()}
                  label="Subtítulo definido"
                  optional
                />
                <ChecklistItem ok={!!formData.teamId} label="Time relacionado" optional />
              </ul>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold uppercase text-sm tracking-widest text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Autoria
              </h3>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Autor Principal
                </label>
                <div className="bg-background border border-primary/30 rounded-lg px-3 py-2 text-sm text-primary font-medium">
                  {formData.authorName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Co-autores (Opcional)
                </label>
                <textarea
                  name="coAuthors"
                  value={formData.coAuthors || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Separe os nomes por vírgula&#10;Ex: João Silva, Maria Santos"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-primary focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold uppercase text-sm tracking-widest text-muted-foreground border-b border-border pb-3">
                Configurações
              </h3>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Categoria
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-all"
                >
                  <option value="La Liga">La Liga</option>
                  <option value="Transferências">Transferências</option>
                  <option value="Resultados">Resultados</option>
                  <option value="Análise">Análise</option>
                  <option value="Entrevista">Entrevista</option>
                  <option value="Internacional">Internacional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Time Relacionado
                </label>
                <select
                  name="teamId"
                  value={formData.teamId || ""}
                  onChange={handleChange}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-all"
                >
                  <option value="">-- Nenhum --</option>
                  {teams?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
              <h3 className="font-bold uppercase text-sm tracking-widest text-muted-foreground border-b border-border pb-3">
                Destaques
              </h3>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Artigo em Destaque
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="breakingNews"
                  checked={formData.breakingNews}
                  onChange={handleChange}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Urgente (Ticker)
                </span>
              </label>

              {(formData.featured || formData.breakingNews) &&
                persistedStatus !== "published" && (
                  <p className="text-xs text-yellow-300/80 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 mt-2">
                    Os destaques só aparecem no site quando o artigo está publicado.
                  </p>
                )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold uppercase text-sm tracking-widest text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Imagem de Capa
              </h3>

              <input
                type="url"
                name="coverImage"
                value={formData.coverImage || ""}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-all"
              />

              {formData.coverImage && (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border/50">
                  <img
                    src={formData.coverImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>

            {formData.sourceName && (
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                <p className="text-xs text-primary font-bold uppercase mb-1">📰 Importado</p>
                <p className="text-sm text-primary/90">
                  Fonte: <strong>{formData.sourceName}</strong>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation modals */}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          formData={formData}
          tempScheduledAt={tempScheduledAt}
          isPending={isSavingAny}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction === "publish") return handlePublishNow();
            if (confirmAction === "schedule") return handleScheduleConfirm();
            if (confirmAction === "unpublish") return handleUnpublish();
          }}
        />
      )}
    </AdminLayout>
  );
}

function ChecklistItem({
  ok,
  label,
  optional,
}: {
  ok: boolean;
  label: string;
  optional?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
          ok
            ? "bg-emerald-500/20 text-emerald-400"
            : optional
              ? "bg-zinc-500/20 text-zinc-400"
              : "bg-yellow-500/20 text-yellow-400"
        }`}
      >
        {ok ? "✓" : optional ? "·" : "!"}
      </span>
      <span className={`text-xs ${ok ? "text-gray-300" : "text-muted-foreground"}`}>
        {label}
        {optional && !ok && (
          <span className="text-muted-foreground/60"> (opcional)</span>
        )}
      </span>
    </li>
  );
}

function ConfirmModal({
  action,
  formData,
  tempScheduledAt,
  isPending,
  onCancel,
  onConfirm,
}: {
  action: "publish" | "schedule" | "unpublish";
  formData: any;
  tempScheduledAt: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const config = {
    publish: {
      title: "Publicar artigo?",
      message: "O artigo ficará visível no site imediatamente.",
      confirmLabel: "Publicar agora",
      confirmClass: "bg-primary hover:bg-accent",
      icon: <Send className="w-5 h-5" />,
    },
    schedule: {
      title: "Agendar publicação?",
      message: `O artigo será publicado automaticamente em ${formatDate(tempScheduledAt)}.`,
      confirmLabel: "Agendar",
      confirmClass: "bg-sky-600 hover:bg-sky-500",
      icon: <CalendarClock className="w-5 h-5" />,
    },
    unpublish: {
      title: "Despublicar artigo?",
      message:
        "O artigo voltará para rascunho e será removido do site, mas o conteúdo será preservado.",
      confirmLabel: "Despublicar",
      confirmClass: "bg-zinc-700 hover:bg-zinc-600",
      icon: <Undo2 className="w-5 h-5" />,
    },
  }[action];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            {config.icon}
          </div>
          <div>
            <h3 className="font-display text-lg font-black text-white">{config.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{config.message}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
            Artigo
          </p>
          <p className="text-sm text-white font-bold line-clamp-2">{formData.title}</p>
          {formData.subtitle && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{formData.subtitle}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`px-5 py-2 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 ${config.confirmClass}`}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
