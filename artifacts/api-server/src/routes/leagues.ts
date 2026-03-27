import { Router, type IRouter } from "express";
import { db, leaguesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leagues", async (_req, res): Promise<void> => {
  try {
    const leagues = await db.select().from(leaguesTable).orderBy(asc(leaguesTable.name));
    res.json(leagues);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/admin/leagues", async (_req, res): Promise<void> => {
  try {
    const leagues = await db.select().from(leaguesTable).orderBy(asc(leaguesTable.name));
    res.json(leagues);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/admin/leagues/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [league] = await db.select().from(leaguesTable).where(eq(leaguesTable.id, id));
    if (!league) { res.status(404).json({ error: "League not found" }); return; }
    res.json(league);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/admin/leagues", async (req, res): Promise<void> => {
  try {
    const { name, slug, country, logoUrl, sofascoreId, currentSeasonId } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: "name and slug are required" });
      return;
    }
    const [created] = await db.insert(leaguesTable).values({
      name,
      slug,
      country: country || "",
      logoUrl: logoUrl || null,
      sofascoreId: sofascoreId ? Number(sofascoreId) : null,
      currentSeasonId: currentSeasonId ? Number(currentSeasonId) : null,
    }).returning();
    res.status(201).json(created);
  } catch (e: any) {
    if (e.code === "23505") {
      res.status(409).json({ error: "Slug already exists" });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

router.put("/admin/leagues/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, slug, country, logoUrl, sofascoreId, currentSeasonId } = req.body;
    const [updated] = await db.update(leaguesTable).set({
      name,
      slug,
      country: country || "",
      logoUrl: logoUrl || null,
      sofascoreId: sofascoreId ? Number(sofascoreId) : null,
      currentSeasonId: currentSeasonId ? Number(currentSeasonId) : null,
    }).where(eq(leaguesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "League not found" }); return; }
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/admin/leagues/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await db.delete(leaguesTable).where(eq(leaguesTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
