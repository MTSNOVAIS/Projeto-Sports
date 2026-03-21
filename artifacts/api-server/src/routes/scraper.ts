import { Router, type IRouter } from "express";
import { db, articlesTable, newsSourcesTable, importTopicsTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const TRANSLATION_SYSTEM_PROMPT = `Você é um jornalista esportivo brasileiro experiente, especializado em futebol europeu. Sua tarefa é traduzir e adaptar matérias de futebol para o português brasileiro, com um texto natural, fluido e jornalístico — como se a matéria tivesse sido escrita originalmente em português, por um redator esportivo brasileiro.

Regras obrigatórias:
- Escreva em português brasileiro informal-jornalístico: direto, dinâmico, sem ser travado ou artificial.
- Use a terminologia do futebol brasileiro: "gol" (não "golaço" sem motivo), "chute", "pênalti", "impedimento", "falta", "cartão amarelo/vermelho", "goleiro", "zagueiro", "lateral", "meia", "atacante", "ponta", "camisa 9", "técnico" (não "treinador"), "campo", "estádio", "torcida", "placar", "rodada", "tabela", "mata-mata", "oitavas/quartas/semifinal/final", "ida/volta", "título", "campeonato".
- Mantenha nomes próprios como estão (jogadores, clubes, cidades, estádios, competições).
- Não use construções artificiais de tradução automática. Reescreva frases quando necessário para que soem naturais.
- Adapte expressões idiomáticas: encontre equivalentes brasileiros, não traduza palavra por palavra.
- Use verbos no passado para fatos ocorridos, presente para declarações/contextos.
- Não adicione informações que não existam no original.
- Responda SOMENTE com JSON válido, sem markdown, sem explicações.`;

const SUBTITLE_SYSTEM_PROMPT = `Você é um editor de esportes brasileiro. Crie subtítulos concisos e informativos para matérias de futebol, escritos em português brasileiro natural. O subtítulo deve complementar o título sem repeti-lo, capturando o ponto mais importante da matéria em até 15 palavras. Responda apenas com o texto do subtítulo, sem aspas ou formatação extra.`;

// Generate AI subtitle for article (always in Brazilian Portuguese)
async function generateSubtitle(title: string, content: string): Promise<string> {
  if (!title || !content) return "";
  
  try {
    const prompt = `Título: ${title}
Conteúdo: ${content.substring(0, 600)}

Crie um subtítulo em português brasileiro (até 15 palavras) que complemente o título sem repeti-lo.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SUBTITLE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 60,
    });

    const subtitle = completion.choices[0]?.message?.content || "";
    return subtitle.trim().replace(/^["']|["']$/g, "");
  } catch (err) {
    console.error("Subtitle generation error:", err);
    return "";
  }
}

// Translate article to Brazilian Portuguese using AI
async function translateArticle(title: string, content: string, sourceName: string, sourceLanguage: string = "es"): Promise<{ title: string; content: string; excerpt: string; subtitle: string }> {
  if (!title || !content) return { title, content, excerpt: "", subtitle: "" };
  
  const langLabel = sourceLanguage === "en" ? "inglês" : "espanhol";

  try {
    const prompt = `Traduza e adapte a matéria abaixo do ${langLabel} para o português brasileiro. Fonte: ${sourceName || "desconhecida"}.

Retorne um JSON com as chaves: "title", "excerpt", "content".
- "title": título traduzido
- "excerpt": resumo de 2 frases (máximo 200 caracteres) em português
- "content": corpo completo da matéria traduzido

Título original: ${title}
Conteúdo original: ${content}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let parsed: { title?: string; excerpt?: string; content?: string };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {};
    }

    const translatedTitle = parsed.title || title;
    const translatedContent = parsed.content || content;
    const excerpt = parsed.excerpt || generateExcerpt(translatedContent);
    const subtitle = await generateSubtitle(translatedTitle, translatedContent);

    return { title: translatedTitle, content: translatedContent, excerpt, subtitle };
  } catch (err) {
    console.error("Translation error:", err);
    const excerpt = generateExcerpt(content);
    return { title, content, excerpt, subtitle: "" };
  }
}

