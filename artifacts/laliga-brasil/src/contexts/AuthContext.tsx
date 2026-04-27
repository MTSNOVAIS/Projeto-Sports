import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "editor" | "admin" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isColumnist?: boolean;
  columnistSlug?: string | null;
  columnistTitle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  twitter?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canAccessColumns: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STORAGE_KEY = "laliga_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const persist = (next: User | null) => {
    setUser(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? "E-mail ou senha inválidos");
    }
    const data: User = await res.json();
    persist(data);
  };

  const logout = () => persist(null);

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE}/api/auth/me/${user.id}`);
      if (res.ok) {
        const data: User = await res.json();
        persist(data);
      }
    } catch {
      /* ignore */
    }
  };

  const isAdmin = user?.role === "admin";
  const canAccessColumns = !!user && (user.isColumnist === true || isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin,
        canAccessColumns,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
