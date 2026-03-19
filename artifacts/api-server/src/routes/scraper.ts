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
  },
  {
    id: "as",
    name: "AS",
    url: "https://as.com",
    language: "es",
    description: "Diário esportivo espanhol com foco em futebol",
    active: true,
  },
  {
    id: "the-athletic",
    name: "The Athletic",
    url: "https://theathletic.com",
    language: "en",
    description: "Jornalismo esportivo premium em inglês",
    active: true,
  },
  {
    id: "sport",
    name: "Sport",
    url: "https://www.sport.es",
    language: "es",
    description: "Jornal esportivo barcelonista",
    active: true,
  },
  {
    id: "mundo-deportivo",
    name: "Mundo Deportivo",
    url: "https://www.mundodeportivo.com",
    language: "es",
    description: "Jornal esportivo com foco no Barcelona",
    active: true,
  },
];

// Mock articles per source for demonstration
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
    {
      originalTitle: "Atletico de Madrid cierra el fichaje de un centrocampista italiano",
      originalContent: "El Atletico de Madrid ha cerrado el fichaje de un prometedor centrocampista italiano procedente de la Serie A. El jugador, que llega por 45 millones de euros, ha firmado un contrato de cinco años con el club rojiblanco. Simeone habría pedido expresamente este refuerzo para el mediocampo, una zona que el Cholo considera prioritaria para mantener la competitividad del equipo en LaLiga y en Europa.",
      originalExcerpt: "El conjunto rojiblanco refuerza su mediocampo con un jugador procedente de la Serie A italiana.",
      originalUrl: "https://www.marca.com/futbol/atletico/2024/01/fichaje-centrocampista",
      coverImage: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800",
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
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
    {
      originalTitle: "El Sevilla anuncia nuevo entrenador tras la destitución de su técnico",
      originalContent: "El Sevilla FC ha anunciado la contratación de un nuevo entrenador tras la destitución del anterior técnico. El nuevo entrenador llega procedente de una liga extranjera y tiene experiencia en competiciones europeas. La directiva del Sevilla confía en que el nuevo técnico pueda enderezar la situación del equipo en LaLiga, donde atraviesa una de sus peores rachas de los últimos años.",
      originalExcerpt: "El club hispalense busca enderezar su situación en LaLiga con un nuevo técnico de perfil europeo.",
      originalUrl: "https://as.com/futbol/sevilla-nuevo-entrenador",
      coverImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "the-athletic": [
    {
      originalTitle: "Analysis: How Real Madrid's pressing system is revolutionizing La Liga",
      originalContent: "Real Madrid's tactical revolution under their current setup has transformed not just their own performances but the entire competitive landscape of La Liga. The high-intensity pressing system that has been gradually implemented over the past two seasons is now bearing significant fruit, as evidenced by their commanding position in the league table. What makes this particularly fascinating is how seamlessly the older generation of players has adapted to new demands, while the younger talents have thrived in this more dynamic environment. The data tells a compelling story: Real Madrid are pressing higher up the pitch than at any point in the last decade, recovering the ball in dangerous positions with remarkable regularity.",
      originalExcerpt: "A tactical deep dive into how Los Blancos are dominating Spanish football with a revolutionary pressing system.",
      originalUrl: "https://theathletic.com/analysis-real-madrid-pressing-system",
      coverImage: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      originalTitle: "Barcelona's financial recovery: A year-on from crisis, where do they stand?",
      originalContent: "One year on from one of the most turbulent periods in Barcelona's recent history, the Catalan giants appear to be gradually finding their footing again. The 'economic levers' pulled by president Joan Laporta have had mixed results, generating immediate cash but also creating long-term financial obligations that the club must now manage carefully. On the pitch, the signs are more encouraging, with a blend of experienced international signings and homegrown talent creating a team that has genuine Champions League aspirations for the first time in several seasons.",
      originalExcerpt: "Barcelona have stabilized their finances but face ongoing challenges as they attempt to rebuild their sporting dominance.",
      originalUrl: "https://theathletic.com/barcelona-financial-recovery",
      coverImage: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800",
      publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    },
  ],
  sport: [
    {
      originalTitle: "Lewandowski marca hat-trick y lleva al Barcelona al liderato",
      originalContent: "Robert Lewandowski firmó un hat-trick de ensueño para llevar al FC Barcelona al liderato provisional de LaLiga. El delantero polaco mostró una vez más su olfato goleador en un partido crucial para las aspiraciones ligueras del equipo azulgrana. Con este triplete, Lewandowski se consolida como el máximo goleador del campeonato y demuestra que, a pesar de su edad, sigue siendo uno de los mejores delanteros del mundo. El Barça necesitaba este triunfo tras los tropiezos de semanas anteriores.",
      originalExcerpt: "El ariete polaco brilló con tres goles para impulsar a los azulgranas a lo alto de la clasificación.",
      originalUrl: "https://www.sport.es/futbol/barcelona/lewandowski-hat-trick",
      coverImage: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=800",
      publishedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "mundo-deportivo": [
    {
      originalTitle: "Xavi revela su filosofía de juego y los planes del Barça para la próxima temporada",
      originalContent: "Xavi Hernández ofreció una extensa rueda de prensa en la que desveló sus planes para la próxima temporada. El técnico catalán explicó su visión filosófica del fútbol y cómo pretende implementarla en el equipo azulgrana. Xavi destacó la importancia de la cantera y del estilo de juego heredado del Johann Cruyff, asegurando que el Barça debe recuperar su identidad futbolística. También habló sobre los refuerzos necesarios y las áreas que necesitan mejora.",
      originalExcerpt: "El técnico azulgrana desvela su hoja de ruta para devolver al club su identidad y competitividad.",
      originalUrl: "https://www.mundodeportivo.com/futbol/barcelona/xavi-filosofia-planes",
      coverImage: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800",
      publishedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

router.get("/scraper/sources", async (_req, res): Promise<void> => {
  res.json(NEWS_SOURCES);
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

  const rawArticles = MOCK_ARTICLES[sourceId] || [];
  const articlesToProcess = rawArticles.slice(0, maxArticles);

  const translatedArticles = await Promise.all(
    articlesToProcess.map(async (raw) => {
      try {
        const isEnglish = source.language === "en";
        const prompt = isEnglish
          ? `Translate and adapt the following football article from English to Brazilian Portuguese. The article is from ${source.name}. Adapt cultural references and football terminology to Brazilian context. Return a JSON with keys: title, excerpt, content.

Title: ${raw.originalTitle}
Excerpt: ${raw.originalExcerpt}
Content: ${raw.originalContent}`
          : `Translate and adapt the following football article from Spanish to Brazilian Portuguese. The article is from ${source.name}. Adapt cultural references and football terminology to Brazilian context. Return a JSON with keys: title, excerpt, content.

Title: ${raw.originalTitle}
Excerpt: ${raw.originalExcerpt}
Content: ${raw.originalContent}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional sports journalist who translates football articles to Brazilian Portuguese. Always return valid JSON only, no markdown.",
            },
            { role: "user", content: prompt },
          ],
          max_completion_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message?.content || "{}";
        let parsed;
        try {
          parsed = JSON.parse(responseText);
        } catch {
          parsed = { title: raw.originalTitle, excerpt: raw.originalExcerpt, content: raw.originalContent };
        }

        const article = {
          title: parsed.title || raw.originalTitle,
          originalTitle: raw.originalTitle,
          excerpt: parsed.excerpt || raw.originalExcerpt,
          content: (parsed.content || raw.originalContent) + `\n\n---\n*Este artigo foi publicado originalmente em ${source.name}. Traduzido e adaptado pela La Liga Brasil.*`,
          originalUrl: raw.originalUrl,
          sourceName: source.name,
          coverImage: raw.coverImage,
          publishedAt: raw.publishedAt,
          imported: false,
        };

        if (autoImport) {
          await db.insert(articlesTable).values({
            title: article.title,
            slug: article.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") + "-" + Date.now().toString(36),
            excerpt: article.excerpt,
            content: article.content,
            status: "draft",
            featured: false,
            breakingNews: false,
            category: "Internacional",
            authorName: `Via ${source.name}`,
            sourceUrl: article.originalUrl,
            sourceName: source.name,
            publishedAt: null,
          }).onConflictDoNothing();

          return { ...article, imported: true };
        }

        return article;
      } catch (err) {
        console.error("Translation error:", err);
        return {
          title: raw.originalTitle,
          originalTitle: raw.originalTitle,
          excerpt: raw.originalExcerpt,
          content: raw.originalContent,
          originalUrl: raw.originalUrl,
          sourceName: source.name,
          coverImage: raw.coverImage,
          publishedAt: raw.publishedAt,
          imported: false,
        };
      }
    })
  );

  res.json({
    articles: translatedArticles,
    imported: translatedArticles.filter(a => a.imported).length,
    total: translatedArticles.length,
  });
});

router.post("/scraper/translate", async (req, res): Promise<void> => {
  const { title, content, excerpt, sourceName, sourceLanguage = "es" } = req.body;

  if (!title || !content || !excerpt) {
    res.status(400).json({ error: "title, content, and excerpt are required" });
    return;
  }

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
    content: (parsed.content || content) + (sourceName ? `\n\n---\n*Este artigo foi publicado originalmente em ${sourceName}. Traduzido e adaptado pela La Liga Brasil.*` : ""),
  });
});

export default router;
