import { Router, type IRouter } from "express";
import { db, teamsTable, articlesTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";

const router: IRouter = Router();

async function getTeamsWithCount() {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.name);
  const counts = await db
    .select({ teamId: articlesTable.teamId, count: count() })
    .from(articlesTable)
    .groupBy(articlesTable.teamId);

  const countMap = new Map(counts.map(c => [c.teamId, Number(c.count)]));
  return teams.map(t => ({ ...t, articleCount: countMap.get(t.id) ?? 0 }));
}

router.get("/teams", async (_req, res): Promise<void> => {
  const teams = await getTeamsWithCount();
  res.json(teams);
});

router.get("/teams/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.slug, slug));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const recentArticles = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.teamId, team.id), eq(articlesTable.status, "published")))
    .orderBy(desc(articlesTable.publishedAt))
    .limit(10);

  const [articleCountResult] = await db
    .select({ count: count() })
    .from(articlesTable)
    .where(eq(articlesTable.teamId, team.id));

  res.json({
    ...team,
    articleCount: Number(articleCountResult?.count ?? 0),
    recentArticles: recentArticles.map(a => ({
      ...a,
      teamName: team.name,
      teamSlug: team.slug,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
});

// Admin team routes
router.get("/admin/teams", async (_req, res): Promise<void> => {
  const teams = await getTeamsWithCount();
  res.json(teams);
});

router.post("/admin/teams", async (req, res): Promise<void> => {
  const { name, slug, shortName, city, stadium, foundedYear, description, logoUrl, primaryColor, secondaryColor } = req.body;

  if (!name || !slug || !shortName || !city || !stadium) {
    res.status(400).json({ error: "name, slug, shortName, city, and stadium are required" });
    return;
  }

  const [team] = await db.insert(teamsTable).values({
    name,
    slug,
    shortName,
    city,
    stadium,
    foundedYear: foundedYear || null,
    description: description || null,
    logoUrl: logoUrl || null,
    primaryColor: primaryColor || "#DB0037",
    secondaryColor: secondaryColor || "#FFFFFF",
  }).returning();

  res.status(201).json({ ...team, articleCount: 0 });
});

router.put("/admin/teams/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { name, slug, shortName, city, stadium, foundedYear, description, logoUrl, primaryColor, secondaryColor } = req.body;

  const [team] = await db
    .update(teamsTable)
    .set({
      name,
      slug,
      shortName,
      city,
      stadium,
      foundedYear: foundedYear || null,
      description: description || null,
      logoUrl: logoUrl || null,
      primaryColor: primaryColor || "#DB0037",
      secondaryColor: secondaryColor || "#FFFFFF",
    })
    .where(eq(teamsTable.id, id))
    .returning();

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const [articleCountResult] = await db
    .select({ count: count() })
    .from(articlesTable)
    .where(eq(articlesTable.teamId, id));

  res.json({ ...team, articleCount: Number(articleCountResult?.count ?? 0) });
});

export default router;
