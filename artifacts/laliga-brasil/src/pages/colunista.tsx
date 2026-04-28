import React from "react";
import { Link, useRoute } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useColumnistBySlug } from "@/hooks/use-articles";
import { Mic, Twitter, Calendar, Eye, ChevronLeft, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

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
          <Mic className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Colunista não encontrado</h1>
          <Link
            href="/colunistas"
            className="text-primary hover:underline"
          >
            ← Ver todos os colunistas
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { columnist, columns } = data;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Columnist Hero - mesma estrutura da página de Time */}
        <div
          className="relative border-b border-border overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0D0D0D 0%, rgba(219,0,55,0.13) 50%, #0D0D0D 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle, #DB0037 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="container mx-auto px-4 py-12 relative z-10">
            <Link
              href="/colunistas"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Todos os Colunistas
            </Link>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div
                className="w-32 h-32 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden bg-background"
                style={{
                  border: "3px solid rgba(219,0,55,0.6)",
                  boxShadow: "0 0 40px rgba(219,0,55,0.2)",
                }}
              >
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
                  <span className="text-5xl font-display font-black text-muted-foreground">
                    {columnist.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
                  {columnist.name}
                </h1>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-primary" /> Colunista
                  </span>
                  {columnist.title && (
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-primary" />
                      {columnist.title}
                    </span>
                  )}
                  {columnist.twitter && (
                    <a
                      href={`https://twitter.com/${columnist.twitter}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-primary" />@
                      {columnist.twitter}
                    </a>
                  )}
                </div>
                {columnist.bio && (
                  <p className="mt-4 max-w-2xl text-gray-400 leading-relaxed">
                    {columnist.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h2 className="text-2xl font-bold">
              Colunas de <span className="text-primary">{columnist.name}</span>
            </h2>
            <span className="text-sm text-muted-foreground">
              {columns.length} {columns.length === 1 ? "publicação" : "publicações"}
            </span>
          </div>

          {columns.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Este colunista ainda não publicou nada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {columns.map((col, idx) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={`/noticias/${col.slug}`}
                    className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all hover:shadow-lg hover:shadow-primary/10 h-full flex flex-col"
                  >
                    {col.coverImage ? (
                      <div className="aspect-video bg-background overflow-hidden">
                        <img
                          src={col.coverImage}
                          alt={col.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) =>
                            ((e.target as HTMLImageElement).style.display = "none")
                          }
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-background flex items-center justify-center border-b border-border">
                        <Mic className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
                          <Mic className="w-2.5 h-2.5" /> Coluna
                        </span>
                        {col.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {col.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-display font-black text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
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
