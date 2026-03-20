import { Router, type IRouter } from "express";
import { db, articlesTable } from "@workspace/db";
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
    /^[a-z\s\-\.\/]*$/,  // All lowercase (likely author/source info)
    /por\s+[a-z\s]+/i,   // "por" (author info)
    /foto\s*:\s*/i,      // Photo credit
    /\s*\/\s*propias/i,  // " / Propias" (image source)
    /periodista|redactor|colaborador|escrito|reportaje/i, // Author descriptions
    /actualizado\s+el|updated|last\s+modified/i,          // Update timestamps
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/,                     // Dates
    /\d{1,2}:\d{2}\s*(cet|gmt|utc|h|am|pm)/i,            // Times
    /ultima\s+actualizacion|updated|share|compartir|tags|comments|comentarios/i, // Update notes
    /mundo deportivo|getty|reuters|afp|el país|as\.com/i, // Source attributions mixed in
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

// Helper function to fetch full article content from URL
async function fetchFullArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 15000,
    });

    if (!response.ok) {
      console.warn(`Failed to fetch article from ${url}: ${response.status}`);
      return "";
    }

    const html = await response.text();
    
    // First, remove unnecessary sections
    let cleaned = cleanArticleContent(html);
    
    // Look for common article content containers
    let content = "";
    
    // Try to find content in common article tags/classes
    const patterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        content = match[1];
        break;
      }
    }
    
    // If no container found, use entire cleaned content
    if (!content) {
      content = cleaned;
    }
    
    // Extract ALL paragraphs before any HTML stripping
    const rawParagraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    
    // Process each paragraph: clean HTML and filter
    const cleanedParagraphs: string[] = [];
    
    for (const rawPara of rawParagraphs) {
      // Strip HTML from this paragraph
      let paraText = stripHtmlTags(rawPara).trim();
      
      // Skip empty paragraphs
      if (paraText.length < 40) continue;
      
      // Skip meta-information paragraphs
      if (isMetaParagraph(paraText)) continue;
      
      // Remove source attributions and promotional headers that interrupt content
      // Match patterns like " MUNDO DEPORTIVO Palabra...: " or " REUTERS Title...: "
      paraText = paraText
        .replace(/\s+(MUNDO\s+DEPORTIVO|GETTY\s+IMAGES?|GETTY|AFP|REUTERS|EL\s+PAÍS|AS\.COM|MARCA|BBC|ESPN|SPORT\.ES|PERIODISTA|REDACTOR)\s+([A-Z][a-z]+[\w\s]*:\s*)?/gi, " ")
        .trim();
      
      // Skip paragraphs that look like section headers
      const isProbablyHeader = /^[A-Z\s]{3,}$/.test(paraText) && paraText.length < 60;
      if (isProbablyHeader) continue;
      
      // Split very long paragraphs by sentence for readability
      if (paraText.length > 500) {
        const sentences = paraText
          .split(/(?<=[.!?])\s+(?=[A-Z])/);
        if (sentences.length > 1) {
          paraText = sentences.join("\n");
        }
      }
      
      cleanedParagraphs.push(paraText);
    }
    
    // Join paragraphs with double newlines
    const finalContent = cleanedParagraphs.join("\n\n");
    
    // Return content only if substantial (more than 300 chars)
    return finalContent.length > 300 ? finalContent : "";
  } catch (err) {
    console.error(`Error fetching full article from ${url}:`, err);
    return "";
  }
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

      if (titleMatch && linkMatch) {
        // Clean title and description - remove HTML tags and decode entities
        const cleanTitle = decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, "").trim());
        // Get full description without cutting it
        const rawDesc = descMatch ? descMatch[1] : "";
        const cleanDesc = stripHtmlTags(rawDesc).trim();
        
        // Only add if we have meaningful content
        if (cleanTitle && cleanDesc) {
          articles.push({
            title: cleanTitle,
            description: cleanDesc,  // Keep full description, truncate in the endpoint
            link: linkMatch[1].trim(),
            pubDate: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
            image: imageMatch ? imageMatch[1] : null,
          });
        }
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

// Fetch articles from all sources, translate to PT-BR, and return as a unified timeline
router.post("/scraper/fetch-all", async (req, res): Promise<void> => {
  // Cap at 3 per source to keep parallel translation fast
  const maxPerSource = 3;

  try {
    const allArticles: any[] = [];

    // Fetch from all active RSS sources in parallel
    const fetchPromises = NEWS_SOURCES
      .filter(s => s.type === "rss" && s.active)
      .map(async (source) => {
        try {
          const rawArticles = await fetchRssFeed(source.rssFeed!);

          // Process + translate each article fully in parallel
          return Promise.all(
            rawArticles.slice(0, maxPerSource).map(async (article: any) => {
              const cleanTitle = stripHtmlTags(article.title || "");
              const cleanDescription = stripHtmlTags(article.description || "");

              // Fetch full content from the article URL
              const fullContent = await fetchFullArticleContent(article.link || "");
              const rawContent = fullContent || cleanDescription;

              // Translate to Brazilian Portuguese
              const translated = await translateArticle(cleanTitle, rawContent, source.name, source.language);

              return {
                title: translated.title,
                subtitle: translated.subtitle,
                excerpt: translated.excerpt,
                content: translated.content,
                coverImage: article.image || null,
                originalUrl: article.link || "",
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
