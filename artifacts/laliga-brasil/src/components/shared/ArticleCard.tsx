import React from "react";
import { Link } from "wouter";
import { Clock, Eye, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string | null;
  category: string;
  publishedAt?: string | null;
  viewCount: number;
}

export function ArticleCard({ article, featured = false }: { article: Article, featured?: boolean }) {
  const dateStr = article.publishedAt ? format(parseISO(article.publishedAt), "dd 'de' MMM, yyyy", { locale: ptBR }) : "";
  
  if (featured) {
    return (
      <Link href={`/noticias/${article.slug}`} className="group relative overflow-hidden rounded-2xl block border border-border/50 bg-card hover:border-primary/50 transition-all duration-500">
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          {article.coverImage ? (
            <img 
              src={article.coverImage} 
              alt={article.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full">
            {article.category}
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3 leading-tight group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-gray-300 line-clamp-2 md:text-lg mb-4 max-w-3xl">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
            {dateStr && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {dateStr}</span>}
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {article.viewCount} views</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/noticias/${article.slug}`} className="group flex flex-col bg-card rounded-xl border border-border/40 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
      <div className="aspect-video w-full overflow-hidden bg-muted relative">
        {article.coverImage ? (
          <img 
            src={article.coverImage} 
            alt={article.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/50 to-muted" />
        )}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur text-white rounded">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mt-auto pt-4 border-t border-border/40">
          <span>{dateStr}</span>
          <span className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
            LER MAIS <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