// Generate an AI-style summary excerpt (not just start of text)
function generateExcerpt(content: string): string {
  if (!content) return "";
  
  // Split into sentences
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) return content.substring(0, 200) + "...";
  
  // Try to pick the most important sentences (usually 1st and one more)
  let excerpt = sentences[0].trim();
  
  // Add another sentence that's not just continuation
  if (sentences.length > 1) {
    for (let i = 1; i < sentences.length; i++) {
      if (sentences[i].length > 50) { // Avoid very short sentences
        excerpt += " " + sentences[i].trim();
        break;
      }
    }
  }
  
  // Limit to ~200 chars
  if (excerpt.length > 200) {
    excerpt = excerpt.substring(0, 200).trim();
    if (!excerpt.endsWith('.')) excerpt += "...";
  }
  
  return excerpt;
}

const NEWS_SOURCES = [
  {
    id: "marca",
    name: "Marca",
    url: "https://www.marca.com",
    language: "es",
    description: "O jornal esportivo mais lido da Espanha",
    active: true,
    type: "rss",
    rssFeed: "https://www.marca.com/rss/futbol.xml",
  },
  {
    id: "as",
    name: "AS",
    url: "https://as.com",
    language: "es",
    description: "Diário esportivo espanhol com foco em futebol",
    active: true,
    type: "rss",
    rssFeed: "https://as.com/rss/futbol.xml",
  },
  {
    id: "espn",
    name: "ESPN",
    url: "https://www.espn.com",
    language: "en",
    description: "Cobertura esportiva internacional",
    active: true,
    type: "rss",
    rssFeed: "https://feeds.espn.com/feeds/site/espn/global/en/news",
  },
  {
    id: "bbc-sport",
    name: "BBC Sport",
    url: "https://www.bbc.com/sport",
    language: "en",
    description: "Cobertura de esportes da BBC",
    active: true,
    type: "rss",
    rssFeed: "https://feeds.bbc.co.uk/sport/football/rss.xml",
  },
  {
    id: "goal",
    name: "Goal.com",
    url: "https://www.goal.com",
    language: "en",
    description: "Cobertura internacional de futebol",
    active: true,
    type: "api",
    apiKey: "goal",
  },
  {
    id: "sport",
    name: "Sport",
    url: "https://www.sport.es",
    language: "es",
    description: "Jornal esportivo barcelonista",
    active: true,
    type: "rss",
    rssFeed: "https://www.sport.es/rss/futbol.xml",
  },
  {
    id: "mundo-deportivo",
    name: "Mundo Deportivo",
    url: "https://www.mundodeportivo.com",
    language: "es",
    description: "Jornal esportivo com foco no Barcelona",
    active: true,
    type: "rss",
    rssFeed: "https://www.mundodeportivo.com/rss/futbol.xml",
  },
];

