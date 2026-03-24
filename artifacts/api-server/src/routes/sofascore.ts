import { Router, type IRouter } from "express";
import { db, matchesTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";

const router: IRouter = Router();

const SOFASCORE_BASE = "https://api.sofascore.com/api/v1";
const SOFASCORE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://www.sofascore.com/",
};

async function sofascoreFetch(path: string) {
  const res = await fetch(`${SOFASCORE_BASE}${path}`, { headers: SOFASCORE_HEADERS });
  if (!res.ok) throw new Error(`SofaScore error: ${res.status} for ${path}`);
  return res.json();
}

router.get("/sofascore/event/:id", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/event/${req.params.id}`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/event/:id/incidents", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/event/${req.params.id}/incidents`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/event/:id/statistics", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/event/${req.params.id}/statistics`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/event/:id/lineups", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/event/${req.params.id}/lineups`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/event/:id/h2h", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/event/${req.params.id}/h2h/events`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/team/:id", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/team/${req.params.id}`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/team/:id/events/last/:page", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/team/${req.params.id}/events/last/${req.params.page}`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/team/:id/events/next/:page", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/team/${req.params.id}/events/next/${req.params.page}`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/search/team/:name", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/search/${encodeURIComponent(req.params.name)}`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/tournament/:id/season/:seasonId/events/last/:page", async (req, res): Promise<void> => {
  try {
    const { id, seasonId, page } = req.params;
    const data = await sofascoreFetch(`/unique-tournament/${id}/season/${seasonId}/events/last/${page}`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/tournament/:id/season/:seasonId/events/next/:page", async (req, res): Promise<void> => {
  try {
    const { id, seasonId, page } = req.params;
    const data = await sofascoreFetch(`/unique-tournament/${id}/season/${seasonId}/events/next/${page}`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/tournament/:id/seasons", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/unique-tournament/${req.params.id}/seasons`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/sofascore/sport/football/scheduled-events/:date", async (req, res): Promise<void> => {
  try {
    const data = await sofascoreFetch(`/sport/football/scheduled-events/${req.params.date}`);
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/matches", async (_req, res): Promise<void> => {
  try {
    const matches = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.showInResults, true))
      .orderBy(asc(matchesTable.pinnedOrder), desc(matchesTable.createdAt));
    res.json(matches);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/matches/featured", async (_req, res): Promise<void> => {
  try {
    const [match] = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.featuredOnHome, true))
      .orderBy(desc(matchesTable.createdAt))
      .limit(1);
    res.json(match || null);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/admin/matches", async (_req, res): Promise<void> => {
  try {
    const matches = await db
      .select()
      .from(matchesTable)
      .orderBy(asc(matchesTable.pinnedOrder), desc(matchesTable.createdAt));
    res.json(matches);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/admin/matches", async (req, res): Promise<void> => {
  try {
    const { sofascoreId, homeTeamName, awayTeamName, homeTeamSofascoreId, awayTeamSofascoreId, tournament, showInResults, featuredOnHome, pinnedOrder, notes } = req.body;

    if (!sofascoreId || !homeTeamName || !awayTeamName) {
      res.status(400).json({ error: "sofascoreId, homeTeamName, awayTeamName required" });
      return;
    }

    if (featuredOnHome) {
      await db.update(matchesTable).set({ featuredOnHome: false });
    }

    const [created] = await db.insert(matchesTable).values({
      sofascoreId: Number(sofascoreId),
      homeTeamName,
      awayTeamName,
      homeTeamSofascoreId: homeTeamSofascoreId ? Number(homeTeamSofascoreId) : null,
      awayTeamSofascoreId: awayTeamSofascoreId ? Number(awayTeamSofascoreId) : null,
      tournament: tournament || "La Liga",
      showInResults: showInResults !== false,
      featuredOnHome: featuredOnHome === true,
      pinnedOrder: pinnedOrder || 0,
      notes: notes || null,
    }).returning();

    res.status(201).json(created);
  } catch (e: any) {
    if (e.code === "23505") {
      res.status(409).json({ error: "Match already added" });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

router.patch("/admin/matches/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { showInResults, featuredOnHome, pinnedOrder, notes } = req.body;

    if (featuredOnHome === true) {
      await db.update(matchesTable).set({ featuredOnHome: false });
    }

    const updates: Record<string, any> = {};
    if (showInResults !== undefined) updates.showInResults = showInResults;
    if (featuredOnHome !== undefined) updates.featuredOnHome = featuredOnHome;
    if (pinnedOrder !== undefined) updates.pinnedOrder = pinnedOrder;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db.update(matchesTable).set(updates).where(eq(matchesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Match not found" }); return; }
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/admin/matches/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await db.delete(matchesTable).where(eq(matchesTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
