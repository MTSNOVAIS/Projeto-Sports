import { Router, type IRouter } from "express";
import { db, articlesTable } from "@workspace/db";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

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
      const descMatch = /<description>([\s\S]*?)<\/description>/.exec(itemContent);
      const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemContent);
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemContent);
      const imageMatch = /<image.*?url>([\s\S]*?)<\/url>/.exec(itemContent);

      if (titleMatch && linkMatch) {
        articles.push({
          title: titleMatch[1].replace(/<[^>]*>/g, ""),
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, "").substring(0, 500) : "",
          link: linkMatch[1],
          pubDate: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          image: imageMatch ? imageMatch[1] : null,
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
          return rawArticles.slice(0, maxArticles).map((article: any) => ({
            title: article.title || "",
            excerpt: article.description || "",
            content: article.description || "",
            coverImage: article.image || null,
            originalUrl: article.link || "",
            sourceName: source.name,
            sourceLanguage: source.language,
            publishedAt: article.pubDate || new Date().toISOString(),
          }));
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

  const articles = rawArticles.slice(0, maxArticles).map((article: any) => ({
    title: article.title || "",
    excerpt: article.description || "",
    content: article.description || "",
    originalUrl: article.link || "",
    sourceName: source.name,
    coverImage: article.image || null,
    publishedAt: article.pubDate || new Date().toISOString(),
  }));

  res.json({
    articles: articles,
    imported: 0,
    total: articles.length,
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
      model: "gpt-5-mini",
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

    res.json({
      title: parsed.title || title,
      excerpt: parsed.excerpt || excerpt,
      content: parsed.content || content,
    });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Failed to translate article" });
  }
});

export default router;
