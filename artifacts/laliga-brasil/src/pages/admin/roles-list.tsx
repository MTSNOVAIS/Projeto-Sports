import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Shield,
  ShieldCheck,
  Loader2,
  Save,
  Lock,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useAdminRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  type AdminRole,
} from "@/hooks/use-articles";

const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: "Visualizar Dashboard",
  manage_articles: "Gerenciar Artigos",
  create_articles: "Criar Artigos",
  edit_articles: "Editar Artigos",
  delete_articles: "Excluir Artigos",
  publish_articles: "Publicar Artigos",
  manage_teams: "Gerenciar Times",
  create_teams: "Criar Times",
  edit_teams: "Editar Times",
  delete_teams: "Excluir Times",
  manage_users: "Gerenciar Usuários",
  create_users: "Criar Usuários",
  edit_users: "Editar Usuários",
  delete_users: "Excluir Usuários",
  manage_roles: "Gerenciar Cargos",
  import_articles: "Importar Artigos",
  view_stats: "Visualizar Estatísticas",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

const PERMISSION_GROUPS: Array<{ title: string; ids: string[] }> = [
  { title: "Geral", ids: ["view_dashboard", "view_stats"] },
  {
    title: "Artigos",
    ids: [
      "manage_articles",
      "create_articles",
      "edit_articles",
      "delete_articles",
      "publish_articles",
      "import_articles",
    ],
  },
  {
    title: "Times",
    ids: ["manage_teams", "create_teams", "edit_teams", "delete_teams"],
  },
  {
    title: "Usuários e cargos",
    ids: [
      "manage_users",
      "create_users",
      "edit_users",
      "delete_users",
      "manage_roles",
    ],
  },
];

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function AdminRolesList() {
  const { toast } = useToast();
  const { data: roles = [], isLoading } = useAdminRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminRole | null>(null);

  const stats = useMemo(
    () => ({
      total: roles.length,
      system: roles.filter((r) => r.system).length,
      custom: roles.filter((r) => !r.system).length,
    }),
    [roles],
  );

  async function handleConfirmDelete() {
    if (!deleteCandidate) return;
    try {
      await deleteRole.mutateAsync(deleteCandidate.id);
      toast({ title: "Cargo excluído", description: deleteCandidate.name });
      setDeleteCandidate(null);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao excluir",
        variant: "destructive",
      });
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white">Cargos</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              Gerenciar Cargos
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Organize permissões em cargos personalizados. Cargos do sistema
              não podem ser excluídos.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-accent text-white px-5 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo cargo
          </button>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Do sistema" value={stats.system} />
          <StatCard label="Personalizados" value={stats.custom} accent="primary" />
        </div>

        {isLoading ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
            Carregando cargos…
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            Nenhum cargo cadastrado.
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={() => setEditing(role)}
                onDelete={() => setDeleteCandidate(role)}
              />
            ))}
          </div>
        )}

        {showCreate && (
          <RoleFormModal
            mode="create"
            isPending={createRole.isPending}
            onClose={() => setShowCreate(false)}
            onSubmit={async (vars) => {
              try {
                await createRole.mutateAsync(vars);
                toast({ title: "Cargo criado", description: vars.name });
                setShowCreate(false);
              } catch (err) {
                toast({
                  title: "Erro",
                  description: err instanceof Error ? err.message : "Falha ao criar",
                  variant: "destructive",
                });
              }
            }}
          />
        )}

        {editing && (
          <RoleFormModal
            mode="edit"
            initial={editing}
            isPending={updateRole.isPending}
            onClose={() => setEditing(null)}
            onSubmit={async (vars) => {
              try {
                await updateRole.mutateAsync({
                  id: editing.id,
                  name: vars.name,
                  description: vars.description,
                  permissions: vars.permissions,
                });
                toast({ title: "Cargo atualizado", description: vars.name });
                setEditing(null);
              } catch (err) {
                toast({
                  title: "Erro",
                  description: err instanceof Error ? err.message : "Falha ao salvar",
                  variant: "destructive",
                });
              }
            }}
          />
        )}

        {deleteCandidate && (
          <ConfirmDeleteModal
            role={deleteCandidate}
            isPending={deleteRole.isPending}
            onCancel={() => setDeleteCandidate(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// ---------- Sub-components ----------

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "primary";
}) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </p>
      <p
        className={`text-2xl font-display font-black mt-1 ${
          accent === "primary" ? "text-primary" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: AdminRole;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const labels = role.permissions
    .map((p) => PERMISSION_LABELS[p])
    .filter((v): v is string => Boolean(v));

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 hover:border-primary/40 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-black text-lg text-white">
              {role.name}
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground bg-background border border-border rounded px-2 py-0.5">
              {role.key}
            </span>
            {role.system && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                <Lock className="w-3 h-3" />
                Sistema
              </span>
            )}
          </div>
          {role.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {role.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider bg-white/5 text-white border border-border hover:bg-white/10 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={onDelete}
            disabled={role.system}
            title={role.system ? "Cargo do sistema não pode ser excluído" : "Excluir"}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Permissões ({role.permissions.length})
        </p>
        {labels.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Sem permissões configuradas.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-md px-2 py-1 text-xs font-medium"
              >
                <Check className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-4">
        Criado em {formatDate(role.createdAt)}
      </p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`bg-card rounded-2xl border border-border w-full ${
          size === "lg" ? "max-w-2xl" : "max-w-md"
        } my-8 shadow-2xl`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-black text-lg text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
      {children}
    </label>
  );
}

const inputClass =
  "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

interface RoleFormPayload {
  name: string;
  description: string;
  permissions: string[];
}

function RoleFormModal({
  mode,
  initial,
  isPending,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: AdminRole;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: RoleFormPayload) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(initial?.permissions ?? []),
  );

  function togglePermission(id: string) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(ids: string[]) {
    setPermissions((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function selectAll() {
    setPermissions(new Set(ALL_PERMISSIONS));
  }
  function clearAll() {
    setPermissions(new Set());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void onSubmit({
      name: name.trim(),
      description: description.trim(),
      permissions: Array.from(permissions),
    });
  }

  return (
    <ModalShell
      title={mode === "create" ? "Criar novo cargo" : `Editar ${initial?.name ?? "cargo"}`}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nome do cargo</FieldLabel>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Ex: Moderador"
              required
              maxLength={50}
            />
          </div>
          <div>
            <FieldLabel>Descrição</FieldLabel>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="Breve descrição do cargo"
              maxLength={150}
            />
          </div>
        </div>

        {initial?.system && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Este é um cargo do sistema. Você pode ajustar nome, descrição e
              permissões, mas não pode excluí-lo.
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <FieldLabel>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Permissões ({permissions.size})
              </span>
            </FieldLabel>
            <div className="flex gap-2 -mt-1">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                Marcar todas
              </button>
              <span className="text-muted-foreground/30">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="space-y-3 bg-background/40 border border-border rounded-xl p-3 max-h-80 overflow-y-auto">
            {PERMISSION_GROUPS.map((group) => {
              const groupAllSelected = group.ids.every((id) =>
                permissions.has(id),
              );
              return (
                <div
                  key={group.title}
                  className="rounded-lg bg-background border border-border overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.ids)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-card/40 hover:bg-card/70 transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                      {group.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        groupAllSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {groupAllSelected ? "Todas" : "Marcar todas"}
                    </span>
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                    {group.ids.map((id) => (
                      <label
                        key={id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.has(id)}
                          onChange={() => togglePermission(id)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-white/90">
                          {PERMISSION_LABELS[id]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider bg-white/5 text-white border border-border hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider bg-primary text-white hover:bg-accent transition-colors disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "create" ? (
              <Plus className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mode === "create" ? "Criar cargo" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmDeleteModal({
  role,
  isPending,
  onCancel,
  onConfirm,
}: {
  role: AdminRole;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell title="Excluir cargo" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">
        Tem certeza que deseja excluir o cargo{" "}
        <span className="font-bold text-white">{role.name}</span>? Esta ação não
        pode ser desfeita. Usuários com esse cargo continuarão existindo, mas
        precisarão ser reassociados a outro cargo.
      </p>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider bg-white/5 text-white border border-border hover:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Excluir
        </button>
      </div>
    </ModalShell>
  );
}
