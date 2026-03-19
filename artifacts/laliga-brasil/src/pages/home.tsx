import React from "react";
import { useListArticles } from "@/hooks/use-articles";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { AlertCircle, Flame, Trophy, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: response, isLoading } = useListArticles({ limit: 10 });
  const articles = response?.articles || [];
  
  const breakingNews = articles.filter(a => a.breakingNews).slice(0, 3);
  const featured = articles.find(a => a.featured) || articles[0];
  const latest = articles.filter(a => a.id !== featured?.id).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="bg-primary text-white py-2 overflow-hidden flex items-center border-b border-primary/50 shadow-[0_0_15px_rgba(219,0,55,0.3)]">
          <div className="container mx-auto px-4 flex items-center">
            <span className="flex items-center gap-2 font-black uppercase text-xs tracking-widest whitespace-nowrap z-10 bg-primary pr-4">
              <AlertCircle className="w-4 h-4 animate-pulse" />
              Urgente
            </span>
            <div className="flex-1 overflow-hidden relative">
              <div className="animate-ticker flex whitespace-nowrap gap-8 text-sm font-medium">
                {breakingNews.map(item => (
                  <Link key={item.id} href={`/noticias/${item.slug}`} className="hover:underline flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {/* Teams Shortcut Bar */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4">
            <div className="flex overflow-x-auto py-3 gap-6 hide-scrollbar items-center justify-start md:justify-center">
              {['Real Madrid', 'Barcelona', 'Atlético Madrid', 'Sevilla', 'Real Sociedad', 'Athletic Club', 'Betis'].map(team => (
                <Link key={team} href={`/times/${team.toLowerCase().replace(' ', '-')}`} className="text-xs font-bold uppercase text-muted-foreground hover:text-primary whitespace-nowrap transition-colors flex items-center gap-2">
                  <Shield className="w-3 h-3" /> {team}
                </Link>
              ))}
              <Link href="/times" className="text-xs font-bold uppercase text-white whitespace-nowrap ml-4 border border-white/20 px-3 py-1 rounded-full hover:bg-white hover:text-black transition-colors">
                Todos os Times
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 sm:py-12">
          
          {isLoading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Main Content Area */}
              <div className="lg:col-span-8 space-y-8">
                {featured && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="text-primary w-5 h-5" />
                      <h2 className="font-display text-xl text-white">Destaque</h2>
                    </div>
                    <ArticleCard article={featured} featured={true} />
                  </motion.div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                    <h2 className="font-display text-2xl flex items-center gap-2">
                      Últimas <span className="text-primary">Notícias</span>
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latest.map((article, idx) => (
                      <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                        <ArticleCard article={article} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>


            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