// Fallback mock articles for demo when real feeds aren't available
const MOCK_ARTICLES: Record<string, Array<{
  originalTitle: string;
  originalContent: string;
  originalExcerpt: string;
  originalUrl: string;
  coverImage: string | null;
  publishedAt: string;
}>> = {
  marca: [
    {
      originalTitle: "Real Madrid prepara oferta histórica por Mbappé para el próximo verano",
      originalContent: "El Real Madrid está preparando una oferta sin precedentes para fichar a Kylian Mbappé en el próximo mercado de verano. Según fuentes cercanas al club blanco, la oferta podría superar los 200 millones de euros, lo que sería el fichaje más caro de la historia del club. El jugador francés lleva tiempo siendo el principal objetivo del conjunto merengue, y todo apunta a que esta vez el acuerdo podría cerrarse definitivamente. Florentino Pérez habría dado luz verde a la operación, consciente de que Mbappé representaría el mayor galáctico de la era moderna.",
      originalExcerpt: "El club blanco estaría dispuesto a superar los 200 millones de euros para hacerse con el delantero francés.",
      originalUrl: "https://www.marca.com/futbol/real-madrid/2024/01/mbappe-oferta",
      coverImage: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      originalTitle: "Barcelona anuncia la renovación de Pedri hasta 2028",
      originalContent: "El FC Barcelona ha anunciado la renovación de contrato de Pedri González hasta 2028. El centrocampista canario, considerado uno de los mejores jugadores jóvenes del mundo, ha llegado a un acuerdo con el club azulgrana por las próximas cuatro temporadas. La cláusula de rescisión del jugador se fija en 1.000 millones de euros. Joan Laporta ha destacado que Pedri es el futuro del Barça y que su continuidad es fundamental para el proyecto deportivo del club.",
      originalExcerpt: "El centrocampista canario amplía su vínculo con el club azulgrana hasta 2028 con una cláusula de 1.000 millones.",
      originalUrl: "https://www.marca.com/futbol/barcelona/2024/01/pedri-renovacion",
      coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ],
  as: [
    {
      originalTitle: "Vinicius Jr. gana el Balón de Oro por segunda vez consecutiva",
      originalContent: "Vinicius Junior ha ganado su segundo Balón de Oro consecutivo, consolidándose como el mejor jugador del mundo. El brasileño del Real Madrid ha tenido una temporada excepcional, siendo fundamental en la conquista de la Champions League y LaLiga por parte del conjunto merengue. En su discurso de aceptación, Vinicius agradeció a su familia, compañeros y al Real Madrid por el apoyo recibido. El brasileño se convierte en el primer jugador latinoamericano en ganar el premio en años consecutivos.",
      originalExcerpt: "El extremo brasileño del Real Madrid vuelve a alzarse con el prestigioso galardón por segunda vez en su carrera.",
      originalUrl: "https://as.com/futbol/vinicius-balon-de-oro-2024",
      coverImage: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
  espn: [
    {
      originalTitle: "Manchester City dominates Premier League with historic winning streak",
      originalContent: "Manchester City has continued its dominance in the English Premier League, extending their winning streak to unprecedented levels. Manager Pep Guardiola's tactical mastery and the squad's consistency have made them the clear favorites for the title. The team's attacking prowess and defensive solidity have set new records for the season, with record-breaking goal tallies and minimal defeats.",
      originalExcerpt: "The English champions set a new record with their latest victory against a top-six rival.",
      originalUrl: "https://www.espn.com/soccer/story/manchester-city-winning-streak",
      coverImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "bbc-sport": [
    {
      originalTitle: "Liverpool's title challenge gains momentum with crucial victory",
      originalContent: "Liverpool Football Club has strengthened their position in the title race with an emphatic victory against a fellow contender. The Merseyside club's tactical approach and clinical finishing were on full display, as they secured three crucial points. Manager's strategic decisions proved pivotal in the contest, with key players delivering standout performances.",
      originalExcerpt: "The Reds continue to chase the Premier League title with another important three points.",
      originalUrl: "https://www.bbc.com/sport/football/liverpool-victory",
      coverImage: "https://images.unsplash.com/photo-1540747913ee1afdd41c9d4da2d50baa",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, "—")
    .replace(/&#8211;/g, "–")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");  // Must be last to avoid double-decoding
}

// Helper function to check if a paragraph is meta-information
function isMetaParagraph(text: string): boolean {
  const cleaned = text.toLowerCase().trim();
  
  // Patterns that indicate meta-information, not actual article content
  const metaPatterns = [
    /foto\s*:\s*/i,              // Photo credit
    /\s*\/\s*propias/i,          // " / Propias" (image source)
    /periodista\s|redactor\s|colaborador\s/i, // Author descriptions (narrower)
    /última\s+actualización|last\s+modified/i, // Update timestamps
    /\d{1,2}:\d{2}\s*(cet|gmt|utc)\b/i,       // Timezone times (narrow)
    /^compartir$|^share$|^tags$/i,              // Navigation labels only
    // Google UI elements
    /google\s+news|google\s+search|pesquisar\s+no\s+google/i,
    /^pesquisar$|^search$|^fazer\s+login$|^sign\s+in$/i,
    /^(seguindo|following|salvos?|saved)$/i,
    /sugestões?\s+de\s+pesquisa|search\s+suggestion/i,
  ];
  
  return metaPatterns.some(pattern => pattern.test(cleaned));
}

// Helper function to strip HTML tags from text
function stripHtmlTags(text: string): string {
  let result = text;
  
  // Remove script tags and all their content (case-insensitive, handles multiline)
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  
  // Remove style tags and all their content
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  
  // Remove noscript tags and content
  result = result.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  
  // Remove iframe tags and content
  result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, " ");
  
  // Remove comment tags
  result = result.replace(/<!--[\s\S]*?-->/g, " ");
  
  // Remove all HTML tags
  result = result.replace(/<[^>]*>/g, " ");
  
  // Decode HTML entities
  result = result
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, "—")
    .replace(/&#8211;/g, "–")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");  // Must be last to avoid double-decoding
  
  // Remove any remaining code patterns
  result = result
    .replace(/\bvar\s+\w+\s*=\s*[^;]*;/g, "")  // var declarations
    .replace(/\blet\s+\w+\s*=\s*[^;]*;/g, "")  // let declarations  
    .replace(/\bconst\s+\w+\s*=\s*[^;]*;/g, "")  // const declarations
    .replace(/\bfunction\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g, "");  // function declarations
  
  // Clean up multiple spaces and newlines
  result = result.replace(/\s+/g, " ").trim();
  
  return result;
}

// Helper function to remove unnecessary sections from article content
function cleanArticleContent(html: string): string {
  let cleaned = html;
  
  // Remove common unnecessary sections and patterns
  const unnecessary = [
    // Video sections
    /<[^>]*class="[^"]*video[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<[^>]*id="[^"]*video[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    
    // Related articles sections
    /<[^>]*class="[^"]*related[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<[^>]*class="[^"]*similar[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    
    // Comments sections
    /<[^>]*class="[^"]*comment[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<[^>]*id="[^"]*comment[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    
    // Social/sharing sections
    /<[^>]*class="[^"]*social[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<[^>]*class="[^"]*share[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    
    // Ads and promotional content
    /<[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<[^>]*class="[^"]*advertisement[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<[^>]*id="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    
    // Sidebar and footer sections
    /<[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<[^>]*id="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    
    // Navigation
    /<[^>]*class="[^"]*nav[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,

    // Google-specific elements (search bar, header menus, etc.)
    /<[^>]*(?:id|class)="[^"]*(?:gb_|gf-|search-form|search-bar|g-search|top-bar|masthead)[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi,
    /<form[^>]*(?:action|id|class)="[^"]*(?:search|pesquisa|busca)[^"]*"[^>]*>[\s\S]*?<\/form>/gi,
    /<header[^>]*>[\s\S]*?<\/header>/gi,
  ];
  
  for (const pattern of unnecessary) {
    cleaned = cleaned.replace(pattern, " ");
  }
  
  return cleaned;
}

// Helper function to extract and filter paragraphs
function extractMainContent(html: string): string {
  // Extract all paragraphs
  const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  
  if (paragraphs.length === 0) return html;
  
  // Filter out very short paragraphs (likely not main content)
  const longParagraphs = paragraphs.filter(p => {
    const textOnly = p.replace(/<[^>]*>/g, "").trim();
    return textOnly.length > 60;  // Keep paragraphs with more than 60 chars
  });
  
  // If we have long paragraphs, use those; otherwise use all paragraphs
  const useParagraphs = longParagraphs.length > 0 ? longParagraphs : paragraphs;
  
  // Join paragraphs with spacing
  return useParagraphs.join("\n\n");
}

// Helper function to extract OG/Twitter image from HTML
// Only returns images from the real article page — never Google-generated images.
function extractOgImage(html: string): string | null {
  const patterns = [
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
    /<meta\s+property=["']og:image:url["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']twitter:image:src["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image:src["']/i,
    /<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1] && m[1].startsWith("http")) {
      // Reject Google-generated thumbnail URLs
      if (isGoogleUrl(m[1])) continue;
      return m[1];
    }
  }
  return null;
}

// Resolve a Google News redirect URL to the real article URL.
// Google News uses several redirect mechanisms; we try them all in order.
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  };

  try {
    // 1. Try manual redirect to capture Location header
    const manualRes = await fetch(googleUrl, { headers, redirect: "manual", timeout: 10000 } as any);
    if (manualRes.status >= 300 && manualRes.status < 400) {
      const loc = manualRes.headers.get("location");
      if (loc && !isGoogleUrl(loc)) return loc;
    }

    // 2. Follow redirects automatically and check final URL
    const followRes = await fetch(googleUrl, { headers, redirect: "follow", timeout: 12000 } as any);
    const finalUrl = (followRes as any).url || googleUrl;
    if (!isGoogleUrl(finalUrl)) return finalUrl;

    // 3. Parse the Google News page HTML for canonical link or JS redirect
    const pageHtml = await followRes.text();

    const canonicalMatch = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(pageHtml);
    if (canonicalMatch && !isGoogleUrl(canonicalMatch[1])) return canonicalMatch[1];

    const jsRedirectMatch = /window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i.exec(pageHtml);
    if (jsRedirectMatch && !isGoogleUrl(jsRedirectMatch[1])) return jsRedirectMatch[1];

    return "";
  } catch {
    return "";
  }
}

// Extract structured article content from JSON-LD (many major news sites include this)
function extractJsonLdContent(html: string): string {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const raw = match[1].trim();
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const type = item["@type"];
        if (type === "NewsArticle" || type === "Article" || type === "ReportageNewsArticle" || type === "SportsNewsArticle") {
          const body = item.articleBody || item.description || "";
          if (body && body.length > 200) return body;
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  }
  return "";
}

// Returns true if a URL belongs to any Google domain
function isGoogleUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return /(?:^|\.)google\.com$|(?:^|\.)news\.google\.com$|(?:^|\.)googleapis\.com$/.test(hostname);
  } catch {
    return false;
  }
}

// Helper function to fetch full article content from URL
// Returns content text, OG image URL, and final URL after redirects
async function fetchArticleData(url: string): Promise<{ content: string; image: string | null; finalUrl: string }> {
  const empty = { content: "", image: null, finalUrl: url };
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8,es;q=0.7",
        "Cache-Control": "no-cache",
      },
      timeout: 20000,
      redirect: "follow",
    } as any);

    if (!response.ok) {
      console.warn(`Failed to fetch article from ${url}: ${response.status}`);
      return empty;
    }

    const finalUrl = (response as any).url || url;

    // If we ended up on a Google page (e.g. failed redirect), bail out immediately
    if (isGoogleUrl(finalUrl)) {
      console.warn(`fetchArticleData: resolved to Google domain, skipping: ${finalUrl}`);
      return empty;
    }

    const html = await response.text();

    // Extract OG image only from the real article page (never from Google)
    const image = extractOgImage(html);

    // ── Strategy 1: JSON-LD structured data ─────────────────────────────────
    // Many major news sites (ESPN, BBC, Marca, AS, etc.) embed the full article
    // body in JSON-LD. This is the most reliable source when available.
    const jsonLdContent = extractJsonLdContent(html);
    if (jsonLdContent && jsonLdContent.length > 200) {
      return { content: jsonLdContent, image, finalUrl };
    }

    // ── Strategy 2: HTML content extraction ─────────────────────────────────
    let cleaned = cleanArticleContent(html);

    // Try content containers from most to least specific
    const containerPatterns = [
      // Semantic
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      // Common CMS class names
      /<div[^>]*class="[^"]*(?:article-body|article-content|article-text|article__body|article__content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*(?:entry-content|post-content|post-body|story-body|story-content|story__body|story__text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*(?:news-body|news-content|news-article|article-main|article-detail)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*(?:content-body|content-text|main-content|page-content|wysiwyg)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*(?:noticia|cuerpo|cuerpo-noticia|texto-noticia)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*(?:article|content|body|story|noticia)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      // Broader fallbacks
      /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];

    let contentHtml = "";
    for (const pattern of containerPatterns) {
      const m = cleaned.match(pattern);
      if (m && m[1] && m[1].length > 300) {
        contentHtml = m[1];
        break;
      }
    }
    if (!contentHtml) contentHtml = cleaned;

    // Extract paragraphs
    const textBlocks: string[] = [];
    const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let paraMatch;
    while ((paraMatch = paraRegex.exec(contentHtml)) !== null) {
      let paraText = stripHtmlTags(paraMatch[1]).trim();

      if (paraText.length < 30) continue;
      if (isMetaParagraph(paraText)) continue;

      // Remove inline agency/photo attributions
      paraText = paraText
        .replace(/\s+(MUNDO\s+DEPORTIVO|GETTY\s+IMAGES?|GETTY|AFP|REUTERS|EL\s+PAÍS|AS\.COM|MARCA|BBC|ESPN|SPORT\.ES|PERIODISTA|REDACTOR)\s+([A-Z][a-z]+[\w\s]*:\s*)?/gi, " ")
        .trim();

      if (paraText.length < 30) continue;

      // Skip all-caps short strings (section labels)
      if (/^[A-ZÁÉÍÓÚÑ\s]{3,}$/.test(paraText) && paraText.length < 60) continue;

      textBlocks.push(paraText);
    }

    const finalContent = textBlocks.join("\n\n");

    return {
      content: finalContent.length > 200 ? finalContent : "",
      image,
      finalUrl,
    };
  } catch (err) {
    console.error(`Error fetching article data from ${url}:`, err);
    return empty;
  }
}

