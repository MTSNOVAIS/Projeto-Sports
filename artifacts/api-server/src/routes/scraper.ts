import { Router, type IRouter } from "express";
import { db, articlesTable } from "@workspace/db";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Comprehensive Spanish to Portuguese football translation dictionary
const translationDict: Record<string, string> = {
  // Teams
  "Real Madrid": "Real Madrid",
  "Barcelona": "Barcelona", 
  "Atlético Madrid": "Atlético Madrid",
  "Aston Villa": "Aston Villa",
  "Manchester": "Manchester",
  "Liverpool": "Liverpool",
  "Arsenal": "Arsenal",
  "Chelsea": "Chelsea",
  
  // Common verbs
  "ha vencido": "venceu",
  "han vencido": "venceram",
  "vencido": "vencido",
  "ganado": "ganhou",
  "ha ganado": "ganhou",
  "marcó": "marcou",
  "ha marcado": "marcou",
  "jugó": "jogou",
  "ha jugado": "jogou",
  "está jugando": "está jogando",
  "sigue": "segue",
  "continúa": "continua",
  "será": "será",
  "podría": "poderia",
  "puede": "pode",
  
  // Common nouns
  "equipo": "time",
  "equipos": "times",
  "el equipo": "o time",
  "los equipos": "os times",
  "la competición": "a competição",
  "competición": "competição",
  "partido": "partida",
  "partidos": "partidas",
  "los partidos": "as partidas",
  "gol": "gol",
  "goles": "gols",
  "los goles": "os gols",
  "victoria": "vitória",
  "victorias": "vitórias",
  "derrota": "derrota",
  "derrotas": "derrotas",
  "empate": "empate",
  "jugador": "jogador",
  "jugadores": "jogadores",
  "el jugador": "o jogador",
  "los jugadores": "os jogadores",
  "técnico": "técnico",
  "entrenador": "técnico",
  "portero": "goleiro",
  "porteros": "goleiros",
  "defensa": "zagueiro",
  "defensas": "zagueiros",
  "delantero": "atacante",
  "delanteros": "atacantes",
  "centrocampista": "meia",
  "centrocampistas": "meias",
  "árbitro": "árbitro",
  "árbitros": "árbitros",
  "entrenador": "técnico",
  "director técnico": "técnico",
  
  // Phases and tournaments
  "fase de grupos": "fase de grupos",
  "fase de liguilla": "fase de grupos",
  "eliminatoria": "mata-mata",
  "semifinal": "semifinal",
  "final": "final",
  "vuelta": "confronto de volta",
  "ida": "primeira mão",
  "primera mano": "primeira mão",
  "segunda mano": "segunda mão",
  
  // Leagues and competitions
  "liga": "liga",
  "La Liga": "La Liga",
  "Copa": "Copa",
  "Copa del Rey": "Copa do Rei",
  "Supercopa": "Supercopa",
  "Champions": "Champions",
  "Europa League": "Europa League",
  "europeo": "europeu",
  "nacional": "nacional",
  "internacional": "internacional",
  
  // Cards and fouls
  "tarjeta roja": "cartão vermelho",
  "tarjeta amarilla": "cartão amarelo",
  "roja": "vermelho",
  "amarilla": "amarelo",
  "penalti": "pênalti",
  "penal": "pênalti",
  "fuera de juego": "impedimento",
  
  // Actions
  "marcó": "marcou",
  "anotó": "marcou",
  "metiló gol": "marcou",
  "pateó": "chutou",
  "regatea": "dribleia",
  "pase": "passe",
  "ataque": "ataque",
  "defensa": "defesa",
  "tiro": "chute",
  "tiros": "chutes",
  
  // Locations
  "cancha": "campo",
  "campo": "campo",
  "estadio": "estádio",
  "villa": "villa",
  "Park": "Park",
  "francés": "francês",
  "francesa": "francesa",
  "inglés": "inglês",
  "inglesa": "inglesa",
  "español": "espanhol",
  "española": "espanhola",
  "brasileño": "brasileiro",
  "brasileña": "brasileira",
  
  // Numbers and ordinals
  "primero": "primeiro",
  "segunda": "segunda",
  "tercero": "terceiro",
  "1-0": "1-0",
  "2-0": "2-0",
  "0-1": "0-1",
  "0-2": "0-2",
  
  // Other
  "él": "ele",
  "ella": "ela",
  "ellos": "eles",
  "ellas": "elas",
  "su": "seu",
  "sus": "seus",
  "en": "em",
  "de": "de",
  "el": "o",
  "la": "a",
  "los": "os",
  "las": "as"
};

