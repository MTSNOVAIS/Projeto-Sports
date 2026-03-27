import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useListTeams } from "@/hooks/use-teams";
import { useLeagues } from "@/hooks/use-leagues";
import { Shield, MapPin, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamsList() {
  const { data: teams, isLoading } = useListTeams();
  const { data: leagues = [] } = useLeagues();
  const [activeLeague, setActiveLeague] = useState<number | null>(null);

  const allTeams = teams || [];
  const teamsWithLeague = allTeams.filter(t => (t as any).leagueId);
  const teamsWithoutLeague = allTeams.filter(t => !(t as any).leagueId);

  const leaguesWithTeams = leagues.filter(l =>
    allTeams.some(t => (t as any).leagueId === l.id)
  );

  const filteredTeams = activeLeague
    ? allTeams.filter(t => (t as any).leagueId === activeLeague)
    : allTeams;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-card border-b border-border py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-primary w-6 h-6" />
              <h1 className="text-4xl font-bold uppercase tracking-tight text-white">
                Clubes
              </h1>
            </div>
            <p className="text-muted-foreground">
              {leagues.length > 0 ? "Clubes organizados por liga" : "Todos os clubes do site"}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {leaguesWithTeams.length > 0 && (
                <>
                  {/* League filter tabs */}
                  <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                    <button
                      onClick={() => setActiveLeague(null)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeLeague === null ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-white"}`}
                    >
                      Todos
                    </button>
                    {leaguesWithTeams.map(league => (
                      <button
                        key={league.id}
                        onClick={() => setActiveLeague(activeLeague === league.id ? null : league.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeLeague === league.id ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-white"}`}
                      >
                        {league.logoUrl && (
                          <img src={league.logoUrl} alt="" className="w-4 h-4 object-contain" onError={e => { e.currentTarget.style.display = "none"; }} />
                        )}
                        {league.name}
                      </button>
                    ))}
                  </div>

                  {/* Teams grouped by league */}
                  {activeLeague ? (
                    <TeamGrid teams={filteredTeams} />
                  ) : (
                    <div className="space-y-10">
                      {leaguesWithTeams.map(league => {
                        const leagueTeams = allTeams.filter(t => (t as any).leagueId === league.id);
                        if (leagueTeams.length === 0) return null;
                        return (
                          <div key={league.id}>
                            <div className="flex items-center gap-3 mb-5 border-b border-border pb-3">
                              {league.logoUrl && (
                                <img src={league.logoUrl} alt="" className="w-6 h-6 object-contain" onError={e => { e.currentTarget.style.display = "none"; }} />
                              )}
                              <h2 className="text-xl font-black text-white">{league.name}</h2>
                              {league.country && <span className="text-sm text-muted-foreground">{league.country}</span>}
                              <span className="ml-auto text-xs text-muted-foreground">{leagueTeams.length} clubes</span>
                            </div>
                            <TeamGrid teams={leagueTeams} />
                          </div>
                        );
                      })}
                      {teamsWithoutLeague.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-5 border-b border-border pb-3">
                            <Shield className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-xl font-black text-white">Outros Clubes</h2>
                          </div>
                          <TeamGrid teams={teamsWithoutLeague} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {leaguesWithTeams.length === 0 && (
                <TeamGrid teams={allTeams} />
              )}

              {allTeams.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum clube cadastrado ainda.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TeamGrid({ teams }: { teams: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {teams.map((team, idx) => (
        <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
          <Link href={`/times/${team.slug}`} className="group block bg-card border border-border hover:border-primary/50 rounded-xl p-5 text-center transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
            <div
              className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${team.primaryColor}22, ${team.secondaryColor}11)`,
                border: `2px solid ${team.primaryColor}40`,
              }}
            >
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-12 h-12 object-contain" onError={e => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <Shield className="w-8 h-8" style={{ color: team.primaryColor }} />
              )}
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors leading-tight">{team.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> {team.city}
            </p>
            {(team as any).articleCount > 0 && (
              <span className="inline-block mt-2 text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">{(team as any).articleCount} matérias</span>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
