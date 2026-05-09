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
  showSidebarMatch: boolean("show_sidebar_match").notNull().default(true),
  sidebarMatchTitle: text("sidebar_match_title").notNull().default("Partida em Destaque"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsSource = typeof newsSourcesTable.$inferSelect;
export type ImportTopic = typeof importTopicsTable.$inferSelect;
export type HomepageSettings = typeof homepageSettingsTable.$inferSelect;
