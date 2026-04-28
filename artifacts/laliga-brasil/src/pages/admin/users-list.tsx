import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Mic,
  ShieldCheck,
  Loader2,
  Star,
  Save,
  Users as UsersIcon,
  KeyRound,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useAdminAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useAdminRoles,
  type AdminAccount,
  type AdminRole,
} from "@/hooks/use-articles";
import { useAuth } from "@/contexts/AuthContext";

type RoleKey = "admin" | "editor" | "viewer";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador",
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-primary/15 text-primary border border-primary/30",
  editor: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  viewer: "bg-gray-500/10 text-gray-300 border border-gray-500/20",
};

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

export default function AdminUsersList() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { data: accounts = [], isLoading } = useAdminAccounts();
  const { data: roles = [] } = useAdminRoles();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "colunistas" | "ativos" | "inativos">(
    "todos"
  );
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminAccount | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (filter === "colunistas" && !a.isColumnist) return false;
      if (filter === "ativos" && !a.active) return false;
      if (filter === "inativos" && a.active) return false;
      if (!term) return true;
      return (
        a.name.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        (a.columnistSlug ?? "").toLowerCase().includes(term)
      );
    });
  }, [accounts, search, filter]);

  const stats = useMemo(() => {
    return {
      total: accounts.length,
      columnists: accounts.filter((a) => a.isColumnist).length,
      admins: accounts.filter((a) => a.role === "admin").length,
      active: accounts.filter((a) => a.active).length,
    };
  }, [accounts]);

  async function quickColumnistToggle(account: AdminAccount) {
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        isColumnist: !account.isColumnist,
      });
      toast({
        title: account.isColumnist ? "Removido como colunista" : "Definido como colunista",
        description: account.name,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao atualizar",
        variant: "destructive",
      });
    }
  }

  async function quickStatusToggle(account: AdminAccount) {
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        active: !account.active,
      });
      toast({
        title: account.active ? "Conta desativada" : "Conta ativada",
        description: account.name,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao atualizar",
        variant: "destructive",
      });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) return;
    try {
      await deleteAccount.mutateAsync(deleteCandidate.id);
      toast({
        title: "Conta excluída",
        description: deleteCandidate.name,
      });
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
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white">Usuários</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-primary" />
              Gerenciar Usuários
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Crie contas de editores, administradores e colunistas. Ative o status
              de colunista para que apareçam no site público.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-accent text-white px-5 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo usuário
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Colunistas" value={stats.columnists} accent="primary" />
          <StatCard label="Administradores" value={stats.admins} />
          <StatCard label="Ativos" value={stats.active} accent="emerald" />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou slug…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
              {([
                ["todos", "Todos"],
                ["colunistas", "Colunistas"],
                ["ativos", "Ativos"],
                ["inativos", "Inativos"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`whitespace-nowrap px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                    filter === key
                      ? "bg-primary text-white"
                      : "bg-background text-muted-foreground hover:text-white hover:bg-white/5 border border-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
            Carregando contas…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((account) => (
              <UserRow
                key={account.id}
                account={account}
                isSelf={currentUser?.id === account.id}
                isMutating={updateAccount.isPending}
                onColumnistToggle={() => quickColumnistToggle(account)}
                onStatusToggle={() => quickStatusToggle(account)}
                onEdit={() => setEditing(account)}
                onDelete={() => setDeleteCandidate(account)}
              />
            ))}
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <CreateUserModal
            roles={roles}
            isPending={createAccount.isPending}
            onClose={() => setShowCreate(false)}
            onSubmit={async (vars) => {
              try {
                await createAccount.mutateAsync(vars);
                toast({
                  title: "Usuário criado",
                  description: vars.email,
                });
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

        {/* Edit modal */}
        {editing && (
          <EditUserModal
            account={editing}
            roles={roles}
            isPending={updateAccount.isPending}
            onClose={() => setEditing(null)}
            onSaved={() => {
              toast({ title: "Usuário atualizado", description: editing.name });
              setEditing(null);
            }}
          />
        )}

        {/* Delete confirm */}
        {deleteCandidate && (
          <ConfirmDeleteModal
            account={deleteCandidate}
            isPending={deleteAccount.isPending}
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
  accent?: "primary" | "emerald";
}) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "emerald"
      ? "text-emerald-400"
      : "text-white";
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </p>
      <p className={`text-2xl font-display font-black mt-1 ${accentClass}`}>
        {value}
      </p>
    </div>
  );
}

function UserRow({
  account,
  isSelf,
  isMutating,
  onColumnistToggle,
  onStatusToggle,
  onEdit,
  onDelete,
}: {
  account: AdminAccount;
  isSelf: boolean;
  isMutating: boolean;
  onColumnistToggle: () => void;
  onStatusToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/40 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Identity */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-full bg-background border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
            {account.avatarUrl ? (
              <img
                src={account.avatarUrl}
                alt={account.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-lg font-display font-black text-muted-foreground">
                {account.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white truncate">{account.name}</h3>
              {isSelf && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/70 border border-border">
                  Você
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  ROLE_STYLES[account.role] ?? ROLE_STYLES["viewer"]
                }`}
              >
                {account.role === "admin" && <ShieldCheck className="w-3 h-3" />}
                {ROLE_LABELS[account.role] ?? account.role}
              </span>
              {account.isColumnist && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                  <Mic className="w-3 h-3" />
                  Colunista
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  account.active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                }`}
              >
                {account.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-1">
              {account.email}
            </p>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              {account.isColumnist && account.columnistSlug && (
                <span className="truncate">
                  /colunistas/<span className="text-white/70">{account.columnistSlug}</span>
                </span>
              )}
              <span>Criada em {formatDate(account.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
          <button
            onClick={onColumnistToggle}
            disabled={isMutating}
            title={account.isColumnist ? "Remover como colunista" : "Tornar colunista"}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              account.isColumnist
                ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                : "bg-white/5 text-muted-foreground border border-border hover:text-white hover:bg-white/10"
            }`}
          >
            <Star
              className={`w-4 h-4 ${account.isColumnist ? "fill-current" : ""}`}
            />
            <span>{account.isColumnist ? "Colunista" : "Colunista?"}</span>
          </button>

          <button
            onClick={onStatusToggle}
            disabled={isMutating || isSelf}
            title={isSelf ? "Você não pode desativar a si mesmo" : "Ativar/Desativar"}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              account.active
                ? "bg-white/5 text-white border border-border hover:bg-white/10"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
            }`}
          >
            {account.active ? "Desativar" : "Ativar"}
          </button>

          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider bg-white/5 text-white border border-border hover:bg-white/10 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>

          <button
            onClick={onDelete}
            disabled={isSelf}
            title={isSelf ? "Você não pode excluir a si mesmo" : "Excluir"}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
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

function CreateUserModal({
  roles,
  isPending,
  onClose,
  onSubmit,
}: {
  roles: AdminRole[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (vars: {
    name: string;
    email: string;
    password: string;
    role: string;
    isColumnist: boolean;
    columnistTitle?: string;
    bio?: string;
    avatarUrl?: string;
    twitter?: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor",
    isColumnist: false,
    columnistTitle: "",
    bio: "",
    avatarUrl: "",
    twitter: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      isColumnist: form.isColumnist,
      columnistTitle: form.isColumnist ? form.columnistTitle.trim() || undefined : undefined,
      bio: form.isColumnist ? form.bio.trim() || undefined : undefined,
      avatarUrl: form.isColumnist ? form.avatarUrl.trim() || undefined : undefined,
      twitter: form.isColumnist
        ? form.twitter.trim().replace(/^@/, "") || undefined
        : undefined,
    });
  }

  return (
    <ModalShell title="Criar novo usuário" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nome completo</FieldLabel>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
              placeholder="João da Silva"
              required
            />
          </div>
          <div>
            <FieldLabel>E-mail</FieldLabel>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
              placeholder="joao@laliga.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Senha (mín. 6 caracteres)</FieldLabel>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <div>
            <FieldLabel>Cargo</FieldLabel>
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className={inputClass}
            >
              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="viewer">Visualizador</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Columnist toggle */}
        <div
          className={`rounded-xl border p-4 transition-colors ${
            form.isColumnist
              ? "bg-primary/5 border-primary/30"
              : "bg-background border-border"
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isColumnist}
              onChange={(e) => update("isColumnist", e.target.checked)}
              className="mt-1 w-4 h-4 accent-primary"
            />
            <div className="flex-1">
              <p className="font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                Tornar colunista público
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cria um perfil público em /colunistas e libera a publicação de colunas no editor.
              </p>
            </div>
          </label>

          {form.isColumnist && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-primary/20">
              <div>
                <FieldLabel>Especialidade / cargo</FieldLabel>
                <input
                  type="text"
                  value={form.columnistTitle}
                  onChange={(e) => update("columnistTitle", e.target.value)}
                  className={inputClass}
                  placeholder="Comentarista do Real Madrid"
                  maxLength={80}
                />
              </div>
              <div>
                <FieldLabel>Twitter / X (sem @)</FieldLabel>
                <input
                  type="text"
                  value={form.twitter}
                  onChange={(e) => update("twitter", e.target.value)}
                  className={inputClass}
                  placeholder="username"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Foto (URL)</FieldLabel>
                <input
                  type="url"
                  value={form.avatarUrl}
                  onChange={(e) => update("avatarUrl", e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Biografia</FieldLabel>
                <textarea
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  className={`${inputClass} resize-y min-h-[80px]`}
                  rows={3}
                  maxLength={500}
                  placeholder="Apresentação curta…"
                />
              </div>
            </div>
          )}
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
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar usuário
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditUserModal({
  account,
  roles,
  isPending,
  onClose,
  onSaved,
}: {
  account: AdminAccount;
  roles: AdminRole[];
  isPending: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateAccount = useUpdateAccount();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: account.name,
    email: account.email,
    role: account.role,
    password: "",
    isColumnist: account.isColumnist,
    columnistSlug: account.columnistSlug ?? "",
    columnistTitle: account.columnistTitle ?? "",
    bio: account.bio ?? "",
    avatarUrl: account.avatarUrl ?? "",
    twitter: account.twitter ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        role: form.role,
        password: form.password ? form.password : undefined,
        isColumnist: form.isColumnist,
        columnistSlug: form.isColumnist ? form.columnistSlug.trim() || null : null,
        columnistTitle: form.isColumnist ? form.columnistTitle.trim() || null : null,
        bio: form.isColumnist ? form.bio.trim() || null : null,
        avatarUrl: form.isColumnist ? form.avatarUrl.trim() || null : null,
        twitter: form.isColumnist
          ? form.twitter.trim().replace(/^@/, "") || null
          : null,
      });
      onSaved();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao salvar",
        variant: "destructive",
      });
    }
  }

  return (
    <ModalShell title={`Editar ${account.name}`} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nome</FieldLabel>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <FieldLabel>E-mail</FieldLabel>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Cargo</FieldLabel>
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className={inputClass}
            >
              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="viewer">Visualizador</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </>
              )}
            </select>
          </div>
          <div>
            <FieldLabel>
              <span className="inline-flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Nova senha (opcional)
              </span>
            </FieldLabel>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className={inputClass}
              placeholder="Deixe vazio para manter"
              minLength={form.password.length > 0 ? 6 : undefined}
            />
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 transition-colors ${
            form.isColumnist
              ? "bg-primary/5 border-primary/30"
              : "bg-background border-border"
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isColumnist}
              onChange={(e) => update("isColumnist", e.target.checked)}
              className="mt-1 w-4 h-4 accent-primary"
            />
            <div className="flex-1">
              <p className="font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                Colunista público
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Marque para o usuário aparecer em /colunistas e poder publicar colunas.
              </p>
            </div>
          </label>

          {form.isColumnist && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-primary/20">
              <div>
                <FieldLabel>Identificador (slug)</FieldLabel>
                <input
                  type="text"
                  value={form.columnistSlug}
                  onChange={(e) => update("columnistSlug", e.target.value)}
                  className={inputClass}
                  placeholder="joao-silva"
                />
              </div>
              <div>
                <FieldLabel>Especialidade / cargo</FieldLabel>
                <input
                  type="text"
                  value={form.columnistTitle}
                  onChange={(e) => update("columnistTitle", e.target.value)}
                  className={inputClass}
                  maxLength={80}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Foto (URL)</FieldLabel>
                <input
                  type="url"
                  value={form.avatarUrl}
                  onChange={(e) => update("avatarUrl", e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
              <div>
                <FieldLabel>Twitter / X (sem @)</FieldLabel>
                <input
                  type="text"
                  value={form.twitter}
                  onChange={(e) => update("twitter", e.target.value.replace(/^@/, ""))}
                  className={inputClass}
                  placeholder="username"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Biografia</FieldLabel>
                <textarea
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  className={`${inputClass} resize-y min-h-[80px]`}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          )}
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
            disabled={isPending || updateAccount.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider bg-primary text-white hover:bg-accent transition-colors disabled:opacity-60"
          >
            {updateAccount.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar alterações
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmDeleteModal({
  account,
  isPending,
  onCancel,
  onConfirm,
}: {
  account: AdminAccount;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell title="Excluir usuário" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">
        Tem certeza que deseja excluir{" "}
        <span className="font-bold text-white">{account.name}</span> ({account.email})?
        Esta ação não pode ser desfeita.
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
