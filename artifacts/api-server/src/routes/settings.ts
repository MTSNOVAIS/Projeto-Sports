import { Router, type IRouter } from "express";
import { db, newsSourcesTable, importTopicsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_SOURCES = [
  { name: "Marca", url: "https://www.marca.com", rssFeed: "https://www.marca.com/rss/futbol.xml", language: "es", active: true, type: "rss", sortOrder: 1 },
  { name: "AS", url: "https://as.com", rssFeed: "https://as.com/rss/futbol.xml", language: "es", active: true, type: "rss", sortOrder: 2 },
  { name: "ESPN", url: "https://www.espn.com", rssFeed: "https://feeds.espn.com/feeds/site/espn/global/en/news", language: "en", active: true, type: "rss", sortOrder: 3 },
  { name: "BBC Sport", url: "https://www.bbc.com/sport", rssFeed: "https://feeds.bbc.co.uk/sport/football/rss.xml", language: "en", active: true, type: "rss", sortOrder: 4 },
  { name: "Sport", url: "https://www.sport.es", rssFeed: "https://www.sport.es/rss/futbol.xml", language: "es", active: true, type: "rss", sortOrder: 5 },
  { name: "Mundo Deportivo", url: "https://www.mundodeportivo.com", rssFeed: "https://www.mundodeportivo.com/rss/futbol.xml", language: "es", active: true, type: "rss", sortOrder: 6 },
];

const DEFAULT_TOPICS = [
  { label: "La Liga", query: "La Liga", active: true, sortOrder: 1 },
  { label: "Real Madrid", query: "Real Madrid", active: true, sortOrder: 2 },
  { label: "Barcelona", query: "FC Barcelona", active: true, sortOrder: 3 },
  { label: "Atlético Madrid", query: "Atlético de Madrid", active: true, sortOrder: 4 },
  { label: "Sevilla", query: "Sevilla FC", active: true, sortOrder: 5 },
  { label: "Athletic Club", query: "Athletic Club Bilbao", active: true, sortOrder: 6 },
  { label: "Real Sociedad", query: "Real Sociedad", active: true, sortOrder: 7 },
  { label: "Valencia", query: "Valencia CF", active: true, sortOrder: 8 },
  { label: "Villarreal", query: "Villarreal CF", active: true, sortOrder: 9 },
  { label: "Real Betis", query: "Real Betis", active: true, sortOrder: 10 },
  { label: "Osasuna", query: "Osasuna", active: true, sortOrder: 11 },
  { label: "Girona", query: "Girona FC", active: true, sortOrder: 12 },
];

async function seedSourcesIfEmpty() {
  const existing = await db.select().from(newsSourcesTable).limit(1);
  if (existing.length === 0) {
    await db.insert(newsSourcesTable).values(DEFAULT_SOURCES);
  }
}

async function seedTopicsIfEmpty() {
  const existing = await db.select().from(importTopicsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(importTopicsTable).values(DEFAULT_TOPICS);
  }
}

// ── News Sources ──────────────────────────────────────────────────────────────

router.get("/settings/sources", async (_req, res): Promise<void> => {
  try {
    await seedSourcesIfEmpty();
    const sources = await db.select().from(newsSourcesTable).orderBy(asc(newsSourcesTable.sortOrder));
    res.json(sources);
  } catch (err) {
    console.error("Error fetching sources:", err);
    res.status(500).json({ error: "Failed to fetch sources" });
  }
});

router.post("/settings/sources", async (req, res): Promise<void> => {
  const { name, url, rssFeed, language = "en", type = "rss" } = req.body;
  if (!name || !url) {
    res.status(400).json({ error: "name and url are required" });
    return;
  }
  try {
    const maxOrder = await db.select().from(newsSourcesTable);
    const sortOrder = maxOrder.length > 0 ? Math.max(...maxOrder.map(s => s.sortOrder)) + 1 : 1;
    const [source] = await db.insert(newsSourcesTable).values({ name, url, rssFeed: rssFeed || null, language, active: true, type, sortOrder }).returning();
    res.json(source);
  } catch (err) {
    console.error("Error creating source:", err);
    res.status(500).json({ error: "Failed to create source" });
  }
});

router.patch("/settings/sources/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [source] = await db.update(newsSourcesTable).set(req.body).where(eq(newsSourcesTable.id, id)).returning();
    if (!source) { res.status(404).json({ error: "Source not found" }); return; }
    res.json(source);
  } catch (err) {
    console.error("Error updating source:", err);
    res.status(500).json({ error: "Failed to update source" });
  }
});

router.delete("/settings/sources/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(newsSourcesTable).where(eq(newsSourcesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting source:", err);
    res.status(500).json({ error: "Failed to delete source" });
  }
});

// ── Import Topics ─────────────────────────────────────────────────────────────

router.get("/settings/topics", async (_req, res): Promise<void> => {
  try {
    await seedTopicsIfEmpty();
    const topics = await db.select().from(importTopicsTable).orderBy(asc(importTopicsTable.sortOrder));
    res.json(topics);
  } catch (err) {
    console.error("Error fetching topics:", err);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

router.post("/settings/topics", async (req, res): Promise<void> => {
  const { label, query } = req.body;
  if (!label || !query) {
    res.status(400).json({ error: "label and query are required" });
    return;
  }
  try {
    const existing = await db.select().from(importTopicsTable);
    const sortOrder = existing.length > 0 ? Math.max(...existing.map(t => t.sortOrder)) + 1 : 1;
    const [topic] = await db.insert(importTopicsTable).values({ label, query, active: true, sortOrder }).returning();
    res.json(topic);
  } catch (err) {
    console.error("Error creating topic:", err);
    res.status(500).json({ error: "Failed to create topic" });
  }
});

router.patch("/settings/topics/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [topic] = await db.update(importTopicsTable).set(req.body).where(eq(importTopicsTable.id, id)).returning();
    if (!topic) { res.status(404).json({ error: "Topic not found" }); return; }
    res.json(topic);
  } catch (err) {
    console.error("Error updating topic:", err);
    res.status(500).json({ error: "Failed to update topic" });
  }
});

router.delete("/settings/topics/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(importTopicsTable).where(eq(importTopicsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting topic:", err);
    res.status(500).json({ error: "Failed to delete topic" });
  }
});

export default router;
