import React, { useState } from "react";
import { Link } from "wouter";
import { useListSources, useFetchFromSource, useTranslateArticle } from "@/hooks/use-system";
import { useCreateArticle } from "@/hooks/use-articles";
import { DownloadCloud, Globe, Languages, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AdminImport() {
  const { data: sources, isLoading: loadingSources } = useListSources();
  const fetchMutation = useFetchFromSource();
  const translateMutation = useTranslateArticle();
  const createMutation = useCreateArticle();
  const { toast } = useToast();

  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const handleFetch = async (sourceId: string) => {
    setActiveSource(sourceId);
    setLoadingFetch(true);
    try {
      const res = await fetchMutation.mutateAsync({ data: { sourceId, maxArticles: 10 } });
      setArticles(res.articles);
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao buscar matérias.", variant: "destructive" });
    } finally {
      setLoadingFetch(false);
    }
  };

  const handleImport = async (article: any) => {
    setImportingId(article.originalUrl); // Using URL as ID for ui state
    try {
      // 1. Translate
      toast({ title: "Processando...", description: "Traduzindo via IA..." });
      const translated = await translateMutation.mutateAsync({
        data: {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          sourceName: article.sourceName
        }
      });

      // 2. Create Draft
      toast({ title: "Processando...", description: "Criando rascunho..." });
      await createMutation.mutateAsync({
        data: {
          title: translated.title,
          excerpt: translated.excerpt,
          content: translated.content,
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
      // Remove from list or mark as imported
      setArticles(prev => prev.map(a => a.originalUrl === article.originalUrl ? { ...a, imported: true } : a));

    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha na importação.", variant: "destructive" });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <main className="flex-1 p-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link> <span>/</span> <span className="text-white">Importador AI</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <DownloadCloud className="text-primary" /> Importar e Traduzir
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Busque matérias de jornais internacionais renomados e utilize IA para traduzir e adaptar automaticamente para português brasileiro, mantendo os créditos originais.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sources List */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Fontes Disponíveis</h2>
            
            {loadingSources ? (
              <div className="p-4 text-center">Carregando fontes...</div>
            ) : sources?.map(source => (
              <button 
                key={source.id}
                onClick={() => handleFetch(source.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeSource === source.id 
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(219,0,55,0.1)]" 
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white text-lg">{source.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border uppercase font-bold">
                    {source.language}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{source.url}</p>
              </button>
            ))}
          </div>

          {/* Articles Preview */}
          <div className="lg:col-span-8">
            <div className="bg-card rounded-xl border border-border min-h-[500px] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Matérias Recentes
                </h2>
                {loadingFetch && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-background/50">
                {!activeSource ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-20">
                    <DownloadCloud className="w-16 h-16 mb-4" />
                    <p>Selecione uma fonte ao lado para buscar notícias.</p>
                  </div>
                ) : loadingFetch ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Nenhuma matéria encontrada.</div>
                ) : (
                  articles.map((article, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border flex flex-col sm:flex-row gap-4 transition-colors ${article.imported ? 'bg-muted/30 border-border/50 opacity-60' : 'bg-card border-border hover:border-primary/30'}`}>
                      {article.coverImage ? (
                        <div className="w-full sm:w-40 aspect-video rounded overflow-hidden flex-shrink-0 bg-muted">
                          <img src={article.coverImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full sm:w-40 aspect-video rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Globe className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex gap-2 items-center mb-1">
                            <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{article.sourceName}</span>
                          </div>
                          <h3 className="font-bold text-white leading-tight mb-2 line-clamp-2">{article.title}</h3>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          {article.imported ? (
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-md flex items-center gap-1">
                              Importado
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleImport(article)}
                              disabled={importingId === article.originalUrl}
                              className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                              {importingId === article.originalUrl ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Traduzindo...</>
                              ) : (
                                <><Languages className="w-3 h-3" /> Traduzir e Importar</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </div>
  );
}
