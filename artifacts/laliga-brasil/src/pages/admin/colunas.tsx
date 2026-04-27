import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminAccounts,
  useUpdateAccount,
  useColumns,
  type AdminAccount,
} from "@/hooks/use-articles";
import {
  Search,
  Star,
  X,
  Save,
  Mic,
  Image as ImageIcon,
  Twitter,
  Loader2,
  ShieldCheck,
  Plus,
  Eye,
  Edit,
  User as UserIcon,
  Users as UsersIcon,
  FileText,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type TabKey = "minhas" | "perfil" | "gerenciar";

export default function AdminColunas() {
  const { user, isAdmin, refreshUser } = useAuth();
  const [tab, setTab] = useState<TabKey>("minhas");

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "minhas", label: "Minhas colunas", icon: FileText },
    { key: "perfil", label: "Meu perfil", icon: UserIcon },
    ...(isAdmin
      ? ([
          {
            key: "gerenciar" as TabKey,
            label: "Gerenciar colunistas",
            icon: UsersIcon,
          },
        ] as const)
      : []),
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
            Área dos colunistas
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
            Colunas
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap inline-flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "minhas" && <MinhasColunasTab userId={user?.id} />}
        {tab === "perfil" && (
          <MeuPerfilTab userId={user?.id} refreshUser={refreshUser} />
        )}
        {tab === "gerenciar" && isAdmin && <GerenciarTab />}
      </div>
    </AdminLayout>
  );
}

