import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAdminGetArticle, useCreateArticle, useUpdateArticle, usePublishArticle } from "@/hooks/use-articles";
import { useListTeams, useListCategories } from "@/hooks/use-system";
import { CustomDateTimePicker } from "@/components/ui/custom-datetime-picker";
import { ArrowLeft, Save, Send, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateArticleRequestStatus, CreateArticleRequest } from "@workspace/api-client-react";

export default function AdminArticleEditor() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/dashboard/artigos/:id/editar");
  const isEditing = !!params?.id;
  const articleId = isEditing ? parseInt(params.id) : undefined;
  
  const { data: existingArticle, isLoading: loadingArticle } = useAdminGetArticle(articleId as number, { query: { enabled: isEditing } });
  const { data: teams } = useListTeams();
  const { data: categories } = useListCategories();
  
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const publishMutation = usePublishArticle();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateArticleRequest>({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "La Liga",
    teamId: null as any, // Using any for initial setup before mapping
    authorName: "Redação La Liga Brasil",
    status: CreateArticleRequestStatus.draft,
    featured: false,
    breakingNews: false,
    scheduledAt: null as any,
    sourceName: "",
    sourceUrl: ""
  });

  useEffect(() => {
    if (existingArticle) {
      setFormData({
        title: existingArticle.title,
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
        sourceUrl: existingArticle.sourceUrl || ""
      });
    }
  }, [existingArticle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value === "" && name === "teamId" ? null : value }));
    }
  };

  const handleSave = async (forceStatus?: CreateArticleRequestStatus) => {
    const payload = { ...formData };
    if (forceStatus) payload.status = forceStatus;
    if (payload.teamId) payload.teamId = parseInt(payload.teamId as any);

    try {
      if (isEditing && articleId) {
        await updateMutation.mutateAsync({ id: articleId, data: payload });
        toast({ title: "Sucesso", description: "Artigo atualizado." });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Sucesso", description: "Artigo criado." });
        setLocation("/dashboard/artigos");
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
    }
  };

  if (isEditing && loadingArticle) return <div className="p-12 text-center text-white">Carregando editor...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border py-4 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/dashboard/artigos")} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold font-display uppercase tracking-tight">
            {isEditing ? 'Editar Artigo' : 'Novo Artigo'}
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border">
            {formData.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave(CreateArticleRequestStatus.draft)} 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-muted text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Salvar Rascunho
          </button>
          <button 
            onClick={() => handleSave(CreateArticleRequestStatus.published)} 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-5 py-2 bg-primary hover:bg-accent text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Publicar Agora
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-6xl mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Título do Artigo</label>
              <input 
                type="text" name="title" value={formData.title} onChange={handleChange}
                placeholder="Insira um título chamativo..."
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white font-display text-xl focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Resumo (Linha fina)</label>
              <textarea 
                name="excerpt" value={formData.excerpt} onChange={handleChange} rows={2}
                placeholder="Um breve resumo que aparecerá abaixo do título e nos cards..."
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">Conteúdo</label>
                <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded">Markdown suportado</span>
              </div>
              <textarea 
                name="content" value={formData.content} onChange={handleChange} rows={20}
                placeholder="Escreva a matéria aqui..."
                className="w-full bg-background border border-border rounded-lg px-4 py-4 text-gray-300 font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-y"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-5">
            <h3 className="font-bold border-b border-border pb-3 uppercase text-sm tracking-widest text-muted-foreground">Configurações</h3>
            
            <div>
              <label className="block text-sm mb-2 text-gray-300">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-input border border-border rounded-md px-3 py-2 text-white focus:border-primary focus:outline-none">
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="scheduled">Agendado</option>
              </select>
            </div>

            {formData.status === 'scheduled' && (
              <CustomDateTimePicker 
                label="Data de Publicação"
                value={formData.scheduledAt as string} 
                onChange={(iso) => setFormData(prev => ({...prev, scheduledAt: iso}))} 
              />
            )}

            <div>
              <label className="block text-sm mb-2 text-gray-300">Categoria</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-input border border-border rounded-md px-3 py-2 text-white focus:border-primary focus:outline-none uppercase text-sm">
                <option value="La Liga">La Liga</option>
                <option value="Transferências">Transferências</option>
                <option value="Resultados">Resultados</option>
                <option value="Análise">Análise</option>
                <option value="Entrevista">Entrevista</option>
                <option value="Internacional">Internacional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-300">Time Relacionado (Opcional)</label>
              <select name="teamId" value={formData.teamId || ""} onChange={handleChange} className="w-full bg-input border border-border rounded-md px-3 py-2 text-white focus:border-primary focus:outline-none">
                <option value="">-- Nenhum --</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-300">Autor</label>
              <input type="text" name="authorName" value={formData.authorName} onChange={handleChange} className="w-full bg-input border border-border rounded-md px-3 py-2 text-white focus:border-primary focus:outline-none" />
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} className="w-4 h-4 accent-primary bg-input border-border rounded" />
                <span className="text-sm group-hover:text-white transition-colors">Artigo em Destaque (Hero)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="breakingNews" checked={formData.breakingNews} onChange={handleChange} className="w-4 h-4 accent-primary bg-input border-border rounded" />
                <span className="text-sm group-hover:text-white transition-colors">Urgente (Ticker)</span>
              </label>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-5">
            <h3 className="font-bold border-b border-border pb-3 uppercase text-sm tracking-widest text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Imagem de Capa
            </h3>
            
            <div>
              <label className="block text-sm mb-2 text-gray-300">URL da Imagem</label>
              <input type="url" name="coverImage" value={formData.coverImage || ""} onChange={handleChange} placeholder="https://..." className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" />
            </div>

            {formData.coverImage && (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border">
                <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
          
          {formData.sourceName && (
             <div className="bg-card p-4 rounded-xl border border-primary/30 bg-primary/5">
                <p className="text-xs text-primary font-bold uppercase mb-1">Conteúdo Importado</p>
                <p className="text-sm">Fonte: <strong>{formData.sourceName}</strong></p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
