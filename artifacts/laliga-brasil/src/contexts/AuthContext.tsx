import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "editor" | "admin" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuários hardcoded para demo - você pode conectar a um banco de dados depois
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  "editor@laliga.com": {
    password: "editor123",
    user: {
      id: "1",
      name: "Editor",
      email: "editor@laliga.com",
      role: "editor",
    },
  },
  "admin@laliga.com": {
    password: "admin123",
    user: {
      id: "2",
      name: "Admin",
      email: "admin@laliga.com",
      role: "admin",
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage ao montar
  useEffect(() => {
    const storedUser = localStorage.getItem("laliga_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("laliga_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const credentials = DEMO_USERS[email];
    if (!credentials || credentials.password !== password) {
      throw new Error("Email ou senha inválidos");
    }
    
    setUser(credentials.user);
    localStorage.setItem("laliga_user", JSON.stringify(credentials.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("laliga_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
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