// ============================================================================
// Minhas Colunas Tab
// ============================================================================
function MinhasColunasTab({ userId }: { userId?: string }) {
  const numericId = userId ? Number(userId) : undefined;
  const { data, isLoading } = useColumns({
    authorId: numericId,
    limit: 100,
  });

  const columns = data?.columns ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Colunas que você publicou. Colunas aparecem na seção pública de
          colunistas em vez da página de notícias.
        </p>
        <Link
          href="/dashboard/artigos/new?kind=column"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white font-bold uppercase tracking-wider text-xs hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova coluna
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          Carregando...
        </div>
      ) : columns.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-white font-bold mb-1">Nenhuma coluna ainda</p>
          <p className="text-sm text-muted-foreground">
            Crie sua primeira coluna usando o botão acima.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {columns.map((col) => (
            <div
              key={col.id}
              className="bg-card border border-border rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {col.coverImage && (
                <div className="w-full sm:w-32 h-32 sm:h-20 rounded overflow-hidden bg-background flex-shrink-0">
                  <img
                    src={col.coverImage}
                    alt={col.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  {col.category}
                </p>
                <h3 className="font-display font-black text-white truncate">
                  {col.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {col.publishedAt && (
                    <span>
                      {format(parseISO(col.publishedAt), "dd MMM yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {col.viewCount}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <Link
                  href={`/noticias/${col.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider bg-white/5 text-white border border-border hover:bg-white/10 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </Link>
                <Link
                  href={`/dashboard/artigos/${col.id}/editar`}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Meu Perfil Tab
// ============================================================================
function MeuPerfilTab({
  userId,
  refreshUser,
}: {
  userId?: string;
  refreshUser: () => Promise<void>;
}) {
  const { data: accounts = [], isLoading } = useAdminAccounts();
  const me = accounts.find((a) => a.id === userId);
  const updateAccount = useUpdateAccount();
  const { toast } = useToast();

  const [form, setForm] = useState({
    columnistTitle: "",
    columnistSlug: "",
    bio: "",
    avatarUrl: "",
    twitter: "",
  });
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (me && !initialized) {
      setForm({
        columnistTitle: me.columnistTitle ?? "",
        columnistSlug: me.columnistSlug ?? "",
        bio: me.bio ?? "",
        avatarUrl: me.avatarUrl ?? "",
        twitter: me.twitter ?? "",
      });
      setInitialized(true);
    }
  }, [me, initialized]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
        Carregando...
      </div>
    );
  }

  if (!me) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
        Conta não encontrada.
      </div>
    );
  }

  if (!me.isColumnist) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Mic className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-white font-bold mb-1">Você não é colunista</p>
        <p className="text-sm text-muted-foreground">
          Peça para um administrador ativar seu perfil de colunista.
        </p>
      </div>
    );
  }

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    try {
      await updateAccount.mutateAsync({
        id: me.id,
        columnistTitle: form.columnistTitle.trim() || null,
        columnistSlug: form.columnistSlug.trim() || null,
        bio: form.bio.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        twitter: form.twitter.trim() || null,
      });
      await refreshUser();
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas.",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao salvar",
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-background border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt={me.name}
              className="w-full h-full object-cover"
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          ) : (
            <span className="text-xl font-display font-black text-muted-foreground">
              {me.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h2 className="font-display font-black text-white">{me.name}</h2>
          <p className="text-xs text-muted-foreground">{me.email}</p>
        </div>
      </div>

      <Field label="Identificador (slug)" hint="Aparece na URL do perfil. Ex.: joao-silva">
        <input
          type="text"
          value={form.columnistSlug}
          onChange={(e) => update("columnistSlug", e.target.value)}
          placeholder={me.name.toLowerCase().replace(/\s+/g, "-")}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <Field label="Especialidade / cargo" hint="Curto. Ex.: Comentarista do Real Madrid">
        <input
          type="text"
          value={form.columnistTitle}
          onChange={(e) => update("columnistTitle", e.target.value)}
          maxLength={80}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <Field label="Biografia" hint="Apresentação curta.">
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
      </Field>

      <Field
        label="Foto (URL)"
        hint="Cole o link público de uma imagem quadrada."
        icon={<ImageIcon className="w-4 h-4" />}
      >
        <input
          type="url"
          value={form.avatarUrl}
          onChange={(e) => update("avatarUrl", e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <Field
        label="Twitter / X (opcional)"
        hint="Sem @ — apenas o usuário."
        icon={<Twitter className="w-4 h-4" />}
      >
        <input
          type="text"
          value={form.twitter}
          onChange={(e) =>
            update("twitter", e.target.value.replace(/^@/, ""))
          }
          placeholder="username"
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <button
        type="submit"
        disabled={updateAccount.isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold uppercase tracking-wider bg-primary text-white hover:bg-accent transition-colors disabled:opacity-60"
      >
        {updateAccount.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Salvar perfil
      </button>
    </form>
  );
}

// ============================================================================
// Gerenciar Colunistas Tab (admin only)
// ============================================================================
type FilterKey = "todos" | "colunistas" | "naoColunistas";

function GerenciarTab() {
  const { data: accounts = [], isLoading } = useAdminAccounts();
  const updateAccount = useUpdateAccount();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("todos");
  const [editing, setEditing] = useState<AdminAccount | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (filter === "colunistas" && !a.isColumnist) return false;
      if (filter === "naoColunistas" && a.isColumnist) return false;
      if (!term) return true;
      return (
        a.name.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        (a.columnistSlug ?? "").toLowerCase().includes(term)
      );
    });
  }, [accounts, search, filter]);

  async function quickToggle(account: AdminAccount) {
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        isColumnist: !account.isColumnist,
      });
      toast({
        title: account.isColumnist
          ? "Removido como colunista"
          : "Definido como colunista",
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

  return (
    <div>
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou slug..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
            <FilterChip
              active={filter === "todos"}
              onClick={() => setFilter("todos")}
            >
              Todos
            </FilterChip>
            <FilterChip
              active={filter === "colunistas"}
              onClick={() => setFilter("colunistas")}
            >
              Colunistas
            </FilterChip>
            <FilterChip
              active={filter === "naoColunistas"}
              onClick={() => setFilter("naoColunistas")}
            >
              Não colunistas
            </FilterChip>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
          Nenhuma conta encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onEdit={() => setEditing(account)}
              onToggle={() => quickToggle(account)}
              isToggling={updateAccount.isPending}
            />
          ))}
        </div>
      )}

      {editing && (
        <ColumnistEditor
          account={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            toast({
              title: "Perfil atualizado",
              description: updated.name,
            });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ----- Shared sub-components -----

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "bg-primary text-white"
          : "bg-background text-muted-foreground hover:text-white hover:bg-white/5 border border-border"
      }`}
    >
      {children}
    </button>
  );
}

function AccountRow({
  account,
  onEdit,
  onToggle,
  isToggling,
}: {
  account: AdminAccount;
  onEdit: () => void;
  onToggle: () => void;
  isToggling: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
              {account.isColumnist && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                  <Mic className="w-3 h-3" />
                  Colunista
                </span>
              )}
              {account.role === "admin" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {account.email}
            </p>
            {account.isColumnist && account.columnistTitle && (
              <p className="text-xs text-white/60 mt-1 italic truncate">
                {account.columnistTitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <button
            onClick={onToggle}
            disabled={isToggling}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              account.isColumnist
                ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                : "bg-white/5 text-muted-foreground border border-border hover:text-white hover:bg-white/10"
            }`}
          >
            <Star
              className={`w-4 h-4 ${account.isColumnist ? "fill-current" : ""}`}
            />
            <span className="sm:hidden md:inline">
              {account.isColumnist ? "Remover" : "Tornar colunista"}
            </span>
          </button>
          <button
            onClick={onEdit}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider bg-white/5 text-white border border-border hover:bg-white/10 transition-colors"
          >
            Editar perfil
          </button>
        </div>
      </div>
    </div>
  );
}

function ColumnistEditor({
  account,
  onClose,
  onSaved,
}: {
  account: AdminAccount;
  onClose: () => void;
  onSaved: (updated: AdminAccount) => void;
}) {
  const updateAccount = useUpdateAccount();
  const { toast } = useToast();

  const [form, setForm] = useState({
    isColumnist: account.isColumnist,
    columnistTitle: account.columnistTitle ?? "",
    columnistSlug: account.columnistSlug ?? "",
    bio: account.bio ?? "",
    avatarUrl: account.avatarUrl ?? "",
    twitter: account.twitter ?? "",
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await updateAccount.mutateAsync({
        id: account.id,
        isColumnist: form.isColumnist,
        columnistTitle: form.columnistTitle.trim() || null,
        columnistSlug: form.columnistSlug.trim() || null,
        bio: form.bio.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        twitter: form.twitter.trim() || null,
      });
      onSaved(updated);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao salvar",
        variant: "destructive",
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl bg-card border border-border sm:rounded-xl shadow-2xl my-0 sm:my-6"
      >
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-display font-black tracking-tight">
              Perfil do colunista
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {account.name} · {account.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <label className="flex items-start gap-3 p-3 rounded-md bg-background border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={form.isColumnist}
              onChange={(e) => update("isColumnist", e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">
                Esta pessoa é colunista
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quando ativo, o perfil aparece na seção pública de colunistas.
              </p>
            </div>
          </label>

          <Field label="Identificador (slug)" hint="Aparece na URL do perfil. Ex.: joao-silva">
            <input
              type="text"
              value={form.columnistSlug}
              onChange={(e) => update("columnistSlug", e.target.value)}
              placeholder={account.name.toLowerCase().replace(/\s+/g, "-")}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          <Field label="Especialidade / cargo" hint="Curto. Ex.: Comentarista do Real Madrid">
            <input
              type="text"
              value={form.columnistTitle}
              onChange={(e) => update("columnistTitle", e.target.value)}
              maxLength={80}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          <Field label="Biografia" hint="Apresentação curta do colunista.">
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </Field>

          <Field
            label="Foto (URL)"
            hint="Cole o link público de uma imagem quadrada."
            icon={<ImageIcon className="w-4 h-4" />}
          >
            <input
              type="url"
              value={form.avatarUrl}
              onChange={(e) => update("avatarUrl", e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          <Field
            label="Twitter / X (opcional)"
            hint="Sem @ — apenas o usuário."
            icon={<Twitter className="w-4 h-4" />}
          >
            <input
              type="text"
              value={form.twitter}
              onChange={(e) =>
                update("twitter", e.target.value.replace(/^@/, ""))
              }
              placeholder="username"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 sm:p-6 border-t border-border bg-background/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateAccount.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-sm font-bold uppercase tracking-wider bg-primary text-white hover:bg-accent transition-colors disabled:opacity-60"
          >
            {updateAccount.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <label className="text-xs font-bold uppercase tracking-wider text-white">
          {label}
        </label>
      </div>
      {hint && <p className="text-xs text-muted-foreground mb-2">{hint}</p>}
      {children}
    </div>
  );
}
