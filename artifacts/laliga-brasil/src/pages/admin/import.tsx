import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListTeams } from "@/hooks/use-teams";
import { useCreateArticle } from "@/hooks/use-articles";
import { DownloadCloud, Loader2, CheckCircle2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery } from "@tanstack/react-query";

export default function AdminImport() {
  const { data: teams, isLoading: loadingTeams } = useListTeams();
  const createMutation = useCreateArticle();
  const { toast } = useToast();

  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [importingUrl, setImportingUrl] = useState<string | null>(null);
  const [importedUrls, setImportedUrls] = useState<Set<string>>(new Set());

  // Fetch articles from all sources
  const { data: articlesData, isLoading: loadingArticles } = useQuery({
    queryKey: ["scraper-all"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}api/scraper/fetch-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxArticles: 50 }),
      });
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
    enabled: true,
  });

  const articles = articlesData?.articles || [];

  const handleImport = async (article: any) => {
    setImportingUrl(article.originalUrl);
    try {
      const generateSlug = (title: string) => {
        return title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 100) + "-" + Date.now().toString(36);
      };

      toast({ title: "Importando...", description: `Salvando matéria de ${article.sourceName}...` });

      await createMutation.mutateAsync({
        data: {
          title: article.title,
          slug: generateSlug(article.title),
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          category: "Internacional",
          authorName: article.sourceName,
          status: "published",
          sourceName: article.sourceName,
          sourceUrl: article.originalUrl,
          featured: false,
          breakingNews: false,
        },
      });

      toast({ title: "Sucesso!", description: `Matéria publicada de ${article.sourceName}.` });
      setImportedUrls(prev => new Set([...prev, article.originalUrl]));
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha na importação.", variant: "destructive" });
    } finally {
      setImportingUrl(null);
    }
  };

  // Filter teams from selected ones
  const filteredArticles = useMemo(() => {
    if (selectedTeams.length === 0) {
      return articles;
    }

    const selectedTeamNames = teams
      ?.filter(t => selectedTeams.includes(t.id))
      .map(t => t.name.toLowerCase())
      .concat(teams?.filter(t => selectedTeams.includes(t.id)).map(t => t.slug.toLowerCase()) || []) || [];

    return articles.filter(article => {
      const titleLower = article.title.toLowerCase();
      return selectedTeamNames.some(name => titleLower.includes(name));
    });
  }, [articles, selectedTeams, teams]);

  const handleToggleTeam = (teamId: number) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

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
          <p className="text-muted-foreground mt-2 max-w-2xl">Visualize matérias de fontes internacionais. Filtre por times da La Liga e importe diretamente como rascunhos para edição.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Team Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-4 sticky top-4">
              <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4 flex items-center justify-between">
                <span>Filtrar por Time</span>
                {selectedTeams.length > 0 && (
                  <button
                    onClick={() => setSelectedTeams([])}
                    className="text-xs text-primary hover:text-accent underline"
                  >
                    Limpar
                  </button>
                )}
              </h2>

              {loadingTeams ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Carregando times...</div>
              ) : (
                <div className="space-y-2">
                  {teams?.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleToggleTeam(team.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-sm ${
                        selectedTeams.includes(team.id)
                          ? "bg-primary/20 border-primary text-white"
                          : "bg-muted/30 border-border hover:border-primary/50 text-muted-foreground hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{team.name}</span>
                        {selectedTeams.includes(team.id) && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Timeline */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-white">
                    Timeline de Matérias {selectedTeams.length > 0 && `(${filteredArticles.length})`}
                  </h2>
                </div>
                {loadingArticles && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>

              {/* Articles Timeline */}
              <div className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {loadingArticles ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-muted-foreground text-sm">Carregando matérias...</p>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DownloadCloud className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma matéria disponível no momento.</p>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhuma matéria encontrada para os times selecionados.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredArticles.map((article, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border transition-all ${
                          importedUrls.has(article.originalUrl)
                            ? "bg-emerald-500/10 border-emerald-500/30 opacity-60"
                            : "bg-muted/30 border-border hover:border-primary/30 hover:shadow-md"
                        }`}
                      >
                        {/* Source Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                            {article.sourceName}
                          </span>
                          {importedUrls.has(article.originalUrl) && (
                            <span className="text-[10px] font-bold uppercase text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Importado
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-white leading-snug mb-2">
                          {article.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {article.excerpt}
                        </p>

                        {/* Footer */}
                        <div className="flex justify-between items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex gap-2">
                            {article.originalUrl && (
                              <a
                                href={article.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-accent underline"
                              >
                                Ver original →
                              </a>
                            )}
                          </div>
                          {!importedUrls.has(article.originalUrl) && (
                            <button
                              onClick={() => handleImport(article)}
                              disabled={importingUrl === article.originalUrl}
                              className="bg-white hover:bg-gray-200 text-black px-3 py-2 rounded-md text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                            >
                              {importingUrl === article.originalUrl ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Importando...
                                </span>
                              ) : (
                                "Importar"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
