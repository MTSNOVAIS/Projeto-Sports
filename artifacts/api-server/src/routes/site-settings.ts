import { Router, type IRouter } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const existing = await db.select().from(siteSettingsTable).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(siteSettingsTable).values({}).returning();
  return created;
}

router.get("/site-settings", async (_req, res): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    console.error("Error fetching site settings:", err);
    res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

router.put("/admin/site-settings", async (req, res): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    const allowed = [
      "siteName", "siteTagline", "logoUrl", "logoText", "footerBio",
      "primaryLeagueId", "twitterUrl", "instagramUrl", "youtubeUrl",
      "facebookUrl", "tiktokUrl",
    ];
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (key in req.body) {
        update[key] = req.body[key] === "" ? null : req.body[key];
      }
    }
    const [updated] = await db
      .update(siteSettingsTable)
      .set(update as any)
      .where(eq(siteSettingsTable.id, settings!.id))
      .returning();
    res.json(updated);
  } catch (err) {
    console.error("Error updating site settings:", err);
    res.status(500).json({ error: "Failed to update site settings" });
  }
});

export default router;
