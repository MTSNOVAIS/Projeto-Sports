import React from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { usePublicColumnists } from "@/hooks/use-articles";
import { Mic, Twitter } from "lucide-react";

export default function ColunistasIndexPage() {
  const { data: columnists = [], isLoading } = usePublicColumnists();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="border-b border-border bg-card/40">
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-5 h-5 text-primary" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                La Liga Brasil
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter">
              Nossos colunistas
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Análises, opiniões e bastidores do futebol espanhol contados pela
              voz de quem vive o jogo.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-6 animate-pulse h-48"
                />
              ))}
            </div>
          ) : columnists.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Em breve, novos colunistas aqui.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {columnists.map((c) => (
                <Link
                  key={c.id}
                  href={c.slug ? `/colunistas/${c.slug}` : "#"}
                  className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors flex gap-4"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-background border border-border flex-shrink-0 flex items-center justify-center">
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-full h-full object-cover"
                        onError={(e) =>
                          ((e.target as HTMLImageElement).style.display = "none")
                        }
                      />
                    ) : (
                      <span className="text-2xl font-display font-black text-muted-foreground">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-black text-lg text-white group-hover:text-primary transition-colors truncate">
                      {c.name}
                    </h3>
                    {c.title && (
                      <p className="text-xs text-primary mt-0.5 truncate">
                        {c.title}
                      </p>
                    )}
                    {c.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {c.bio}
                      </p>
                    )}
                    {c.twitter && (
                      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <Twitter className="w-3 h-3" />@{c.twitter}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
