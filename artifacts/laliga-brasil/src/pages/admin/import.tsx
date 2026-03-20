import React, { useState, useMemo, useRef } from "react";
import { Link } from "wouter";
import { useListTeams } from "@/hooks/use-teams";
import { useCreateArticle } from "@/hooks/use-articles";
import { DownloadCloud, Loader2, CheckCircle2, Search, Zap, X, Rss } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery } from "@tanstack/react-query";

const LA_LIGA_FILTERS = [
  { label: "La Liga", query: "La Liga" },
  { label: "Real Madrid", query: "Real Madrid" },
  { label: "Barcelona", query: "FC Barcelona" },
  { label: "Atlético Madrid", query: "Atlético de Madrid" },
  { label: "Sevilla", query: "Sevilla FC" },
  { label: "Athletic Club", query: "Athletic Club Bilbao" },
  { label: "Real Sociedad", query: "Real Sociedad" },
  { label: "Valencia", query: "Valencia CF" },
  { label: "Villarreal", query: "Villarreal CF" },
  { label: "Real Betis", query: "Real Betis" },
  { label: "Osasuna", query: "Osasuna" },
  { label: "Girona", query: "Girona FC" },
];

export default function AdminImport() {
  const { data: teams, isLoading: loadingTeams } = useListTeams();
  const createMutation = useCreateArticle();
  const { toast } = useToast();

  const [mode, setMode] = useState<"timeline" | "search">("timeline");
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [importingUrl, setImportingUrl] = useState<string | null>(null);
  const [importedUrls, setImportedUrls] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // Timeline feed (existing RSS sources)
  const { data: timelineData, isLoading: loadingTimeline } = useQuery({
    queryKey: ["scraper-all"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}api/scraper/fetch-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  // Search results
  const { data: searchData, isLoading: loadingSearch, refetch: runSearch } = useQuery({
    queryKey: ["scraper-search", activeQuery],
    queryFn: async () => {
      if (!activeQuery) return { articles: [] };
      const response = await fetch(`${import.meta.env.BASE_URL}api/scraper/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: activeQuery, maxResults: 6 }),
      });
      if (!response.ok) throw new Error("Failed to search");
      return response.json();
    },
    enabled: !!activeQuery && mode === "search",
    staleTime: 0,
  });

  const timelineArticles = timelineData?.articles || [];
  const searchArticles = searchData?.articles || [];

  const filteredTimeline = useMemo(() => {
    if (selectedTeams.length === 0) return timelineArticles;
    const selectedNames = teams
      ?.filter(t => selectedTeams.includes(t.id))
      .flatMap(t => [t.name.toLowerCase(), t.slug.toLowerCase()]) || [];
    return timelineArticles.filter((a: any) =>
      selectedNames.some(n => a.title.toLowerCase().includes(n))
    );
  }, [timelineArticles, selectedTeams, teams]);

  const displayedArticles = mode === "search" ? searchArticles : filteredTimeline;
  const isLoading = mode === "search" ? loadingSearch : loadingTimeline;

  const handleSearch = (q?: string) => {
    const query = q ?? searchInput.trim();
    if (!query) return;
    setActiveQuery(query);
    setMode("search");
    if (q) setSearchInput(q);
  };

  const handleFilterClick = (query: string) => {
    setSearchInput(query);
    handleSearch(query);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveQuery("");
    setMode("timeline");
  };

  const handleImport = async (article: any) => {
    setImportingUrl(article.originalUrl);
    try {
      const generateSlug = (title: string) =>
        title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 100) + "-" + Date.now().toString(36);

      toast({ title: "Importando...", description: `Salvando matéria de ${article.sourceName}...` });

      await createMutation.mutateAsync({
        data: {
          title: article.title,
          slug: generateSlug(article.title),
          subtitle: article.subtitle || "",
          excerpt: article.excerpt || article.subtitle || "",
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

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <span>/</span>
            <span className="text-white">Importador</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Zap className="text-primary" /> Importar Matérias
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Busque matérias de qualquer fonte ou navegue pela timeline das fontes cadastradas.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Buscar matérias... ex: Vini Jr, Transferências, Champions League"
                className="w-full bg-card border border-border rounded-xl pl-11 pr-10 py-3 text-white placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={!searchInput.trim() || loadingSearch}
              className="px-5 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loadingSearch && mode === "search" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>
        </div>

        {/* La Liga Quick Filters */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Filtros La Liga</p>
          <div className="flex flex-wrap gap-2">
            {LA_LIGA_FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => handleFilterClick(f.query)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeQuery === f.query && mode === "search"
                    ? "bg-primary border-primary text-white"
                    : "bg-muted/30 border-border text-muted-foreground hover:border-primary/60 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar — only in timeline mode */}
          {mode === "timeline" && (
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-4 sticky top-4">
                <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4 flex items-center justify-between">
                  <span>Filtrar por Time</span>
                  {selectedTeams.length > 0 && (
                    <button onClick={() => setSelectedTeams([])} className="text-xs text-primary hover:text-accent underline">
                      Limpar
                    </button>
                  )}
                </h2>
                {loadingTeams ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Carregando...</div>
                ) : (
                  <div className="space-y-2">
                    {teams?.map(team => (
                      <button
                        key={team.id}
                        onClick={() =>
                          setSelectedTeams(prev =>
                            prev.includes(team.id) ? prev.filter(id => id !== team.id) : [...prev, team.id]
                          )
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-sm ${
                          selectedTeams.includes(team.id)
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-muted/30 border-border hover:border-primary/50 text-muted-foreground hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{team.name}</span>
                          {selectedTeams.includes(team.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={mode === "timeline" ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {mode === "search" ? (
                    <>
                      <Search className="w-4 h-4 text-primary" />
                      <h2 className="font-bold text-white">
                        Resultados para "{activeQuery}"
                        {searchArticles.length > 0 && <span className="text-muted-foreground font-normal ml-2">({searchArticles.length} matérias)</span>}
                      </h2>
                    </>
                  ) : (
                    <>
                      <Rss className="w-4 h-4 text-primary" />
                      <h2 className="font-bold text-white">
                        Timeline{selectedTeams.length > 0 && ` (${filteredTimeline.length})`}
                      </h2>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {mode === "search" && (
                    <button
                      onClick={handleClearSearch}
                      className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 border border-border rounded-lg px-3 py-1.5 hover:border-border/80 transition-colors"
                    >
                      <Rss className="w-3 h-3" /> Ver timeline
                    </button>
                  )}
                </div>
              </div>

              {/* Articles */}
              <div className="p-6 space-y-4 max-h-[calc(100vh-380px)] overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground text-sm">
                      {mode === "search" ? "Buscando e traduzindo matérias..." : "Carregando e traduzindo matérias..."}
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Isso pode levar alguns segundos</p>
                  </div>
                ) : displayedArticles.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    {mode === "search" ? (
                      <>
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhuma matéria encontrada para "{activeQuery}".</p>
                        <p className="text-xs mt-1 opacity-60">Tente outro termo ou use os filtros de La Liga acima.</p>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhuma matéria disponível no momento.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedArticles.map((article: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all flex flex-col ${
                          importedUrls.has(article.originalUrl)
                            ? "bg-emerald-500/10 border-emerald-500/30 opacity-60"
                            : "bg-muted/20 border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                            {article.sourceName}
                          </span>
                          {importedUrls.has(article.originalUrl) && (
                            <span className="text-[10px] font-bold uppercase text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Importado
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-white leading-snug mb-1 text-sm flex-grow">
                          {article.title}
                        </h3>

                        {article.subtitle && (
                          <p className="text-xs text-gray-400 italic mb-2 line-clamp-2">
                            {article.subtitle}
                          </p>
                        )}

                        <div className="flex justify-between items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
                          {article.originalUrl && (
                            <a
                              href={article.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-accent underline truncate max-w-[120px]"
                            >
                              Ver original →
                            </a>
                          )}
                          {!importedUrls.has(article.originalUrl) && (
                            <button
                              onClick={() => handleImport(article)}
                              disabled={importingUrl === article.originalUrl}
                              className="bg-white hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto shrink-0"
                            >
                              {importingUrl === article.originalUrl ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Importando...
                                </span>
                              ) : "Importar"}
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
