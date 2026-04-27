import React from "react";
import { Link, useRoute } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useColumnistBySlug } from "@/hooks/use-articles";
import { Twitter, Calendar, Eye, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ColunistaDetailPage() {
  const [, params] = useRoute("/colunistas/:slug");
  const slug = params?.slug;
  const { data, isLoading, error } = useColumnistBySlug(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center flex-col gap-4 text-center px-4">
          <h1 className="text-3xl font-display font-black text-white">
            Colunista não encontrado
          </h1>
          <Link
            href="/colunistas"
            className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-accent"
          >
            Ver todos os colunistas
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { columnist, columns } = data;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Header */}
        <section className="border-b border-border bg-card/40">
          <div className="container mx-auto px-4 py-12">
            <Link
              href="/colunistas"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-white mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Todos os colunistas
            </Link>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-background border border-border flex-shrink-0 flex items-center justify-center">
                {columnist.avatarUrl ? (
                  <img
                    src={columnist.avatarUrl}
                    alt={columnist.name}
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                ) : (
                  <span className="text-4xl font-display font-black text-muted-foreground">
                    {columnist.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-2">
                  Colunista
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter">
                  {columnist.name}
                </h1>
                {columnist.title && (
                  <p className="text-lg text-white/70 italic mt-2">
                    {columnist.title}
                  </p>
                )}
                {columnist.bio && (
                  <p className="text-muted-foreground mt-4 max-w-2xl">
                    {columnist.bio}
                  </p>
                )}
                {columnist.twitter && (
                  <a
                    href={`https://twitter.com/${columnist.twitter}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="w-4 h-4" />@{columnist.twitter}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Columns */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-display font-black tracking-tight mb-6">
            Últimas colunas
          </h2>
          {columns.length === 0 ? (
            <p className="text-muted-foreground py-8">
              Este colunista ainda não publicou nada.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {columns.map((col) => (
                <Link
                  key={col.id}
                  href={`/noticias/${col.slug}`}
                  className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col"
                >
                  {col.coverImage && (
                    <div className="aspect-video bg-background overflow-hidden">
                      <img
                        src={col.coverImage}
                        alt={col.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                      {col.category}
                    </p>
                    <h3 className="text-lg font-display font-black text-white group-hover:text-primary transition-colors line-clamp-2">
                      {col.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
                      {col.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                      {col.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(col.publishedAt), "dd MMM yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {col.viewCount}
                      </span>
                    </div>
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
