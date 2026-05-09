import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { homepageSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const [existing] = await db.select().from(homepageSettingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(homepageSettingsTable).values({}).returning();
  return created;
}

router.get("/homepage-settings", async (_req, res): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/admin/homepage-settings", async (req, res): Promise<void> => {
  try {
    const {
      showFeatured,
      maxFeatured,
      featuredTitle,
      showColunas,
      colunasTitle,
      showLatest,
      maxLatest,
      latestTitle,
      latestColumns,
      showSidebarMatch,
      sidebarMatchTitle,
      announcementEnabled,
      announcementText,
      announcementColor,
      announcementLink,
      showCategorySection,
      categorySection,
      categorySectionTitle,
      maxCategorySection,
      seoTitle,
      seoDescription,
    } = req.body;

    const existing = await getOrCreateSettings();

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (showFeatured !== undefined) updates.showFeatured = showFeatured;
    if (maxFeatured !== undefined) updates.maxFeatured = Number(maxFeatured);
    if (featuredTitle !== undefined) updates.featuredTitle = featuredTitle;
    if (showColunas !== undefined) updates.showColunas = showColunas;
    if (colunasTitle !== undefined) updates.colunasTitle = colunasTitle;
    if (showLatest !== undefined) updates.showLatest = showLatest;
    if (maxLatest !== undefined) updates.maxLatest = Number(maxLatest);
    if (latestTitle !== undefined) updates.latestTitle = latestTitle;
    if (latestColumns !== undefined) updates.latestColumns = Number(latestColumns);
    if (showSidebarMatch !== undefined) updates.showSidebarMatch = showSidebarMatch;
    if (sidebarMatchTitle !== undefined) updates.sidebarMatchTitle = sidebarMatchTitle;
    if (announcementEnabled !== undefined) updates.announcementEnabled = announcementEnabled;
    if (announcementText !== undefined) updates.announcementText = announcementText;
    if (announcementColor !== undefined) updates.announcementColor = announcementColor;
    if ("announcementLink" in req.body) updates.announcementLink = announcementLink ?? null;
    if (showCategorySection !== undefined) updates.showCategorySection = showCategorySection;
    if (categorySection !== undefined) updates.categorySection = categorySection;
    if (categorySectionTitle !== undefined) updates.categorySectionTitle = categorySectionTitle;
    if (maxCategorySection !== undefined) updates.maxCategorySection = Number(maxCategorySection);
    if ("seoTitle" in req.body) updates.seoTitle = seoTitle ?? null;
    if ("seoDescription" in req.body) updates.seoDescription = seoDescription ?? null;

    const [updated] = await db
      .update(homepageSettingsTable)
      .set(updates)
      .where(eq(homepageSettingsTable.id, existing.id))
      .returning();

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
