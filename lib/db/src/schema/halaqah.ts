import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const halaqahTable = pgTable("halaqah", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mentorId: integer("mentor_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHalaqahSchema = createInsertSchema(halaqahTable).omit({ id: true, createdAt: true });
export type InsertHalaqah = z.infer<typeof insertHalaqahSchema>;
export type Halaqah = typeof halaqahTable.$inferSelect;
