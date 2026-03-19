import React from "react";
import { Link, useLocation } from "wouter";
import { useGetSiteStats } from "@/hooks/use-system";
import { FileText, Users, Eye, Edit3, Settings, LogOut, CheckCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

function AdminSidebar() {
  const [location] = useLocation();
  
  const links = [
    { href: "/dashboard", label: "Visão Geral", icon: <Eye className="w-5 h-5" /> },
    { href: "/dashboard/artigos", label: "Artigos", icon: <FileText className="w-5 h-5" /> },
    { href: "/dashboard/importar", label: "Importar Matérias", icon: <LogOut className="w-5 h-5 rotate-90" /> },
    { href: "/dashboard/times", label: "Times", icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col min-h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-display font-black">
            LL
          </div>
          <span className="font-display font-black text-xl tracking-tighter">
            ADMIN
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => {
          const active = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
          <Settings className="w-5 h-5" /> Configurações
        </button>
      </div>
    </aside>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: number, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-muted-foreground font-medium text-sm">{title}</h3>
        <div className="text-primary/80 bg-primary/10 p-2 rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-display font-bold text-white">{value}</div>
      {trend && <p className="text-xs text-emerald-500 mt-2 font-medium">{trend}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetSiteStats();

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Visão Geral</h1>
            <p className="text-muted-foreground mt-1">Estatísticas e atividades recentes do portal.</p>
          </div>
          <Link href="/dashboard/artigos/novo" className="bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20">
            <Edit3 className="w-4 h-4" /> Novo Artigo
          </Link>
        </header>

        {isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><div className="h-32 bg-card rounded-xl"></div><div className="h-32 bg-card rounded-xl"></div><div className="h-32 bg-card rounded-xl"></div><div className="h-32 bg-card rounded-xl"></div></div>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total de Visualizações" value={stats.totalViews} icon={<Eye className="w-5 h-5" />} trend="+12% nos últimos 7 dias" />
              <StatCard title="Artigos Publicados" value={stats.publishedArticles} icon={<CheckCircle className="w-5 h-5" />} />
              <StatCard title="Rascunhos" value={stats.draftArticles} icon={<FileText className="w-5 h-5" />} />
              <StatCard title="Agendados" value={stats.scheduledArticles} icon={<Clock className="w-5 h-5" />} />
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="font-bold text-lg text-white">Artigos Recentes</h2>
                <Link href="/dashboard/artigos" className="text-sm text-primary hover:underline">Ver todos</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4 font-medium">Título</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Categoria</th>
                      <th className="px-6 py-4 font-medium">Visualizações</th>
                      <th className="px-6 py-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.recentArticles.slice(0, 5).map(article => (
                      <tr key={article.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{article.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{format(parseISO(article.createdAt), "dd/MM/yyyy")}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            article.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' :
                            article.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {article.status === 'published' ? 'Publicado' : article.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground uppercase text-xs tracking-wider">{article.category}</td>
                        <td className="px-6 py-4 font-medium text-gray-300">{article.viewCount}</td>
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/artigos/${article.id}/editar`} className="text-primary hover:text-accent font-medium">Editar</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
