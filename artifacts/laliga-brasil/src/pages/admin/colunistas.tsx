import React, { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminAccounts,
  useUpdateAccount,
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
} from "lucide-react";

type FilterKey = "todos" | "colunistas" | "naoColunistas";

export default function AdminColunistas() {
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

  const stats = useMemo(() => {
    const total = accounts.length;
    const colunistas = accounts.filter((a) => a.isColumnist).length;
    return { total, colunistas, restantes: total - colunistas };
  }, [accounts]);

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
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Equipe Editorial
            </p>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
              Colunistas
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Defina quais membros da equipe aparecem como colunistas no site.
              Cada colunista pode ter um perfil próprio com biografia, foto e
              especialidade.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <StatCard label="Contas ativas" value={stats.total} />
          <StatCard
            label="Colunistas"
            value={stats.colunistas}
            accent
          />
          <StatCard label="Não colunistas" value={stats.restantes} />
        </div>

        {/* Search + filters */}
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

        {/* List */}
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
      </div>

      {/* Edit modal */}
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
    </AdminLayout>
  );
}

// ----- Components -----

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-5 border ${
        accent
          ? "bg-primary/5 border-primary/30"
          : "bg-card border-border"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </p>
      <p
        className={`text-3xl font-display font-black mt-1 ${
          accent ? "text-primary" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

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
        {/* Avatar */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-full bg-background border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
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

        {/* Actions */}
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <button
            onClick={onToggle}
            disabled={isToggling}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              account.isColumnist
                ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                : "bg-white/5 text-muted-foreground border border-border hover:text-white hover:bg-white/10"
            }`}
            title={
              account.isColumnist
                ? "Remover colunista"
                : "Tornar colunista"
            }
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

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
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
        {/* Header */}
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Toggle */}
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

          {/* Identifier */}
          <Field label="Identificador (slug)" hint="Aparece na URL do perfil. Ex.: joao-silva">
            <input
              type="text"
              value={form.columnistSlug}
              onChange={(e) => update("columnistSlug", e.target.value)}
              placeholder={account.name.toLowerCase().replace(/\s+/g, "-")}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          {/* Title */}
          <Field label="Especialidade / cargo" hint="Curto. Ex.: Comentarista do Real Madrid">
            <input
              type="text"
              value={form.columnistTitle}
              onChange={(e) => update("columnistTitle", e.target.value)}
              maxLength={80}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {form.columnistTitle.length}/80
            </p>
          </Field>

          {/* Bio */}
          <Field label="Biografia" hint="Apresentação curta do colunista.">
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {form.bio.length}/500
            </p>
          </Field>

          {/* Avatar */}
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
            {form.avatarUrl && (
              <div className="mt-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-background border border-border overflow-hidden flex items-center justify-center">
                  <img
                    src={form.avatarUrl}
                    alt="Pré-visualização"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Pré-visualização</p>
              </div>
            )}
          </Field>

          {/* Twitter */}
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

        {/* Footer */}
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
