import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, Trash2, Globe, Tag, ToggleLeft, ToggleRight, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";

const BASE = import.meta.env.BASE_URL;

function useSettings(path: string) {
  return useQuery({
    queryKey: ["settings", path],
    queryFn: async () => {
      const res = await fetch(`${BASE}api/${path}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}

function useToggle(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch(`${BASE}api/${path}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", path] }),
  });
}

function useDelete(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}api/${path}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", path] }),
  });
}

function useCreate(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch(`${BASE}api/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to create"); }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", path] }),
  });
}

function AddSourceForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const create = useCreate("settings/sources");
  const [form, setForm] = useState({ name: "", url: "", rssFeed: "", language: "es" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast({ title: "Fonte adicionada!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center mb-1">
        <p className="font-bold text-white text-sm">Nova fonte</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Nome (ex: Marca)"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
        <input
          required
          placeholder="URL do site (ex: https://marca.com)"
          value={form.url}
          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
        <input
          placeholder="URL do RSS Feed"
          value={form.rssFeed}
          onChange={e => setForm(f => ({ ...f, rssFeed: e.target.value }))}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
        <select
          value={form.language}
          onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
        >
          <option value="es">Espanhol</option>
          <option value="en">Inglês</option>
          <option value="pt">Português</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-white transition-colors">Cancelar</button>
        <button type="submit" disabled={create.isPending} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2">
          {create.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          Adicionar
        </button>
      </div>
    </form>
  );
}

function AddTopicForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const create = useCreate("settings/topics");
  const [form, setForm] = useState({ label: "", query: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast({ title: "Tópico adicionado!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center mb-1">
        <p className="font-bold text-white text-sm">Novo tópico</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Rótulo (ex: Real Madrid)"
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
        <input
          required
          placeholder="Termo de busca (ex: Real Madrid FC)"
          value={form.query}
          onChange={e => setForm(f => ({ ...f, query: e.target.value }))}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-white transition-colors">Cancelar</button>
        <button type="submit" disabled={create.isPending} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2">
          {create.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          Adicionar
        </button>
      </div>
    </form>
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);

  const { data: sources = [], isLoading: loadingSources } = useSettings("settings/sources");
  const { data: topics = [], isLoading: loadingTopics } = useSettings("settings/topics");

  const toggleSource = useToggle("settings/sources");
  const deleteSource = useDelete("settings/sources");
  const toggleTopic = useToggle("settings/topics");
  const deleteTopic = useDelete("settings/topics");

  const handleDeleteSource = async (id: number, name: string) => {
    if (!confirm(`Remover a fonte "${name}"?`)) return;
    try {
      await deleteSource.mutateAsync(id);
      toast({ title: "Fonte removida" });
    } catch {
      toast({ title: "Erro ao remover fonte", variant: "destructive" });
    }
  };

  const handleDeleteTopic = async (id: number, label: string) => {
    if (!confirm(`Remover o tópico "${label}"?`)) return;
    try {
      await deleteTopic.mutateAsync(id);
      toast({ title: "Tópico removido" });
    } catch {
      toast({ title: "Erro ao remover tópico", variant: "destructive" });
    }
  };

  const langLabel: Record<string, string> = { es: "Espanhol", en: "Inglês", pt: "Português" };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <span>/</span>
            <span className="text-white">Configurações</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Settings className="text-primary" /> Configurações do Importador
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie as fontes da timeline e os tópicos destacados na tela de importação.
          </p>
        </div>

        {/* ── Sources ──────────────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-white text-lg">Fontes da Timeline</h2>
              <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                {sources.filter((s: any) => s.active).length} ativas
              </span>
            </div>
            <button
              onClick={() => setShowAddSource(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>

          {showAddSource && <div className="mb-3"><AddSourceForm onClose={() => setShowAddSource(false)} /></div>}

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loadingSources ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : sources.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm">Nenhuma fonte cadastrada.</p>
            ) : (
              <div className="divide-y divide-border">
                {sources.map((source: any) => (
                  <div key={source.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${source.active ? "text-white" : "text-muted-foreground"}`}>
                        {source.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{source.rssFeed || source.url}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                      {langLabel[source.language] || source.language}
                    </span>
                    <button
                      onClick={() => toggleSource.mutate({ id: source.id, active: !source.active })}
                      className={`shrink-0 transition-colors ${source.active ? "text-emerald-500 hover:text-emerald-400" : "text-muted-foreground hover:text-white"}`}
                      title={source.active ? "Desativar" : "Ativar"}
                    >
                      {source.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={() => handleDeleteSource(source.id, source.name)}
                      className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Topics ───────────────────────────────────────────────────────── */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-white text-lg">Tópicos Destacados</h2>
              <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                {topics.filter((t: any) => t.active).length} ativos
              </span>
            </div>
            <button
              onClick={() => setShowAddTopic(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>

          {showAddTopic && <div className="mb-3"><AddTopicForm onClose={() => setShowAddTopic(false)} /></div>}

          <p className="text-xs text-muted-foreground mb-3">
            Estes tópicos aparecem como filtros rápidos na tela de importação. O campo "Termo de busca" é o que o Google News recebe como query.
          </p>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loadingTopics ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : topics.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm">Nenhum tópico cadastrado.</p>
            ) : (
              <div className="divide-y divide-border">
                {topics.map((topic: any) => (
                  <div key={topic.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${topic.active ? "text-white" : "text-muted-foreground"}`}>
                        {topic.label}
                      </p>
                      <p className="text-xs text-muted-foreground">Busca: <span className="text-blue-400">{topic.query}</span></p>
                    </div>
                    <button
                      onClick={() => toggleTopic.mutate({ id: topic.id, active: !topic.active })}
                      className={`shrink-0 transition-colors ${topic.active ? "text-emerald-500 hover:text-emerald-400" : "text-muted-foreground hover:text-white"}`}
                      title={topic.active ? "Desativar" : "Ativar"}
                    >
                      {topic.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id, topic.label)}
                      className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
