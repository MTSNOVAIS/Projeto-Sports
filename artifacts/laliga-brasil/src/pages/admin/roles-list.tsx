import React, { useState } from "react";
import { Link } from "wouter";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";

interface RolePermission {
  id: string;
  label: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

const AVAILABLE_PERMISSIONS: RolePermission[] = [
  { id: "view_dashboard", label: "Visualizar Dashboard" },
  { id: "manage_articles", label: "Gerenciar Artigos" },
  { id: "create_articles", label: "Criar Artigos" },
  { id: "edit_articles", label: "Editar Artigos" },
  { id: "delete_articles", label: "Excluir Artigos" },
  { id: "publish_articles", label: "Publicar Artigos" },
  { id: "manage_teams", label: "Gerenciar Times" },
  { id: "create_teams", label: "Criar Times" },
  { id: "edit_teams", label: "Editar Times" },
  { id: "delete_teams", label: "Excluir Times" },
  { id: "manage_users", label: "Gerenciar Usuários" },
  { id: "create_users", label: "Criar Usuários" },
  { id: "edit_users", label: "Editar Usuários" },
  { id: "delete_users", label: "Excluir Usuários" },
  { id: "manage_roles", label: "Gerenciar Cargos" },
  { id: "import_articles", label: "Importar Artigos" },
  { id: "view_stats", label: "Visualizar Estatísticas" },
];

export default function AdminRolesList() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Administrador",
      description: "Acesso total ao sistema",
      permissions: AVAILABLE_PERMISSIONS.map((p) => p.id),
      createdAt: "2024-03-01",
    },
    {
      id: "2",
      name: "Editor",
      description: "Pode criar e editar artigos",
      permissions: [
        "view_dashboard",
        "manage_articles",
        "create_articles",
        "edit_articles",
        "publish_articles",
        "view_stats",
      ],
      createdAt: "2024-03-01",
    },
    {
      id: "3",
      name: "Visualizador",
      description: "Apenas leitura",
      permissions: ["view_dashboard", "view_stats"],
      createdAt: "2024-03-01",
    },
  ]);

  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [editedRole, setEditedRole] = useState<Role | null>(null);
  const { toast } = useToast();

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name) {
      toast({ title: "Erro", description: "Nome do cargo é obrigatório.", variant: "destructive" });
      return;
    }

    const role: Role = {
      id: String(roles.length + 1),
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setRoles([...roles, role]);
    setNewRole({ name: "", description: "", permissions: [] });
    setShowNewRoleForm(false);
    toast({ title: "Sucesso", description: "Cargo criado com sucesso." });
  };

  const handleEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setEditedRole({ ...role });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedRole || !editedRole.name) {
      toast({ title: "Erro", description: "Nome do cargo é obrigatório.", variant: "destructive" });
      return;
    }

    setRoles(roles.map((r) => (r.id === editingRoleId ? editedRole : r)));
    setEditingRoleId(null);
    setEditedRole(null);
    toast({ title: "Sucesso", description: "Cargo atualizado com sucesso." });
  };

  const handleCancelEdit = () => {
    setEditingRoleId(null);
    setEditedRole(null);
  };

  const handleDeleteRole = (id: string) => {
    if (roles.length <= 3) {
      toast({ title: "Aviso", description: "Não é possível deletar um cargo essencial.", variant: "destructive" });
      return;
    }
    if (confirm("Tem certeza que deseja excluir este cargo?")) {
      setRoles(roles.filter((r) => r.id !== id));
      toast({ title: "Sucesso", description: "Cargo excluído com sucesso." });
    }
  };

  const togglePermission = (permissionId: string, targetRole: Role) => {
    const newPermissions = targetRole.permissions.includes(permissionId)
      ? targetRole.permissions.filter((p) => p !== permissionId)
      : [...targetRole.permissions, permissionId];

    if (editingRoleId) {
      setEditedRole({ ...targetRole, permissions: newPermissions });
    } else {
      setNewRole({ ...newRole, permissions: newPermissions });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard" className="hover:text-white">Dashboard</Link> <span>/</span> <span className="text-white">Cargos</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white">Gerenciar Cargos</h1>
          </div>
          <button
            onClick={() => setShowNewRoleForm(!showNewRoleForm)}
            className="bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo Cargo
          </button>
        </header>

        {/* Novo Cargo Form */}
        {showNewRoleForm && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Criar Novo Cargo</h2>
            <form onSubmit={handleAddRole} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Cargo</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="Ex: Moderador"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="Breve descrição do cargo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Permissões</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-input/50 p-4 rounded-lg">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={newRole.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id, { ...newRole, id: "", createdAt: "", name: "", description: "" })}
                        className="w-4 h-4 rounded border-border bg-input"
                      />
                      <span className="text-sm text-gray-300">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Criar Cargo
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewRoleForm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal de Edição */}
        {editingRoleId && editedRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card rounded-xl border border-border p-6 w-full max-w-2xl my-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Editar Cargo</h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Cargo</label>
                    <input
                      type="text"
                      value={editedRole.name}
                      onChange={(e) => setEditedRole({ ...editedRole, name: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                    <input
                      type="text"
                      value={editedRole.description}
                      onChange={(e) => setEditedRole({ ...editedRole, description: e.target.value })}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Permissões</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-input/50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    {AVAILABLE_PERMISSIONS.map((permission) => (
                      <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={editedRole.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id, editedRole)}
                          className="w-4 h-4 rounded border-border bg-input"
                        />
                        <span className="text-sm text-gray-300">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-accent text-white px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabela de Cargos */}
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{role.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 mb-3 uppercase">Permissões ({role.permissions.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {role.permissions.length > 0 ? (
                    role.permissions.map((permId) => {
                      const perm = AVAILABLE_PERMISSIONS.find((p) => p.id === permId);
                      return perm ? (
                        <span key={permId} className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium">
                          ✓ {perm.label}
                        </span>
                      ) : null;
                    })
                  ) : (
                    <span className="text-xs text-gray-500 col-span-full">Nenhuma permissão</span>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-4">Criado em {role.createdAt}</div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
