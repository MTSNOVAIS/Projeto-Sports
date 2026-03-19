import React, { useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const links = [
    { href: "/", label: "Home" },
    { href: "/times", label: "Times" },
    { href: "/busca", label: "Busca" },
    { href: "/categoria/resultados", label: "Resultados" },
  ];

  // Fechar menu quando navega ou clica fora
  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const button = document.querySelector('[data-menu-button]');
        if (button && !button.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        const searchButton = document.querySelector('[data-search-button]');
        if (searchButton && !searchButton.contains(event.target as Node)) {
          setIsSearchOpen(false);
        }
      }
    }

    if (isOpen || isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isSearchOpen]);

  // Focus no input de busca quando abre
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/busca?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-display font-black text-xl group-hover:bg-accent transition-colors">
                LL
              </div>
              <span className="font-display font-black text-2xl tracking-tighter hidden sm:block">
                LA LIGA <span className="text-primary">BRASIL</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${
                    location === link.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button 
              data-search-button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-muted-foreground hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              data-menu-button
              className="md:hidden p-2 text-white"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            ref={searchRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-20 right-0 left-0 z-40 border-b border-white/5 bg-background/95 backdrop-blur shadow-lg"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <form onSubmit={handleSearch} className="max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar matérias, times, jogadores..."
                    className="w-full bg-background border border-border rounded-lg pl-12 pr-12 py-3 text-white text-base focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/10 bg-card"
          >
            <div className="flex flex-col p-4 space-y-2">
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
                    location === link.href ? "bg-primary text-white" : "text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
