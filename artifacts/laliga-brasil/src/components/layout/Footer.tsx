import React from "react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-display font-black">
                LL
              </div>
              <span className="font-display font-black text-xl tracking-tighter">
                LA LIGA <span className="text-primary">BRASIL</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              O seu portal definitivo para acompanhar o futebol espanhol. Notícias, análises, resultados e muito mais, feito por brasileiros para brasileiros.
            </p>
          </div>
        </div>
        
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} La Liga Brasil. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0">Horário de Brasília (BRT/UTC-3)</p>
        </div>
      </div>
    </footer>
  );
}
