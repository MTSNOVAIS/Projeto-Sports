import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useListTeams } from "@/hooks/use-teams";
import { Shield, MapPin, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamsList() {
  const { data: teams, isLoading } = useListTeams();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-card border-b border-border py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-primary w-6 h-6" />
              <h1 className="text-4xl font-bold uppercase tracking-tight text-white">Times da <span className="text-primary">La Liga</span></h1>
            </div>
            <p className="text-muted-foreground">Os 20 clubes da Primeira Divisão do Campeonato Espanhol</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          {isLoading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(teams || []).map((team, idx) => (
                <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Link href={`/times/${team.slug}`} className="group block bg-card border border-border hover:border-primary/50 rounded-xl p-5 text-center transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${team.primaryColor}22, ${team.secondaryColor}11)`, border: `2px solid ${team.primaryColor}40` }}>
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-12 h-12 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <Shield className="w-8 h-8" style={{ color: team.primaryColor }} />
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors leading-tight">{team.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" /> {team.city}
                    </p>
                    {team.articleCount > 0 && (
                      <span className="inline-block mt-2 text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">{team.articleCount} matérias</span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
