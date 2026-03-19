import React, { useState } from "react";
import { Link } from "wouter";
import { useListSources, useFetchFromSource } from "@/hooks/use-system";
import { useCreateArticle } from "@/hooks/use-articles";
import { DownloadCloud, Globe, Languages, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AdminImport() {
  const { data: sources, isLoading: loadingSources } = useListSources();
  const fetchMutation = useFetchFromSource();
  const createMutation = useCreateArticle();
  const { toast } = useToast();

  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [fetchStats, setFetchStats] = useState<{ realData: boolean; total: number } | null>(null);

  const handleFetch = async (sourceId: string) => {
    setActiveSource(sourceId);
    setLoadingFetch(true);
    setFetchStats(null);
    try {
      const source = sources?.find(s => s.id === sourceId);
      toast({ title: "Buscando...", description: `Carregando matérias de ${source?.name}...` });
      
      const res = await fetchMutation.mutateAsync({ data: { sourceId, maxArticles: 10 } });
      setArticles(res.articles);
      setFetchStats({ realData: res.realData || false, total: res.total });
      
      toast({ 
        title: "Sucesso!", 
        description: `${res.total} matérias carregadas` 
      });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao buscar matérias.", variant: "destructive" });
    } finally {
      setLoadingFetch(false);
    }
  };

  const handleImport = async (article: any) => {
    setImportingId(article.originalUrl);
    try {
      toast({ title: "Importando...", description: `Salvando matéria de ${article.sourceName}...` });
      
      await createMutation.mutateAsync({
        data: {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          category: "Internacional",
          authorName: "Redação (Tradução)",
          status: "draft",
          sourceName: article.sourceName,
          sourceUrl: article.originalUrl,
          featured: false,
          breakingNews: false
        }
      });

      toast({ title: "Sucesso!", description: "Matéria importada como rascunho." });
      setArticles(prev => prev.map(a => a.originalUrl === article.originalUrl ? { ...a, imported: true } : a));

    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha na importação.", variant: "destructive" });
    } finally {
      setImportingId(null);
    }
  };

  const activeSourceData = sources?.find(s => s.id === activeSource);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link> <span>/</span> <span className="text-white">Importador</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Zap className="text-primary" /> Importar Matérias
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Busque matérias de fontes internacionais confiáveis. As matérias são automaticamente traduzidas para português brasileiro usando IA e importadas como rascunhos para revisão.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sources List */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Fontes Disponíveis</h2>
            
            {loadingSources ? (
              <div className="p-4 text-center text-muted-foreground">Carregando fontes...</div>
            ) : sources?.map(source => (
              <button 
                key={source.id}
                onClick={() => handleFetch(source.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all group ${
                  activeSource === source.id 
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(219,0,55,0.1)]" 
                    : "bg-card border-border hover:border-primary/50 hover:bg-card/80"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <span className="font-bold text-white text-lg group-hover:text-primary transition-colors">{source.name}</span>
                    <p className="text-xs text-muted-foreground truncate mt-1">{source.url}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase whitespace-nowrap ml-2 ${
                    source.language === 'es' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {source.language === 'es' ? 'Espanhol' : 'Inglês'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{source.description}</p>
              </button>
            ))}
          </div>

          {/* Articles Preview */}
          <div className="lg:col-span-8">
            <div className="bg-card rounded-xl border border-border min-h-[500px] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-white">
                    {activeSourceData ? `Matérias de ${activeSourceData.name}` : 'Matérias Recentes'}
                  </h2>
                </div>
                {loadingFetch && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>

              {/* Status Bar */}
              {fetchStats && (
                <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-emerald-500/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-400">Matérias carregadas de {activeSourceData?.name}</span>
                </div>
              )}

              {/* Articles List */}
              <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-background/50">
                {!activeSource ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-20">
                    <DownloadCloud className="w-16 h-16 mb-4" />
                    <p className="text-center max-w-xs">Selecione uma fonte ao lado para buscar e importar matérias.</p>
                  </div>
                ) : loadingFetch ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-muted-foreground text-sm">Buscando matérias...</p>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Nenhuma matéria encontrada nesta fonte.</div>
                ) : (
                  articles.map((article, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-lg border flex flex-col sm:flex-row gap-4 transition-all ${
                        article.imported 
                          ? 'bg-muted/30 border-border/50 opacity-60' 
                          : 'bg-card border-border hover:border-primary/30 hover:shadow-md'
                      }`}
                    >
                      {/* Thumbnail */}
                      {article.coverImage ? (
                        <div className="w-full sm:w-40 aspect-video rounded overflow-hidden flex-shrink-0 bg-muted">
                          <img src={article.coverImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full sm:w-40 aspect-video rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Globe className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex gap-2 items-center mb-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                              {article.sourceName}
                            </span>
                            {article.imported && (
                              <span className="text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Importado
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-white leading-snug mb-2 line-clamp-2 group-hover:text-primary">
                            {article.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
                        </div>
                        
                        <div className="flex justify-between items-end mt-4 gap-2">
                          {article.originalUrl && (
                            <a 
                              href={article.originalUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:text-accent underline"
                            >
                              Ver original →
                            </a>
                          )}
                          <div className="flex gap-2 ml-auto">
                            {!article.imported && (
                              <button 
                                onClick={() => handleImport(article)}
                                disabled={importingId === article.originalUrl}
                                className="bg-white hover:bg-gray-200 text-black px-3 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {importingId === article.originalUrl ? (
                                  <><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</>
                                ) : (
                                  <><Languages className="w-3 h-3" /> Importar</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
