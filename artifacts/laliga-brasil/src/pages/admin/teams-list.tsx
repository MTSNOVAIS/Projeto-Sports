import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAdminListTeams, useUpdateTeam } from "@/hooks/use-teams";
import { Shield, Edit, MapPin, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminTeamsList() {
  const { data: teams, isLoading, refetch } = useAdminListTeams();
  const updateMutation = useUpdateTeam();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [editingTeam, setEditingTeam] = useState<any>(null);

  const handleSave = async () => {
    if (!editingTeam) return;
    try {
      await updateMutation.mutateAsync({ id: editingTeam.id, data: editingTeam });
      toast({ title: "Sucesso", description: "Time atualizado com sucesso!" });
      setEditingTeam(null);
      refetch();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao atualizar.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-card border-b border-border py-4 px-6 flex items-center gap-4 shadow-lg">
        <Link href="/dashboard" className="text-muted-foreground hover:text-white transition-colors text-sm">← Dashboard</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2"><Shield className="text-primary w-5 h-5" /> Times da La Liga</h1>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(teams || []).map(team => (
              <div key={team.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${team.primaryColor}30, ${team.secondaryColor}20)`, border: `2px solid ${team.primaryColor}50` }}>
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="w-9 h-9 object-contain" onError={e => e.currentTarget.style.display = 'none'} />
                    ) : (
                      <Shield className="w-6 h-6" style={{ color: team.primaryColor }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{team.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{team.city} · <Building2 className="w-3 h-3 ml-1" />{team.stadium}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{team.articleCount} matérias</span>
                  <button onClick={() => setEditingTeam({ ...team })} className="text-sm font-bold text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setEditingTeam(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-primary" /> Editar: {editingTeam.name}</h2>
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Nome completo' },
                { key: 'shortName', label: 'Nome curto' },
                { key: 'city', label: 'Cidade' },
                { key: 'stadium', label: 'Estádio' },
                { key: 'logoUrl', label: 'URL do escudo (imagem)' },
                { key: 'primaryColor', label: 'Cor primária (hex)' },
                { key: 'secondaryColor', label: 'Cor secundária (hex)' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={(editingTeam as any)[field.key] || ''}
                    onChange={e => setEditingTeam((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Descrição</label>
                <textarea
                  value={editingTeam.description || ''}
                  onChange={e => setEditingTeam((prev: any) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none resize-none"
                />
              </div>
              {editingTeam.logoUrl && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <img src={editingTeam.logoUrl} alt="Preview" className="w-12 h-12 object-contain" onError={e => e.currentTarget.style.display = 'none'} />
                  <div className="w-8 h-8 rounded-full" style={{ background: editingTeam.primaryColor }} />
                  <div className="w-8 h-8 rounded-full border border-border" style={{ background: editingTeam.secondaryColor }} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingTeam(null)} className="flex-1 py-2.5 bg-muted text-white rounded-lg font-bold hover:bg-white/10 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 py-2.5 bg-primary hover:bg-accent text-white rounded-lg font-bold transition-colors disabled:opacity-50">
                {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
