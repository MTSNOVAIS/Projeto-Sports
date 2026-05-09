import React from "react";
import { Link } from "wouter";
import { Twitter, Instagram, Youtube, Facebook } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.27 8.27 0 004.84 1.55V6.85a4.85 4.85 0 01-1.07-.16z" />
  </svg>
);

export function Footer() {
  const { data: settings } = useSiteSettings();

  const siteName = settings?.siteName ?? "La Liga Brasil";
  const logoText = settings?.logoText ?? "LL";
  const logoUrl = settings?.logoUrl ?? null;
  const footerBio = settings?.footerBio ?? "O seu portal definitivo para acompanhar o futebol espanhol. Notícias, análises, resultados e muito mais, feito por brasileiros para brasileiros.";

  const socials = [
    { url: settings?.twitterUrl, icon: <Twitter className="w-5 h-5" />, label: "Twitter" },
    { url: settings?.instagramUrl, icon: <Instagram className="w-5 h-5" />, label: "Instagram" },
    { url: settings?.youtubeUrl, icon: <Youtube className="w-5 h-5" />, label: "YouTube" },
    { url: settings?.facebookUrl, icon: <Facebook className="w-5 h-5" />, label: "Facebook" },
    { url: settings?.tiktokUrl, icon: <TikTokIcon />, label: "TikTok" },
  ].filter((s) => s.url);

  return (
    <footer className="bg-card border-t border-border py-12 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-display font-black">
                  {logoText}
                </div>
              )}
              <span className="font-display font-black text-xl tracking-tighter">
                {siteName}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              {footerBio}
            </p>

            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-5">
                {socials.map(({ url, icon, label }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary hover:bg-primary/10 transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {siteName}. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0">Horário de Brasília (BRT/UTC-3)</p>
        </div>
      </div>
    </footer>
  );
}