// Translate using local dictionary (no external API needed)
function translateText(text: string): string {
  if (!text) return text;
  
  let translated = text;
  
  // Apply translations from dictionary (case-insensitive)
  // Sort by length DESC to translate longer phrases first
  const entries = Object.entries(translationDict).sort((a, b) => b[0].length - a[0].length);
  
  for (const [spanish, portuguese] of entries) {
    // Create a regex that matches the word with proper escaping
    // Match whole words only (surrounded by spaces, punctuation, or start/end)
    const escaped = spanish.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b|\\b${escaped}(?=[.,!?;:])|(?<=[\\s(])${escaped}\\b`, 'gi');
    translated = translated.replace(regex, match => {
      // Preserve case pattern
      if (match[0] === match[0].toUpperCase() && spanish[0] === spanish[0].toLowerCase()) {
        return portuguese.charAt(0).toUpperCase() + portuguese.slice(1);
      }
      return portuguese;
    });
  }
  
  return translated;
}

// Generate AI subtitle for article
async function generateSubtitle(title: string, content: string): Promise<string> {
  if (!title || !content) return "";
  
  try {
    const prompt = `Given the following article title and content, generate a concise subtitle (10-15 words) that complements the title and captures the key aspect of the story. The subtitle should be engaging and informative without repeating the title.

Title: ${title}
Content: ${content.substring(0, 500)}

Respond with ONLY the subtitle text, no quotes or additional formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional sports journalist. Generate concise, engaging subtitles that complement article titles. Respond with only the subtitle text.",
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 50,
    });

    const subtitle = completion.choices[0]?.message?.content || "";
    return subtitle.trim().replace(/^["']|["']$/g, "");
  } catch (err) {
    console.error("Subtitle generation error:", err);
    return "";
  }
}

// Translate article to Brazilian Portuguese (currently keeping in Spanish, awaiting translation API)
async function translateArticle(title: string, content: string, sourceName: string, sourceLanguage: string = "es"): Promise<{ title: string; content: string; excerpt: string; subtitle: string }> {
  if (!title || !content) return { title, content, excerpt: "", subtitle: "" };
  
  try {
    // For now, keep in original language but ensure excerpt is generated
    // TODO: Implement translation once MyMemory API is available again
    const excerpt = generateExcerpt(content);
    const subtitle = await generateSubtitle(title, content);
    
    return {
      title,
      content,
      excerpt,
      subtitle
    };
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
    
    // If no container found, try to extract main paragraphs
    if (!content) {
      content = extractMainContent(cleaned);
    }
    
    // Extract paragraphs before cleaning HTML to preserve structure
    const rawParagraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    
    // Clean each paragraph individually to preserve structure
    const cleanedParagraphs = rawParagraphs
      .map(p => stripHtmlTags(p).trim())
      .filter(p => p.length > 40)  // Keep paragraphs with substantive content (>40 chars)
      .map(p => {
        // Further split very long paragraphs by sentence if needed
        if (p.length > 500) {
          return p
            .replace(/([.!?])\s+(?=[A-Z])/g, "$1\n")  // Split by sentences
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .join("\n");
        }
        return p;
      });
    
    // If no good paragraphs found, try to extract and clean all content
    let finalContent = cleanedParagraphs.length > 0 
      ? cleanedParagraphs.join("\n\n")
      : stripHtmlTags(content).trim();
    
    // Return content only if it's substantial (more than 300 chars for better quality)
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

// Fetch articles from all sources and return as a unified timeline
router.post("/scraper/fetch-all", async (req, res): Promise<void> => {
  const { maxArticles = 5 } = req.body;

  try {
    const allArticles: any[] = [];

    // Fetch from all active RSS sources in parallel
    const fetchPromises = NEWS_SOURCES
      .filter(s => s.type === "rss" && s.active)
      .map(async (source) => {
        try {
          const rawArticles = await fetchRssFeed(source.rssFeed!);
          
          // Process each article with full content fetching
          return Promise.all(
            rawArticles.slice(0, maxArticles).map(async (article: any) => {
              const cleanTitle = stripHtmlTags(article.title || "");
              const cleanDescription = stripHtmlTags(article.description || "");
              
              // Fetch full content from the article URL
              const fullContent = await fetchFullArticleContent(article.link || "");
              
              return {
                title: cleanTitle,
                subtitle: "",  // Will be generated on import
                excerpt: cleanDescription,
                content: fullContent || cleanDescription,  // Use full content if available
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

  if (!title || !content || !excerpt) {
    res.status(400).json({ error: "title, content, and excerpt are required" });
    return;
  }

  try {
    const isEnglish = sourceLanguage === "en";
    const prompt = isEnglish
      ? `Translate and adapt the following football article from English to Brazilian Portuguese. The article is from ${sourceName}. Adapt cultural references and football terminology to Brazilian context. Return a JSON with keys: title, excerpt, content.

Title: ${title}
Excerpt: ${excerpt}
Content: ${content}`
      : `Translate and adapt the following football article from Spanish to Brazilian Portuguese. The article is from ${sourceName || "source"}. Adapt cultural references and football terminology to Brazilian context. Return a JSON with keys: title, excerpt, content.

Title: ${title}
Excerpt: ${excerpt}
Content: ${content}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional sports journalist who translates football articles to Brazilian Portuguese. Always return valid JSON only, no markdown.",
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { title, excerpt, content };
    }

    // Generate subtitle for translated article
    const subtitle = await generateSubtitle(
      parsed.title || title,
      parsed.content || content
    );

    res.json({
      title: parsed.title || title,
      excerpt: parsed.excerpt || excerpt,
      content: parsed.content || content,
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
