import React, { useState } from "react";
import { Link } from "wouter";
import { useAdminListArticles, useDeleteArticle } from "@/hooks/use-articles";
import { Search, Plus, Edit3, ExternalLink, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AdminArticlesList() {
  const [search, setSearch] = useState("");
  const { data: response, isLoading, refetch } = useAdminListArticles({ search, limit: 50 });
  const deleteMutation = useDeleteArticle();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast({ title: "Sucesso", description: "Artigo excluído com sucesso." });
        refetch();
      } catch (e) {
        toast({ title: "Erro", description: "Falha ao excluir artigo.", variant: "destructive" });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard" className="hover:text-white">Dashboard</Link> <span>/</span> <span className="text-white">Artigos</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white">Gerenciar Artigos</h1>
          </div>
          <Link href="/dashboard/artigos/new" className="bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Escrever Novo
          </Link>
        </header>

        <div className="bg-card rounded-xl border border-border p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar artigos..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          {/* Add more filters here later (status, category) */}
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Título</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Categoria</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {response?.articles.map(article => (
                    <tr key={article.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white mb-1 line-clamp-1">{article.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {format(parseISO(article.createdAt), "dd/MM/yyyy HH:mm")}
                          {article.sourceName && <span className="px-1.5 py-0.5 bg-secondary/50 rounded text-[10px] text-primary-foreground border border-primary/20">Importado</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                          article.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          article.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                          'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}>
                          {article.status === 'published' ? 'Publicado' : article.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground uppercase text-xs font-bold tracking-wider">{article.category}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          {article.status === 'published' && (
                            <Link href={`/noticias/${article.slug}`} target="_blank" className="p-2 bg-muted rounded hover:text-white hover:bg-white/10 transition-colors" title="Ver no site">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                          <Link href={`/dashboard/artigos/${article.id}/editar`} className="p-2 bg-muted rounded hover:text-primary hover:bg-primary/10 transition-colors" title="Editar">
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(article.id)} disabled={deleteMutation.isPending} className="p-2 bg-muted rounded text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {response?.articles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        Nenhum artigo encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
