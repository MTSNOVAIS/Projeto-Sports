import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import {
  useAdminGetArticle,
  useCreateArticle,
  useUpdateArticle,
  usePublishArticle,
  useScheduleArticle,
  useUnpublishArticle,
  useSiteAccounts,
  type SiteAccount,
} from "@/hooks/use-articles";
import { useListTeams } from "@/hooks/use-system";
import { useAuth } from "@/contexts/AuthContext";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
  Users,
  FileText,
  Eye,
  AlertTriangle,
  CalendarClock,
  Undo2,
  Loader2,
  ChevronDown,
  Settings,
  Star,
  Zap,
  X,
  Plus,
  Check,
  Tag,
  Shield,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CreateArticleRequestStatus,
  CreateArticleRequest,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CATEGORIES = [
  "La Liga",
  "Transferências",
  "Resultados",
  "Análise",
  "Entrevista",
  "Internacional",
];

const STATUS_BADGE: Record<
  string,
  { label: string; className: string; emoji: string }
> = {
  draft:     { label: "Rascunho",  className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",       emoji: "📝" },
  published: { label: "Publicado", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", emoji: "🟢" },
  scheduled: { label: "Agendado",  className: "bg-sky-500/15 text-sky-300 border-sky-500/30",          emoji: "⏱️" },
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

// =================== Custom UI primitives ===================

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

interface SelectOption { value: string; label: string; icon?: React.ReactNode }
function CustomSelect({
  value, options, onChange, placeholder = "Selecionar...",
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-background border border-border hover:border-primary/60 rounded-lg px-3 py-2.5 text-sm text-white transition-colors text-left"
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.icon}
          <span className={selected ? "" : "text-muted-foreground"}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-2xl py-1 max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground italic">
              Nenhuma opção
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-primary/15 transition-colors ${
                  opt.value === value ? "bg-primary/10 text-primary" : "text-gray-200"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {opt.icon}
                  {opt.label}
                </span>
                {opt.value === value && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({
  checked, onChange, label, description, icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
        checked
          ? "bg-primary/10 border-primary/40"
          : "bg-background border-border hover:border-primary/30"
      }`}
    >
      {icon && (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          checked ? "bg-primary/25 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${checked ? "text-white" : "text-gray-300"}`}>{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <span
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/**
 * Custom date+time picker built from individual selects so we get a
 * consistent in-app look (no native browser pickers).
 */
function DateTimePicker({
  value, onChange,
}: {
  value: string | null;
  onChange: (iso: string | null) => void;
}) {
  const initial = useMemo(() => {
    const d = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
    return {
      day: String(d.getDate()).padStart(2, "0"),
      month: String(d.getMonth() + 1).padStart(2, "0"),
      year: String(d.getFullYear()),
      hour: String(d.getHours()).padStart(2, "0"),
      minute: String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, "0"),
    };
  }, []); // initialize once

  const [day, setDay]       = useState(initial.day);
  const [month, setMonth]   = useState(initial.month);
  const [year, setYear]     = useState(initial.year);
  const [hour, setHour]     = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    const d = new Date(
      Number(year), Number(month) - 1, Number(day),
      Number(hour), Number(minute), 0,
    );
    if (!isNaN(d.getTime())) onChange(d.toISOString());
  }, [day, month, year, hour, minute]);

  const days    = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const months  = [
    ["01", "Jan"], ["02", "Fev"], ["03", "Mar"], ["04", "Abr"],
    ["05", "Mai"], ["06", "Jun"], ["07", "Jul"], ["08", "Ago"],
    ["09", "Set"], ["10", "Out"], ["11", "Nov"], ["12", "Dez"],
  ];
  const currentYear = new Date().getFullYear();
  const years   = Array.from({ length: 3 }, (_, i) => String(currentYear + i));
  const hours   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <CustomSelect value={day}   options={days.map((d) => ({ value: d, label: d }))}              onChange={setDay} />
        <CustomSelect value={month} options={months.map(([v, l]) => ({ value: v, label: l }))}        onChange={setMonth} />
        <CustomSelect value={year}  options={years.map((y) => ({ value: y, label: y }))}              onChange={setYear} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CustomSelect value={hour}   options={hours.map((h) => ({ value: h, label: `${h}h` }))}        onChange={setHour} />
        <CustomSelect value={minute} options={minutes.map((m) => ({ value: m, label: `${m} min` }))}   onChange={setMinute} />
      </div>
    </div>
  );
}

interface CoAuthor { id: string; name: string; email?: string; external?: boolean }
function AuthorPicker({
  authorName, coAuthors, onChange, accounts, accountsLoading,
}: {
  authorName: string;
  coAuthors: CoAuthor[];
  onChange: (next: CoAuthor[]) => void;
  accounts: SiteAccount[] | undefined;
  accountsLoading: boolean;
}) {
  const [externalOpen, setExternalOpen] = useState(false);
  const [externalName, setExternalName] = useState("");

  const toggleAccount = (acc: SiteAccount) => {
    const exists = coAuthors.find((c) => c.id === acc.id);
    if (exists) {
      onChange(coAuthors.filter((c) => c.id !== acc.id));
    } else {
      onChange([...coAuthors, { id: acc.id, name: acc.name, email: acc.email }]);
    }
  };

  const removeCoAuthor = (id: string) => onChange(coAuthors.filter((c) => c.id !== id));

  const addExternal = () => {
    const name = externalName.trim();
    if (!name) return;
    onChange([...coAuthors, { id: `ext-${Date.now()}`, name, external: true }]);
    setExternalName("");
    setExternalOpen(false);
  };

  // hide the main author from the selectable list
  const selectableAccounts = (accounts ?? []).filter((a) => a.name !== authorName);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
          Autor principal
        </p>
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-white truncate">{authorName}</span>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
          Contas do site
        </p>
        {accountsLoading ? (
          <p className="text-xs text-muted-foreground italic">Carregando contas...</p>
        ) : selectableAccounts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma outra conta cadastrada.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {selectableAccounts.map((acc) => {
              const checked = !!coAuthors.find((c) => c.id === acc.id);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => toggleAccount(acc)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                    checked
                      ? "bg-primary/10 border-primary/40"
                      : "bg-background border-border hover:border-primary/30"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-muted text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {acc.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{acc.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                      {acc.role}
                    </p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                      checked
                        ? "bg-primary border-primary text-white"
                        : "border-border bg-background"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Autores externos
          </p>
          <button
            type="button"
            onClick={() => setExternalOpen((v) => !v)}
            className="px-2 py-1 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold rounded flex items-center gap-1 transition-colors"
          >
            <UserPlus className="w-3 h-3" />
            {externalOpen ? "Fechar" : "Adicionar"}
          </button>
        </div>

        {externalOpen && (
          <div className="bg-background border border-border rounded-lg p-2 mb-2 flex gap-2">
            <input
              type="text"
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExternal(); } }}
              placeholder="Nome do autor convidado"
              className="flex-1 bg-card border border-border rounded px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={addExternal}
              disabled={!externalName.trim()}
              className="px-3 py-1.5 bg-primary hover:bg-accent text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Plus className="w-3 h-3 inline" /> Adicionar
            </button>
          </div>
        )}

        {coAuthors.filter((c) => c.external).length > 0 && (
          <div className="space-y-1.5">
            {coAuthors.filter((c) => c.external).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-white flex-1 truncate">{c.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  externo
                </span>
                <button
                  type="button"
                  onClick={() => removeCoAuthor(c.id)}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                  aria-label={`Remover ${c.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // include the current value in options if it's a custom one not in CATEGORIES
  const isCustom = value && !CATEGORIES.includes(value);
  const allOptions = [
    { value: "", label: "— Sem categoria —" },
    ...CATEGORIES.map((c) => ({ value: c, label: c })),
    ...(isCustom ? [{ value, label: `${value} (personalizada)` }] : []),
  ];

  const addCustom = () => {
    const v = customValue.trim();
    if (!v) return;
    onChange(v);
    setCustomValue("");
    setCustomOpen(false);
  };

  return (
    <div className="space-y-2">
      <CustomSelect
        value={value}
        onChange={onChange}
        options={allOptions}
        placeholder="— Sem categoria —"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className="px-2 py-1 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold rounded inline-flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          {customOpen ? "Fechar" : "Mais opções"}
        </button>
      </div>
      {customOpen && (
        <div className="bg-background border border-border rounded-lg p-2 flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Nova categoria personalizada"
            className="flex-1 bg-card border border-border rounded px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
            autoFocus
            maxLength={40}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customValue.trim()}
            className="px-3 py-1.5 bg-primary hover:bg-accent text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3 inline" /> Adicionar
          </button>
        </div>
      )}
    </div>
  );
}

// =================== Auto-resize textarea ===================

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={(e) => {
        onChange(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}

// =================== Settings Panel ===================

type SettingsTab = "geral" | "destaques" | "capa" | "autoria";

function SettingsPanel({
  tab, setTab, formData, setFormData, teams, accounts, accountsLoading, canPublishColumns,
}: any) {
  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "geral",     label: "Geral",     icon: <Tag className="w-3.5 h-3.5" /> },
    { id: "destaques", label: "Destaques", icon: <Star className="w-3.5 h-3.5" /> },
    { id: "capa",      label: "Capa",      icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: "autoria",   label: "Autoria",   icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div>
      <div className="flex border-b border-border bg-background/40">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              tab === t.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {tab === "geral" && (
          <div className="space-y-4">
            {canPublishColumns && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Tipo de publicação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p: any) => ({ ...p, kind: "article" }))}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-bold uppercase tracking-wider transition-colors ${
                      (formData.kind ?? "article") === "article"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-white"
                    }`}
                  >
                    Artigo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p: any) => ({ ...p, kind: "column" }))}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-bold uppercase tracking-wider transition-colors ${
                      formData.kind === "column"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-white"
                    }`}
                  >
                    Coluna
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Colunas aparecem na seção de colunistas. Artigos vão para a página de notícias.
                </p>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Categoria <span className="text-muted-foreground/60 normal-case font-normal">(opcional)</span>
              </label>
              <CategoryPicker
                value={formData.category || ""}
                onChange={(v) => setFormData((p: any) => ({ ...p, category: v }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Time relacionado
              </label>
              <CustomSelect
                value={formData.teamId ? String(formData.teamId) : ""}
                onChange={(v) =>
                  setFormData((p: any) => ({ ...p, teamId: v ? Number(v) : null }))
                }
                placeholder="-- Nenhum --"
                options={[
                  { value: "", label: "-- Nenhum --" },
                  ...((teams ?? []).map((t: any) => ({
                    value: String(t.id),
                    label: t.name,
                    icon: <Shield className="w-3.5 h-3.5 text-muted-foreground" />,
                  }))),
                ]}
              />
            </div>
          </div>
        )}

        {tab === "destaques" && (
          <div className="space-y-3">
            <ToggleSwitch
              checked={formData.featured}
              onChange={(v) => setFormData((p: any) => ({ ...p, featured: v }))}
              label="Artigo em destaque"
              description="Aparece no carrossel principal da home (máx. 4 ativos)."
              icon={<Star className="w-4 h-4" />}
            />
            <ToggleSwitch
              checked={formData.breakingNews}
              onChange={(v) => setFormData((p: any) => ({ ...p, breakingNews: v }))}
              label="Urgente (ticker)"
              description="Aparece no ticker vermelho no topo do site."
              icon={<Zap className="w-4 h-4" />}
            />
            {(formData.featured || formData.breakingNews) && (
              <p className="text-xs text-yellow-300/90 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                Os destaques só aparecem no site quando o artigo está publicado.
              </p>
            )}
          </div>
        )}

        {tab === "capa" && (
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              URL da imagem
            </label>
            <input
              type="url"
              value={formData.coverImage || ""}
              onChange={(e) => setFormData((p: any) => ({ ...p, coverImage: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
            />
            {formData.coverImage ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border/50">
                <img
                  src={formData.coverImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-lg bg-background border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-1" />
                <p className="text-xs">Sem imagem definida</p>
              </div>
            )}
          </div>
        )}

        {tab === "autoria" && (
          <AuthorPicker
            authorName={formData.authorName}
            coAuthors={formData.coAuthorList || []}
            onChange={(next) => setFormData((p: any) => ({ ...p, coAuthorList: next }))}
            accounts={accounts}
            accountsLoading={accountsLoading}
          />
        )}
      </div>
    </div>
  );
}

// =================== Main editor ===================

interface EditorFormState extends CreateArticleRequest {
  subtitle?: string;
  coAuthorList?: CoAuthor[];
  kind?: "article" | "column";
  authorId?: number | null;
}

export default function AdminArticleEditor() {
  const [, setLocation] = useLocation();
  const [, editParams] = useRoute("/dashboard/artigos/:id/editar");
  const [, newParams]  = useRoute("/dashboard/artigos/new");

  const isNewArticle = !!newParams;
  const isEditing    = !!editParams?.id;
  const articleId    = isEditing ? parseInt(editParams!.id) : undefined;

  const { user, canAccessColumns } = useAuth();
  const { data: existingArticle, isLoading: loadingArticle } = useAdminGetArticle(
    articleId as number,
    { query: { enabled: isEditing } },
  );
  const { data: teams } = useListTeams();
  const { data: accounts, isLoading: accountsLoading } = useSiteAccounts();

  const createMutation     = useCreateArticle();
  const updateMutation     = useUpdateArticle();
  const publishMutation    = usePublishArticle();
  const scheduleMutation   = useScheduleArticle();
  const unpublishMutation  = useUnpublishArticle();
  const { toast } = useToast();

  const [formData, setFormData] = useState<EditorFormState>({
    title: "",
    subtitle: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "La Liga",
    teamId: null as any,
    authorName: user?.name || "Redação La Liga Brasil",
    status: CreateArticleRequestStatus.draft,
    featured: false,
    breakingNews: false,
    scheduledAt: null as any,
    sourceName: "",
    sourceUrl: "",
    coAuthorList: [],
    kind: "article",
    authorId: user ? Number(user.id) || null : null,
  });

  const [generatingSubtitle, setGeneratingSubtitle] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "publish" | "schedule" | "unpublish">(null);
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("geral");
  const [tempScheduledAt, setTempScheduledAt] = useState<string | null>(null);
  const [articleSlug, setArticleSlug] = useState<string | null>(null);
  const [persistedStatus, setPersistedStatus] = useState<string>("draft");

  const publishMenuRef  = useRef<HTMLDivElement>(null);
  const settingsRef     = useRef<HTMLDivElement>(null);
  useClickOutside(publishMenuRef, () => setShowPublishMenu(false));
  useClickOutside(settingsRef, () => setShowSettings(false));

  useEffect(() => {
    if (existingArticle) {
      setFormData({
        title:        existingArticle.title,
        subtitle:     existingArticle.subtitle || "",
        excerpt:      existingArticle.excerpt,
        content:      existingArticle.content,
        coverImage:   existingArticle.coverImage || "",
        category:     existingArticle.category,
        teamId:       existingArticle.teamId || null,
        authorName:   existingArticle.authorName,
        status:       existingArticle.status as CreateArticleRequestStatus,
        featured:     existingArticle.featured,
        breakingNews: existingArticle.breakingNews,
        scheduledAt:  existingArticle.scheduledAt || null,
        sourceName:   existingArticle.sourceName || "",
        sourceUrl:    existingArticle.sourceUrl || "",
        coAuthorList: ((existingArticle as any).coAuthors as CoAuthor[] | undefined) ?? [],
        kind:         (((existingArticle as any).kind as "article" | "column" | undefined) ?? "article"),
        authorId:     ((existingArticle as any).authorId as number | null | undefined) ?? null,
      });
      setPersistedStatus(existingArticle.status);
      setArticleSlug(existingArticle.slug);
      if (existingArticle.scheduledAt) setTempScheduledAt(existingArticle.scheduledAt);
    }
  }, [existingArticle]);

  useEffect(() => {
    if (isEditing || !user) return;
    setFormData((p) => {
      const needsName = p.authorName === "Redação La Liga Brasil" || !p.authorName;
      const needsId = p.authorId == null && p.authorName === user.name;
      if (!needsName && !needsId) return p;
      return {
        ...p,
        authorName: needsName ? user.name : p.authorName,
        authorId: Number(user.id) || null,
      };
    });
  }, [user, isEditing]);

  // Default to "column" kind when ?kind=column is in the URL (new article only)
  useEffect(() => {
    if (isEditing) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("kind") === "column") {
      setFormData((p) => ({ ...p, kind: "column" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const validation = useMemo(() => {
    const issues: { field: string; message: string }[] = [];
    const plain = (formData.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!formData.title?.trim()) issues.push({ field: "title", message: "Título é obrigatório" });
    else if (formData.title.trim().length < 8)
      issues.push({ field: "title", message: "Título muito curto (mín. 8 caracteres)" });
    if (!plain) issues.push({ field: "content", message: "Conteúdo é obrigatório" });
    else if (plain.length < 80)
      issues.push({ field: "content", message: "Conteúdo muito curto (mín. 80 caracteres)" });
    return { issues, isValid: issues.length === 0 };
  }, [formData.title, formData.content]);

  const handleGenerateSubtitle = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Erro", description: "Título e conteúdo são necessários.", variant: "destructive" });
      return;
    }
    setGeneratingSubtitle(true);
    try {
      const r = await fetch(`${BASE}/api/scraper/generate-subtitle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, content: formData.content }),
      });
      if (!r.ok) throw new Error("Failed");
      const data = await r.json();
      setFormData((p) => ({ ...p, subtitle: data.subtitle }));
      toast({ title: "Sucesso", description: "Subtítulo gerado com IA!" });
    } catch {
      toast({ title: "Erro", description: "Falha ao gerar subtítulo.", variant: "destructive" });
    } finally {
      setGeneratingSubtitle(false);
    }
  };

  function buildPayload(forceStatus?: CreateArticleRequestStatus): CreateArticleRequest {
    const { coAuthorList, subtitle, kind, authorId, ...rest } = formData;
    const payload: any = { ...rest, subtitle };
    if (forceStatus) payload.status = forceStatus;
    if (payload.teamId) payload.teamId = Number(payload.teamId);
    if (!payload.excerpt?.trim()) {
      if (payload.subtitle?.trim()) payload.excerpt = payload.subtitle;
      else {
        const plain = (payload.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        payload.excerpt = plain.substring(0, 200).trim() + (plain.length > 200 ? "..." : "");
      }
    }
    payload.kind = kind === "column" ? "column" : "article";
    payload.authorId =
      typeof authorId === "number" && Number.isFinite(authorId) ? authorId : null;
    payload.coAuthors = (coAuthorList ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email ?? null,
      external: !!c.external,
    }));
    return payload;
  }

  const handleSave = async (
    forceStatus?: CreateArticleRequestStatus,
    options?: { silent?: boolean },
  ) => {
    if (!validation.isValid) {
      toast({ title: "Validação", description: validation.issues[0].message, variant: "destructive" });
      return null;
    }
    const apiPayload = buildPayload(forceStatus);
    try {
      if (isEditing && articleId) {
        const updated = await updateMutation.mutateAsync({ id: articleId, data: apiPayload });
        setPersistedStatus(updated.status);
        if ((updated as any).slug) setArticleSlug((updated as any).slug);
        if (!options?.silent) toast({ title: "Sucesso", description: "Artigo atualizado." });
        return updated;
      } else {
        const created = await createMutation.mutateAsync({ data: apiPayload });
        toast({ title: "Sucesso", description: "Artigo criado." });
        if ((created as any).id) setLocation(`/dashboard/artigos/${(created as any).id}/editar`);
        else setLocation("/dashboard/artigos");
        return created;
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
      return null;
    }
  };

  const handlePublishNow = async () => {
    setShowPublishMenu(false);
    if (!validation.isValid) {
      toast({ title: "Não é possível publicar", description: validation.issues[0].message, variant: "destructive" });
      return;
    }
    if (!isEditing) {
      await handleSave(CreateArticleRequestStatus.published);
      setConfirmAction(null);
      return;
    }
    if (!articleId) return;
    try {
      const saved = await handleSave(undefined, { silent: true });
      if (!saved) return;
      const published = await publishMutation.mutateAsync({ id: articleId });
      setPersistedStatus("published");
      setFormData((p) => ({ ...p, status: CreateArticleRequestStatus.published, scheduledAt: null }));
      if ((published as any).slug) setArticleSlug((published as any).slug);
      toast({ title: "Publicado!", description: "Seu artigo está no ar." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao publicar.", variant: "destructive" });
    }
    setConfirmAction(null);
  };

  const handleScheduleConfirm = async () => {
    setShowPublishMenu(false);
    if (!tempScheduledAt) {
      toast({ title: "Selecione uma data", description: "Defina quando o artigo deve ser publicado.", variant: "destructive" });
      return;
    }
    if (new Date(tempScheduledAt) <= new Date()) {
      toast({ title: "Data inválida", description: "A data de agendamento precisa ser no futuro.", variant: "destructive" });
      return;
    }
    if (!validation.isValid) {
      toast({ title: "Validação", description: validation.issues[0].message, variant: "destructive" });
      return;
    }
    if (!isEditing) {
      const created = await handleSave(CreateArticleRequestStatus.draft);
      if (!created || !(created as any).id) return;
      try {
        await scheduleMutation.mutateAsync({ id: (created as any).id, data: { scheduledAt: tempScheduledAt } });
        toast({ title: "Agendado", description: `Será publicado em ${formatDate(tempScheduledAt)}.` });
      } catch (e: any) {
        toast({ title: "Erro", description: e.message || "Falha ao agendar.", variant: "destructive" });
      }
    } else if (articleId) {
      try {
        await handleSave(undefined, { silent: true });
        await scheduleMutation.mutateAsync({ id: articleId, data: { scheduledAt: tempScheduledAt } });
        setPersistedStatus("scheduled");
        setFormData((p) => ({ ...p, status: CreateArticleRequestStatus.scheduled, scheduledAt: tempScheduledAt as any }));
        toast({ title: "Agendado", description: `Será publicado em ${formatDate(tempScheduledAt)}.` });
      } catch (e: any) {
        toast({ title: "Erro", description: e.message || "Falha ao agendar.", variant: "destructive" });
      }
    }
    setConfirmAction(null);
  };

  const handleUnpublish = async () => {
    if (!articleId) return;
    try {
      await unpublishMutation.mutateAsync(articleId);
      setPersistedStatus("draft");
      setFormData((p) => ({ ...p, status: CreateArticleRequestStatus.draft, scheduledAt: null }));
      toast({ title: "Despublicado", description: "O artigo voltou para rascunho." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao despublicar.", variant: "destructive" });
    }
    setConfirmAction(null);
  };

  const isSavingAny =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    scheduleMutation.isPending ||
    unpublishMutation.isPending;

  if (isEditing && loadingArticle) {
    return <div className="p-12 text-center text-white">Carregando editor...</div>;
  }

  const badge = STATUS_BADGE[persistedStatus] ?? STATUS_BADGE.draft;
  const previewUrl = articleSlug ? `${BASE}/noticias/${articleSlug}` : null;

  // Settings summary chips for the header
  const settingsSummary: { id: string; label: string; tab: SettingsTab; tone?: string }[] = [];
  settingsSummary.push({ id: "cat", label: formData.category, tab: "geral" });
  if (formData.teamId) {
    const team = teams?.find((t: any) => t.id === formData.teamId);
    if (team) settingsSummary.push({ id: "team", label: (team as any).name, tab: "geral" });
  }
  if (formData.featured)     settingsSummary.push({ id: "f", label: "★ Destaque", tab: "destaques", tone: "primary" });
  if (formData.breakingNews) settingsSummary.push({ id: "b", label: "⚡ Urgente", tab: "destaques", tone: "primary" });
  const externalCoAuthors = (formData.coAuthorList ?? []).length;
  if (externalCoAuthors > 0)
    settingsSummary.push({ id: "co", label: `+${externalCoAuthors} co-autor${externalCoAuthors > 1 ? "es" : ""}`, tab: "autoria" });

  return (
    <AdminLayout>
      <div className="min-h-full bg-background text-foreground pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-card to-card/80 border-b border-border/50 backdrop-blur py-3 sm:py-4 px-3 sm:px-6 shadow-lg">
          {/* Top row: back + title + status */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setLocation("/dashboard/artigos")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold font-display uppercase tracking-tight flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">
                  {isEditing ? "Editar Artigo" : "Novo Artigo"}
                </span>
              </h1>
              {user && (
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                  Por {user.name}
                  {persistedStatus === "scheduled" && formData.scheduledAt && (
                    <> · agendado p/ {formatDate(formData.scheduledAt as any)}</>
                  )}
                  {persistedStatus === "published" && existingArticle?.publishedAt && (
                    <> · publicado em {formatDate(existingArticle.publishedAt)}</>
                  )}
                </p>
              )}
            </div>
            <span
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase border whitespace-nowrap flex-shrink-0 ${badge.className}`}
            >
              <span className="hidden sm:inline">{badge.emoji} </span>
              {badge.label}
            </span>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3 flex-wrap sm:justify-end">
            {previewUrl && persistedStatus === "published" && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 sm:px-3 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors"
                title="Abrir no site"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Visualizar</span>
              </a>
            )}

            {/* Settings popover */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings((v) => !v)}
                className="px-2.5 sm:px-3 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configurações</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showSettings ? "rotate-180" : ""}`}
                />
              </button>
              {showSettings && (
                <div className="fixed sm:absolute inset-x-2 top-auto sm:inset-x-auto sm:right-0 sm:top-full mt-2 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl z-30 overflow-hidden">
                  <SettingsPanel
                    tab={settingsTab}
                    setTab={setSettingsTab}
                    formData={formData}
                    setFormData={setFormData}
                    teams={teams}
                    accounts={accounts}
                    accountsLoading={accountsLoading}
                    canPublishColumns={canAccessColumns}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => handleSave()}
              disabled={isSavingAny}
              className="px-2.5 sm:px-4 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending || createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Salvar</span>
            </button>

            {persistedStatus === "published" ? (
              <button
                onClick={() => setConfirmAction("unpublish")}
                disabled={isSavingAny}
                className="px-2.5 sm:px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Undo2 className="w-4 h-4" />
                <span className="hidden sm:inline">Despublicar</span>
              </button>
            ) : (
              <div className="relative" ref={publishMenuRef}>
                <div className="flex">
                  <button
                    onClick={() =>
                      validation.isValid
                        ? setConfirmAction("publish")
                        : toast({
                            title: "Não é possível publicar",
                            description: validation.issues[0].message,
                            variant: "destructive",
                          })
                    }
                    disabled={isSavingAny}
                    className="px-3 sm:px-5 py-2 bg-primary hover:bg-accent text-white rounded-l-lg text-sm font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {publishMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Publicar
                  </button>
                  <button
                    onClick={() => setShowPublishMenu((v) => !v)}
                    disabled={isSavingAny}
                    className="px-2 py-2 bg-primary hover:bg-accent text-white rounded-r-lg border-l border-white/10 transition-colors disabled:opacity-50"
                    aria-label="Mais opções de publicação"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {showPublishMenu && (
                  <div className="fixed sm:absolute inset-x-2 top-auto sm:inset-x-auto sm:right-0 sm:top-full mt-2 sm:w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-30">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Agendar publicação
                    </p>
                    <DateTimePicker value={tempScheduledAt} onChange={setTempScheduledAt} />
                    <button
                      onClick={() => setConfirmAction("schedule")}
                      disabled={!tempScheduledAt || isSavingAny}
                      className="w-full mt-4 px-3 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <CalendarClock className="w-4 h-4" /> Agendar publicação
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settings summary strip */}
        {settingsSummary.length > 0 && (
          <div className="container mx-auto px-3 sm:px-4 max-w-5xl mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Definido:
            </span>
            {settingsSummary.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => { setSettingsTab(chip.tab); setShowSettings(true); }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                  chip.tone === "primary"
                    ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25"
                    : "bg-muted/60 text-gray-300 border-border hover:bg-muted"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Validation banner */}
        {!validation.isValid && (
          <div className="container mx-auto px-3 sm:px-4 max-w-5xl mt-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-300">Antes de publicar, resolva:</p>
                <ul className="mt-1 space-y-0.5 text-xs text-yellow-200/90 list-disc list-inside">
                  {validation.issues.map((iss) => <li key={iss.field}>{iss.message}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Main editor — document style */}
        <main className="mx-auto max-w-3xl px-4 sm:px-8 mt-8 sm:mt-12 pb-40">

          {/* Source badge */}
          {formData.sourceName && (
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-full text-xs text-primary font-bold">
              📰 Importado de: {formData.sourceName}
            </div>
          )}

          {/* Title */}
          <AutoResizeTextarea
            value={formData.title}
            onChange={(v) => setFormData((p) => ({ ...p, title: v }))}
            placeholder="Título do artigo..."
            className="w-full bg-transparent text-white font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight resize-none focus:outline-none placeholder-white/15 mb-2"
          />

          {/* Subtitle row */}
          <div className="flex items-center gap-3 mb-8">
            <input
              type="text"
              value={formData.subtitle || ""}
              onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
              placeholder="Adicione um subtítulo..."
              className="flex-1 bg-transparent text-gray-400 text-lg italic focus:outline-none placeholder-white/15"
            />
            <button
              type="button"
              onClick={handleGenerateSubtitle}
              disabled={generatingSubtitle || !formData.title || !formData.content}
              className="flex-shrink-0 px-3 py-1.5 bg-accent/15 hover:bg-accent/30 text-accent rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generatingSubtitle ? "Gerando..." : "✦ IA"}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-white/8 mb-8" />

          {/* Rich text content — borderless document feel */}
          <RichTextEditor
            value={formData.content}
            onChange={(v) => setFormData((p) => ({ ...p, content: v }))}
            placeholder="Comece a escrever aqui..."
          />
        </main>
      </div>

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          formData={formData}
          tempScheduledAt={tempScheduledAt}
          isPending={isSavingAny}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction === "publish")   { handlePublishNow(); return; }
            if (confirmAction === "schedule")  { handleScheduleConfirm(); return; }
            if (confirmAction === "unpublish") { handleUnpublish(); return; }
          }}
        />
      )}
    </AdminLayout>
  );
}

function ConfirmModal({
  action, formData, tempScheduledAt, isPending, onCancel, onConfirm,
}: {
  action: "publish" | "schedule" | "unpublish";
  formData: any;
  tempScheduledAt: string | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const config = {
    publish: {
      title: "Publicar artigo?",
      message: "O artigo ficará visível no site imediatamente.",
      confirmLabel: "Publicar agora",
      confirmClass: "bg-primary hover:bg-accent",
      icon: <Send className="w-5 h-5" />,
    },
    schedule: {
      title: "Agendar publicação?",
      message: `O artigo será publicado automaticamente em ${formatDate(tempScheduledAt)}.`,
      confirmLabel: "Agendar",
      confirmClass: "bg-sky-600 hover:bg-sky-500",
      icon: <CalendarClock className="w-5 h-5" />,
    },
    unpublish: {
      title: "Despublicar artigo?",
      message: "O artigo voltará para rascunho e será removido do site, mas o conteúdo será preservado.",
      confirmLabel: "Despublicar",
      confirmClass: "bg-zinc-700 hover:bg-zinc-600",
      icon: <Undo2 className="w-5 h-5" />,
    },
  }[action];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            {config.icon}
          </div>
          <div>
            <h3 className="font-display text-lg font-black text-white">{config.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{config.message}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Artigo</p>
          <p className="text-sm text-white font-bold line-clamp-2">{formData.title}</p>
          {formData.subtitle && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{formData.subtitle}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`px-5 py-2 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 ${config.confirmClass}`}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
