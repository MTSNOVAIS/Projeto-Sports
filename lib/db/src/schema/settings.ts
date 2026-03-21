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

export type NewsSource = typeof newsSourcesTable.$inferSelect;
export type ImportTopic = typeof importTopicsTable.$inferSelect;
