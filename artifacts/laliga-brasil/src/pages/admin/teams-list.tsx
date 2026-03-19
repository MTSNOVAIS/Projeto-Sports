import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAdminListTeams } from "@/hooks/use-teams";
import { Shield, Edit, MapPin, Building2, Archive, Search, Trophy, Plus } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AdminTeamsList() {
  const { data: teams, isLoading } = useAdminListTeams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [, setLocation] = useLocation();

  const filtered = (teams || []).filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.city.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "archived" ? t.archived : !t.archived;
    return matchSearch && matchFilter;
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Gerenciar Clubes</h1>
            <p className="text-sm text-muted-foreground">Adicione, edite ou gerencie os clubes da La Liga</p>
          </div>
          <button
            onClick={() => setLocation("/dashboard/times/new")}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-accent text-white rounded-lg text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Clube
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar clube..."
              className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(["active", "archived", "all"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === f ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-white"}`}
              >
                {{ active: "Ativos", archived: "Rebaixados", all: "Todos" }[f]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(team => {
              const titles: any[] = Array.isArray(team.titles) ? team.titles : [];
              const totalTitles = titles.reduce((sum: number, t: any) => sum + (Number(t.count) || 0), 0);
              return (
                <div
                  key={team.id}
                  className={`group relative bg-card border rounded-xl overflow-hidden transition-all hover:shadow-xl ${team.archived ? "border-border/40 opacity-60" : "border-border hover:border-primary/50 hover:shadow-primary/10"}`}
                >
                  {team.archived && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      <Archive className="w-2.5 h-2.5" /> REBAIXADO
                    </div>
                  )}

                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor})` }} />

                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${team.primaryColor}30, ${team.secondaryColor}20)`, border: `2px solid ${team.primaryColor}50` }}
                      >
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="w-10 h-10 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <Shield className="w-7 h-7" style={{ color: team.primaryColor }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate leading-tight">{team.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {team.city}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 flex-shrink-0" /> {team.stadium}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          {totalTitles} títulos
                        </span>
                        <span>{team.articleCount} matérias</span>
                      </div>
                      <Link
                        href={`/dashboard/times/${team.id}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum clube encontrado.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