// Keep backward-compat alias that only returns content
async function fetchFullArticleContent(url: string): Promise<string> {
  const { content } = await fetchArticleData(url);
  return content;
}

// Helper function to fetch RSS feed
async function fetchRssFeed(feedUrl: string): Promise<any[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    if (!response.ok) {
      console.warn(`RSS Feed returned ${response.status} for ${feedUrl}`);
      return [];
    }

    const text = await response.text();
    const articles: any[] = [];

    // Simple RSS parser (extract title, description, link, pubDate)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];

      const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemContent);
      // Handle both regular description and CDATA description
      let descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(itemContent);
      if (!descMatch) {
        descMatch = /<description>([\s\S]*?)<\/description>/.exec(itemContent);
      }
      const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemContent);
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemContent);
      const imageMatch = /<image.*?url>([\s\S]*?)<\/url>/.exec(itemContent);

      // Google News RSS provides the actual source site via <source url="...">Name</source>
      const sourceTagMatch = /<source\s+url=["']([^"']+)["'][^>]*>([\s\S]*?)<\/source>/i.exec(itemContent);
      const sourceUrl = sourceTagMatch ? sourceTagMatch[1].trim() : "";
      const sourceNameFromTag = sourceTagMatch ? stripHtmlTags(sourceTagMatch[2]).trim() : "";

      // Google News RSS description contains the real article URL in the first <a href="..."> link
      const rawDesc = descMatch ? descMatch[1] : "";
      const firstHrefMatch = /href=["']([^"']+)["']/.exec(rawDesc);
      const articleUrlFromDesc = firstHrefMatch ? firstHrefMatch[1] : "";

      // Google News appends " - SourceName" to titles. Strip it.
      let rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";
      // Remove trailing " - Source" pattern (e.g. "Real Madrid vence - Marca")
      rawTitle = rawTitle.replace(/\s*-\s*[^-]{2,40}$/, "").trim();

      if (rawTitle && linkMatch) {
        const cleanTitle = decodeHtmlEntities(rawTitle);
        const cleanDesc = stripHtmlTags(rawDesc).trim();

        // Prefer real article URL from description; fall back to Google News redirect link
        const articleUrl = articleUrlFromDesc && articleUrlFromDesc.startsWith("http") && !articleUrlFromDesc.includes("news.google.com")
          ? articleUrlFromDesc
          : linkMatch[1].trim();

        articles.push({
          title: cleanTitle,
          description: cleanDesc,
          link: linkMatch[1].trim(),   // original Google News redirect (for reference)
          articleUrl,                   // real article URL to fetch content from
          pubDate: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          image: imageMatch ? imageMatch[1] : null,
          sourceUrl,
          sourceName: sourceNameFromTag,
        });
      }
    }

    return articles;
  } catch (err) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, err);
    return [];
  }
}

