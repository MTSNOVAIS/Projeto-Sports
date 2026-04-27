import React, { useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout, isAdmin, canAccessColumns } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/dashboard", label: "Início" },
    { href: "/dashboard/artigos", label: "Artigos" },
    { href: "/dashboard/destaques", label: "Destaques" },
    { href: "/dashboard/partidas", label: "Partidas" },
    { href: "/dashboard/ligas", label: "Ligas" },
    { href: "/dashboard/times", label: "Times" },
    ...(canAccessColumns
      ? [{ href: "/dashboard/colunas", label: "Colunas" }]
      : []),
    ...(isAdmin
      ? [
          { href: "/dashboard/usuarios", label: "Usuários" },
          { href: "/dashboard/cargos", label: "Cargos" },
        ]
      : []),
  ];

  // Fechar menu ao navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const button = document.querySelector('[data-menu-toggle]');
        if (button && !button.contains(event.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-display font-black text-lg group-hover:bg-accent transition-colors">
              LL
            </div>
            <span className="font-display font-black text-lg tracking-tighter hidden sm:block">
              ADMIN
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User & Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              data-menu-toggle
              className="md:hidden p-2 text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border/50 bg-card"
            >
              <div className="flex flex-col p-4 space-y-2">
                {navLinks.map((link) => {
                  const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
