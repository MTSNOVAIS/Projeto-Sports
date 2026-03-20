import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAdminGetArticle, useCreateArticle, useUpdateArticle, usePublishArticle } from "@/hooks/use-articles";
import { useListTeams, useListCategories } from "@/hooks/use-system";
import { useAuth } from "@/contexts/AuthContext";
import { CustomDateTimePicker } from "@/components/ui/custom-datetime-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ArrowLeft, Save, Send, Image as ImageIcon, Users, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateArticleRequestStatus, CreateArticleRequest } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AdminArticleEditor() {
  const [, setLocation] = useLocation();
  const [, editParams] = useRoute("/dashboard/artigos/:id/editar");
  const [, newParams] = useRoute("/dashboard/artigos/new");
  
  const isNewArticle = !!newParams;
  const isEditing = !!editParams?.id;
  const articleId = isEditing ? parseInt(editParams!.id) : undefined;
  
  const { user } = useAuth();
  const { data: existingArticle, isLoading: loadingArticle } = useAdminGetArticle(articleId as number, { query: { enabled: isEditing } });
  const { data: teams } = useListTeams();
  const { data: categories } = useListCategories();
  
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const publishMutation = usePublishArticle();
  const { toast } = useToast();

  // Estado do formulário com suporte a co-autores
  const [formData, setFormData] = useState<CreateArticleRequest & { coAuthors?: string; subtitle?: string }>({
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
    coAuthors: ""
  });

  const [generatingSubtitle, setGeneratingSubtitle] = useState(false);

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
        coAuthors: ""
      });
    }
  }, [existingArticle]);

  // Atualizar author quando user muda
  useEffect(() => {
    if (!isEditing && user && formData.authorName === "Redação La Liga Brasil") {
      setFormData(prev => ({ ...prev, authorName: user.name }));
    }
  }, [user, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value === "" && name === "teamId" ? null : value }));
    }
  };

  const handleContentChange = (newContent: string) => {
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const handleGenerateSubtitle = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Erro", description: "Título e conteúdo são necessários.", variant: "destructive" });
      return;
    }

    setGeneratingSubtitle(true);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/scraper/generate-subtitle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate subtitle");
      const data = await response.json();
      
      setFormData(prev => ({ ...prev, subtitle: data.subtitle }));
      toast({ title: "Sucesso", description: "Subtítulo gerado com IA!" });
    } catch (e: any) {
      toast({ title: "Erro", description: "Falha ao gerar subtítulo.", variant: "destructive" });
    } finally {
      setGeneratingSubtitle(false);
    }
  };

  const handleSave = async (forceStatus?: CreateArticleRequestStatus) => {
    // Validações
    if (!formData.title.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório.", variant: "destructive" });
      return;
    }
    if (!formData.excerpt.trim()) {
      toast({ title: "Erro", description: "Resumo é obrigatório.", variant: "destructive" });
      return;
    }
    if (!formData.content.trim()) {
      toast({ title: "Erro", description: "Conteúdo é obrigatório.", variant: "destructive" });
      return;
    }

    const payload = { ...formData };
    if (forceStatus) payload.status = forceStatus;
    if (payload.teamId) payload.teamId = parseInt(payload.teamId as any);
    
    // Remover coAuthors do payload antes de enviar
    const { coAuthors, ...apiPayload } = payload;

    try {
      if (isEditing && articleId) {
        await updateMutation.mutateAsync({ id: articleId, data: apiPayload as CreateArticleRequest });
        toast({ title: "Sucesso", description: "Artigo atualizado." });
      } else {
        await createMutation.mutateAsync({ data: apiPayload as CreateArticleRequest });
        toast({ title: "Sucesso", description: "Artigo criado." });
        setLocation("/dashboard/artigos");
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
    }
  };

  if (isEditing && loadingArticle) return <div className="p-12 text-center text-white">Carregando editor...</div>;

  return (
    <AdminLayout>
      <div className="min-h-full bg-background text-foreground pb-20">
        {/* Header Sticky */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-card to-card/80 border-b border-border/50 backdrop-blur py-4 px-6 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLocation("/dashboard/artigos")} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold font-display uppercase tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {isEditing ? 'Editar Artigo' : 'Novo Artigo'}
              </h1>
              {user && <p className="text-xs text-muted-foreground mt-0.5">Por {user.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-muted text-muted-foreground border border-border">
              {formData.status}
            </span>
            <button 
              onClick={() => handleSave(CreateArticleRequestStatus.draft)} 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Rascunho
            </button>
            <button 
              onClick={() => handleSave(CreateArticleRequestStatus.published)} 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2 bg-primary hover:bg-accent text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Publicar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 max-w-7xl mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
          {/* Left Column - Content (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Título e Resumo */}
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
              </div>

              <div>
                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2 justify-between">
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
              
              <div>
                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Resumo / Linha Fina</label>
                <textarea 
                  name="excerpt" 
                  value={formData.excerpt} 
                  onChange={handleChange} 
                  rows={2}
                  placeholder="Um resumo impactante que aparecerá como subtítulo..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all resize-none placeholder-muted-foreground/50"
                />
              </div>
            </div>

            {/* Editor de Conteúdo */}
            <div className="bg-card border border-border rounded-2xl p-8 space-y-4 shadow-sm">
              <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Conteúdo do Artigo
              </label>
              <RichTextEditor 
                value={formData.content} 
                onChange={handleContentChange}
                placeholder="Comece a escrever seu artigo aqui. Use a barra de ferramentas acima para formatar..."
              />
            </div>
          </div>

          {/* Right Column - Sidebar (1/4 width) */}
          <div className="lg:col-span-1 space-y-6 h-fit">
            {/* Autor e Co-autores */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold uppercase text-sm tracking-widest text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Autoria
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Autor Principal</label>
                <div className="bg-background border border-primary/30 rounded-lg px-3 py-2 text-sm text-primary font-medium">
                  {formData.authorName}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Co-autores (Opcional)</label>
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

            {/* Configurações */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold uppercase text-sm tracking-widest text-muted-foreground border-b border-border pb-3">Configurações</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-all"
                >
                  <option value="draft">📝 Rascunho</option>
                  <option value="published">🔴 Publicado</option>
                  <option value="scheduled">⏱️ Agendado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Categoria</label>
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
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Time Relacionado</label>
                <select 
                  name="teamId" 
                  value={formData.teamId || ""} 
                  onChange={handleChange} 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-all"
                >
                  <option value="">-- Nenhum --</option>
                  {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {formData.status === 'scheduled' && (
                <CustomDateTimePicker 
                  label="Data de Publicação"
                  value={formData.scheduledAt as string} 
                  onChange={(iso) => setFormData(prev => ({...prev, scheduledAt: iso}))} 
                />
              )}
            </div>

            {/* Destaques */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
              <h3 className="font-bold uppercase text-sm tracking-widest text-muted-foreground border-b border-border pb-3">Destaques</h3>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="featured" 
                  checked={formData.featured} 
                  onChange={handleChange} 
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Artigo em Destaque</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="breakingNews" 
                  checked={formData.breakingNews} 
                  onChange={handleChange} 
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Urgente (Ticker)</span>
              </label>
            </div>

            {/* Imagem de Capa */}
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
                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                  />
                </div>
              )}
            </div>

            {/* Info do Artigo */}
            {formData.sourceName && (
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                <p className="text-xs text-primary font-bold uppercase mb-1">📰 Importado</p>
                <p className="text-sm text-primary/90">Fonte: <strong>{formData.sourceName}</strong></p>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}