router.get("/scraper/sources", async (_req, res): Promise<void> => {
  res.json(NEWS_SOURCES);
});

// Search news via Google News RSS and translate results
router.post("/scraper/search", async (req, res): Promise<void> => {
  const { query, maxResults = 5 } = req.body;

  if (!query || typeof query !== "string" || !query.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  try {
    const encoded = encodeURIComponent(query.trim() + " futebol");
    const feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt`;

    const rawArticles = await fetchRssFeed(feedUrl);

    if (rawArticles.length === 0) {
      res.json({ articles: [], total: 0, query });
      return;
    }

    const articles = await Promise.all(
      rawArticles.slice(0, maxResults).map(async (article: any) => {
        const cleanDescription = article.description || "";

        // Use the real article URL extracted from the RSS description; fall back to the
        // Google News redirect link (fetchArticleData will follow it and reject Google pages).
        const fetchUrl = article.articleUrl || article.link || "";
        if (!fetchUrl) return null;

        // Fetch full content and OG image from the real article page.
        // fetchArticleData follows redirects and discards any result that ends up on a Google domain.
        const articleData = await fetchArticleData(fetchUrl);
        const rawContent = articleData.content || cleanDescription;

        if (!rawContent || rawContent.length < 60) {
          return null;
        }

        // Source name: always use the one from RSS <source> tag (it's the actual publication)
        // Fall back to extracting from the actual article URL
        let sourceName = article.sourceName || "";
        if (!sourceName && fetchUrl) {
          try {
            const hostname = new URL(fetchUrl).hostname.replace("www.", "");
            const domainPart = hostname.split(".")[0];
            sourceName = domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
          } catch {
            sourceName = "Desconhecido";
          }
        }

        // Detect language from the real article URL
        const isSpanish = /marca|as\.com|sport\.es|mundodeportivo|abc\.es|elmundo|lavanguardia|espn\.es|diario/i.test(fetchUrl);
        const isPortuguese = /record\.pt|zerozero|maisfutebol|ojogo|abola|globoesporte|uol\.com|ge\.globo/i.test(fetchUrl);
        const sourceLanguage = isPortuguese ? "pt" : isSpanish ? "es" : "en";

        // Don't re-translate Portuguese articles, just generate subtitle
        let translated;
        if (sourceLanguage === "pt") {
          const subtitle = await generateSubtitle(article.title, rawContent);
          translated = {
            title: article.title,
            content: rawContent,
            excerpt: generateExcerpt(rawContent),
            subtitle,
          };
        } else {
          translated = await translateArticle(article.title, rawContent, sourceName, sourceLanguage);
        }

        return {
          title: translated.title,
          subtitle: translated.subtitle,
          excerpt: translated.excerpt,
          content: translated.content,
          coverImage: articleData.image || null,
          originalUrl: fetchUrl,
          sourceName,
          sourceLanguage,
          publishedAt: article.pubDate || new Date().toISOString(),
        };
      })
    );

    const validArticles = articles.filter(Boolean);

    res.json({ articles: validArticles, total: validArticles.length, query });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to search articles" });
  }
});

// Fetch articles from all sources, translate to PT-BR, and return as a unified timeline
router.post("/scraper/fetch-all", async (req, res): Promise<void> => {
  // Cap at 3 per source to keep parallel translation fast
  const maxPerSource = 3;

  try {
    const allArticles: any[] = [];

    // Load active sources from DB (fall back to hardcoded list if DB is empty)
    let dbSources = await db.select().from(newsSourcesTable)
      .where(eq(newsSourcesTable.active, true))
      .orderBy(asc(newsSourcesTable.sortOrder));

    if (dbSources.length === 0) {
      dbSources = NEWS_SOURCES.filter(s => s.active).map((s, i) => ({
        id: i + 1,
        name: s.name,
        url: s.url,
        rssFeed: (s as any).rssFeed || null,
        language: s.language,
        active: s.active,
        type: s.type,
        sortOrder: i + 1,
        createdAt: new Date(),
      }));
    }

    // Fetch from all active RSS sources in parallel
    const fetchPromises = dbSources
      .filter(s => s.type === "rss" && s.rssFeed)
      .map(async (source) => {
        try {
          const rawArticles = await fetchRssFeed(source.rssFeed!);

          // Process + translate each article fully in parallel
          return Promise.all(
            rawArticles.slice(0, maxPerSource).map(async (article: any) => {
              const cleanTitle = stripHtmlTags(article.title || "");
              const cleanDescription = stripHtmlTags(article.description || "");

              // Fetch full content, OG image and final URL from the article
              const articleData = await fetchArticleData(article.link || "");
              const rawContent = articleData.content || cleanDescription;

              // Translate to Brazilian Portuguese
              const translated = await translateArticle(cleanTitle, rawContent, source.name, source.language);

              return {
                title: translated.title,
                subtitle: translated.subtitle,
                excerpt: translated.excerpt,
                content: translated.content,
                coverImage: articleData.image || article.image || null,
                originalUrl: articleData.finalUrl || article.link || "",
                sourceName: source.name,
                sourceLanguage: source.language,
                publishedAt: article.pubDate || new Date().toISOString(),
              };
            })
          );
        } catch (err) {
          console.error(`Error fetching from ${source.name}:`, err);
          return [];
        }
      });

    const results = await Promise.all(fetchPromises);
    results.forEach(articles => allArticles.push(...articles));

    // Sort by date descending
    allArticles.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    res.json({
      articles: allArticles,
      total: allArticles.length,
    });
  } catch (err) {
    console.error("Error fetching all articles:", err);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

router.post("/scraper/fetch", async (req, res): Promise<void> => {
  const { sourceId, maxArticles = 10, autoImport = false } = req.body;

  if (!sourceId) {
    res.status(400).json({ error: "sourceId is required" });
    return;
  }

  const source = NEWS_SOURCES.find(s => s.id === sourceId);
  if (!source) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  let rawArticles: any[] = [];

  // Try to fetch from RSS feed first
  if (source.type === "rss" && source.rssFeed) {
    rawArticles = await fetchRssFeed(source.rssFeed);
  }

  // Return empty if no real articles found (no fallback to mock data)
  if (rawArticles.length === 0) {
    res.json({
      articles: [],
      imported: 0,
      total: 0,
      source: source.name,
    });
    return;
  }

  // Fetch full content for each article in parallel
  const articlesWithContent = await Promise.all(
    rawArticles.slice(0, maxArticles).map(async (article: any) => {
      // Try to fetch full content from the article URL
      const fullContent = await fetchFullArticleContent(article.link || "");
      
      return {
        title: article.title || "",
        subtitle: "",  // Subtitle will be generated later or on import
        excerpt: article.description || "",
        content: fullContent || article.description || "",  // Use full content if available, fallback to description
        originalUrl: article.link || "",
        sourceName: source.name,
        coverImage: article.image || null,
        publishedAt: article.pubDate || new Date().toISOString(),
      };
    })
  );

  res.json({
    articles: articlesWithContent,
    imported: 0,
    total: articlesWithContent.length,
    source: source.name,
  });
});

router.post("/scraper/translate", async (req, res): Promise<void> => {
  const { title, content, excerpt, sourceName, sourceLanguage = "es" } = req.body;

  if (!title || !content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }

  try {
    const langLabel = sourceLanguage === "en" ? "inglês" : "espanhol";
    const prompt = `Traduza e adapte a matéria abaixo do ${langLabel} para o português brasileiro. Fonte: ${sourceName || "desconhecida"}.

Retorne um JSON com as chaves: "title", "excerpt", "content".
- "title": título traduzido
- "excerpt": resumo de 2 frases (máximo 200 caracteres) em português
- "content": corpo completo da matéria traduzido

Título original: ${title}
Resumo original: ${excerpt || ""}
Conteúdo original: ${content}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let parsed: { title?: string; excerpt?: string; content?: string };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {};
    }

    const translatedTitle = parsed.title || title;
    const translatedContent = parsed.content || content;

    const subtitle = await generateSubtitle(translatedTitle, translatedContent);

    res.json({
      title: translatedTitle,
      excerpt: parsed.excerpt || excerpt || "",
      content: translatedContent,
      subtitle,
    });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Failed to translate article" });
  }
});

// Generate subtitle for an article
router.post("/scraper/generate-subtitle", async (req, res): Promise<void> => {
  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }

  try {
    const subtitle = await generateSubtitle(title, content);
    res.json({ subtitle });
  } catch (err) {
    console.error("Subtitle generation error:", err);
    res.status(500).json({ error: "Failed to generate subtitle" });
  }
});

export default router;
