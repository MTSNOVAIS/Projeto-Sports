import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const newsSourcesTable = pgTable("news_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  rssFeed: text("rss_feed"),
  language: text("language").notNull().default("en"),
  active: boolean("active").notNull().default(true),
  type: text("type").notNull().default("rss"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const importTopicsTable = pgTable("import_topics", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  query: text("query").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homepageSettingsTable = pgTable("homepage_settings", {
  id: serial("id").primaryKey(),
  showFeatured: boolean("show_featured").notNull().default(true),
  maxFeatured: integer("max_featured").notNull().default(3),
  featuredTitle: text("featured_title").notNull().default("Destaques"),
  showColunas: boolean("show_colunas").notNull().default(true),
  colunasTitle: text("colunas_title").notNull().default("Colunas"),
  showLatest: boolean("show_latest").notNull().default(true),
  maxLatest: integer("max_latest").notNull().default(6),
  latestTitle: text("latest_title").notNull().default("Últimas Notícias"),
  latestColumns: integer("latest_columns").notNull().default(2),
  showSidebarMatch: boolean("show_sidebar_match").notNull().default(true),
  sidebarMatchTitle: text("sidebar_match_title").notNull().default("Partida em Destaque"),
  announcementEnabled: boolean("announcement_enabled").notNull().default(false),
  announcementText: text("announcement_text").notNull().default(""),
  announcementColor: text("announcement_color").notNull().default("primary"),
  announcementLink: text("announcement_link"),
  showCategorySection: boolean("show_category_section").notNull().default(false),
  categorySection: text("category_section").notNull().default(""),
  categorySectionTitle: text("category_section_title").notNull().default("Destaque da Categoria"),
  maxCategorySection: integer("max_category_section").notNull().default(4),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").notNull().default("La Liga Brasil"),
  siteTagline: text("site_tagline").notNull().default("O futebol espanhol em português"),
  logoUrl: text("logo_url"),
  logoText: text("logo_text").notNull().default("LL"),
  footerBio: text("footer_bio").notNull().default("O seu portal definitivo para acompanhar o futebol espanhol. Notícias, análises, resultados e muito mais, feito por brasileiros para brasileiros."),
  primaryLeagueId: integer("primary_league_id"),
  twitterUrl: text("twitter_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  facebookUrl: text("facebook_url"),
  tiktokUrl: text("tiktok_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsSource = typeof newsSourcesTable.$inferSelect;
export type ImportTopic = typeof importTopicsTable.$inferSelect;
export type HomepageSettings = typeof homepageSettingsTable.$inferSelect;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
