import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hafalanTable = pgTable("hafalan", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  surah: text("surah").notNull(),
  surahNumber: integer("surah_number").notNull(),
  ayahStart: integer("ayah_start").notNull(),
  ayahEnd: integer("ayah_end").notNull(),
  status: text("status", { enum: ["New", "Review", "Strong"] }).notNull().default("New"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHafalanSchema = createInsertSchema(hafalanTable).omit({ id: true, createdAt: true });
export type InsertHafalan = z.infer<typeof insertHafalanSchema>;
export type HafalanRecord = typeof hafalanTable.$inferSelect;
