import React, { useState } from "react";
import { useRoute } from "wouter";
import { useGetArticle } from "@/hooks/use-articles";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { Calendar, User, Eye, Twitter, Facebook, Link as LinkIcon, Shield, Globe, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ArticleView() {
  const [, params] = useRoute("/noticias/:slug");
  const { data: article, isLoading, error } = useGetArticle(params?.slug || "", { query: { enabled: !!params?.slug } });
  const [copied, setCopied] = useState(false);

  function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(article?.title ?? "");
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank", "noopener,width=600,height=400");
  }

  function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,width=600,height=400");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center flex-col gap-4 text-center">
          <h1 className="text-4xl font-display font-black text-white">Artigo não encontrado</h1>
          <p className="text-muted-foreground">A matéria que você está procurando não existe ou foi removida.</p>
          <Link href="/" className="px-6 py-3 bg-primary text-white rounded-lg font-bold mt-4 hover:bg-accent transition-colors">Voltar para Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const dateStr = article.publishedAt ? format(parseISO(article.publishedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Article Header */}
        <header className="pt-12 pb-8 border-b border-border bg-card/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {(article as any).kind === "column" && (
                <span className="px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded">
                  Coluna
                </span>
              )}
              {article.category && (article as any).kind !== "column" && (
                <Link href={`/categoria/${article.category.toLowerCase()}`} className="px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded">
                  {article.category}
                </Link>
              )}
              {article.teamName && (
                <Link href={`/times/${article.teamSlug}`} className="px-3 py-1 bg-secondary text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1 border border-primary/20 hover:bg-secondary/80">
                  <Shield className="w-3 h-3" /> {article.teamName}
                </Link>
              )}
              {article.sourceName && (
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {article.sourceName}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-white leading-[1.1] mb-3">
              {article.title}
            </h1>
            
            {article.subtitle && (
              <p className="text-lg md:text-xl text-gray-300 italic font-medium mb-6">
                {article.subtitle}
              </p>
            )}
            
            
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground font-medium py-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2 text-white">
                  <User className="w-4 h-4 text-primary" />
                  {(() => {
                    const co = ((article as any).coAuthors ?? []) as Array<{ name: string }>;
                    const isColumn = (article as any).kind === "column";
                    const authorSlug = (article as any).authorSlug as string | null | undefined;
                    const isLinkable =
                      isColumn && (article as any).authorIsColumnist && authorSlug;
                    const mainAuthor = isLinkable ? (
                      <Link
                        href={`/colunistas/${authorSlug}`}
                        className="text-white hover:text-primary transition-colors underline-offset-4 hover:underline"
                      >
                        {article.authorName}
                      </Link>
                    ) : (
                      article.authorName
                    );
                    if (co.length === 0) return mainAuthor;
                    if (co.length === 1) {
                      return (
                        <>
                          {mainAuthor} e {co[0].name}
                        </>
                      );
                    }
                    const others = co.slice(0, -1).map((c) => c.name).join(", ");
                    return (
                      <>
                        {mainAuthor}, {others} e {co[co.length - 1].name}
                      </>
                    );
                  })()}
                </span>
                {dateStr && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {dateStr}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> {article.viewCount} leituras
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm mr-1">Compartilhar:</span>
                <button
                  onClick={shareOnTwitter}
                  title="Compartilhar no Twitter / X"
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </button>
                <button
                  onClick={shareOnFacebook}
                  title="Compartilhar no Facebook"
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </button>
                <button
                  onClick={copyLink}
                  title={copied ? "Link copiado!" : "Copiar link"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    copied
                      ? "bg-green-500 text-white scale-110"
                      : "bg-white/5 hover:bg-primary hover:text-white"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                </button>
                {copied && (
                  <span className="text-xs text-green-400 font-medium animate-fade-in">Link copiado!</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        {article.coverImage && (
          <div className="w-full max-w-5xl mx-auto mt-8 px-4">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted border border-border shadow-2xl">
              <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="container mx-auto px-4 max-w-3xl py-12">
          <article className="prose prose-invert prose-lg prose-p:text-gray-300 prose-headings:text-white prose-a:text-primary hover:prose-a:text-accent max-w-none w-full overflow-hidden">
            {article.content && article.content.trim().startsWith("<") ? (
              <div
                className="text-gray-300 leading-relaxed break-words overflow-wrap-anywhere"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <div className="text-gray-300 leading-relaxed break-words whitespace-pre-wrap overflow-hidden">
                {article.content}
              </div>
            )}
          </article>
          
          {/* Attribution block for imported articles */}
          {article.sourceName && (
            <div className="mt-12 p-6 bg-gradient-to-r from-blue-500/10 to-primary/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-4 mb-4">
                <Globe className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-grow">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong className="text-white block mb-2">Fonte Original</strong>
                    Este artigo foi publicado originalmente em <span className="text-blue-400 font-bold">{article.sourceName}</span>
                    {article.sourceUrl && ` e pode ser acessado em sua versão original`}. 
                    <span className="block text-xs text-gray-500 mt-2">
                      Traduzido e adaptado pela La Liga Brasil via inteligência artificial para melhor compreensão do público brasileiro.
                    </span>
                  </p>
                  {article.sourceUrl && (
                    <a 
                      href={article.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex text-sm font-bold text-blue-400 hover:text-blue-300 items-center gap-2 mt-3 bg-blue-500/10 px-3 py-2 rounded hover:bg-blue-500/20 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Ler versão original em {article.sourceName}
                    </a>
                  )}
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
