import React, { useState } from "react";
import { Link } from "wouter";
import { Search, Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "editor" | "admin" | "viewer";
  active: boolean;
  createdAt: string;
}

export default function AdminUsersList() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: "1",
      email: "editor@laliga.com",
      name: "Editor",
      role: "editor",
      active: true,
      createdAt: "2024-03-01",
    },
    {
      id: "2",
      email: "admin@laliga.com",
      name: "Admin",
      role: "admin",
      active: true,
      createdAt: "2024-03-01",
    },
  ]);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "editor" as const });
  const { toast } = useToast();

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    const user: AdminUser = {
      id: String(users.length + 1),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      active: true,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers([...users, user]);
    setNewUser({ email: "", name: "", password: "", role: "editor" });
    setShowNewUserForm(false);
    toast({ title: "Sucesso", description: "Usuário criado com sucesso." });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      setUsers(users.filter((u) => u.id !== id));
      toast({ title: "Sucesso", description: "Usuário excluído com sucesso." });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      editor: "Editor",
      viewer: "Visualizador",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500/10 text-red-500",
      editor: "bg-blue-500/10 text-blue-500",
      viewer: "bg-gray-500/10 text-gray-400",
    };
    return colors[role] || "bg-gray-500/10 text-gray-400";
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard" className="hover:text-white">Dashboard</Link> <span>/</span> <span className="text-white">Usuários</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white">Gerenciar Usuários</h1>
          </div>
          <button
            onClick={() => setShowNewUserForm(!showNewUserForm)}
            className="bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        </header>

        {/* Novo Usuário Form */}
        {showNewUserForm && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Criar Novo Usuário</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="usuario@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    placeholder="Senha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cargo</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="viewer">Visualizador</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Criar Usuário
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewUserForm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Busca */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Nome</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Cargo</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Criado em</th>
                  <th className="px-6 py-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.active ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 text-gray-400"
                        }`}>
                          {user.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{user.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
