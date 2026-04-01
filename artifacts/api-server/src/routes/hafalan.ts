import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { hafalanTable, usersTable } from "@workspace/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

async function updateStreak(userId: number) {
  const today = new Date().toISOString().split("T")[0];
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) return;

  const lastActivity = user[0].lastActivityDate;
  let streak = user[0].streak;

  if (lastActivity === today) {
    // Already logged today, no change
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastActivity === yesterdayStr) {
    streak += 1;
  } else {
    streak = 1;
  }

  await db.update(usersTable).set({ streak, lastActivityDate: today }).where(eq(usersTable.id, userId));
}

router.get("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { surah, status, dateFrom, dateTo } = req.query as Record<string, string>;

  let query = db.select().from(hafalanTable).where(eq(hafalanTable.userId, userId));

  const conditions = [eq(hafalanTable.userId, userId)];
  if (surah) conditions.push(eq(hafalanTable.surah, surah) as any);
  if (status) conditions.push(eq(hafalanTable.status, status as any) as any);
  if (dateFrom) conditions.push(gte(hafalanTable.date, dateFrom) as any);
  if (dateTo) conditions.push(lte(hafalanTable.date, dateTo) as any);

  const rows = await db.select().from(hafalanTable).where(and(...conditions)).orderBy(hafalanTable.date);

  const result = rows.map(r => ({
    id: r.id,
    userId: r.userId,
    surah: r.surah,
    surahNumber: r.surahNumber,
    ayahStart: r.ayahStart,
    ayahEnd: r.ayahEnd,
    ayahCount: r.ayahEnd - r.ayahStart + 1,
    status: r.status,
    date: r.date,
    createdAt: r.createdAt.toISOString(),
  }));

  return res.json(result);
});

router.post("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { surah, surahNumber, ayahStart, ayahEnd, status, date } = req.body;
  if (!surah || !surahNumber || !ayahStart || !ayahEnd || !status || !date) {
    return res.status(400).json({ error: "All fields required" });
  }

  const [created] = await db.insert(hafalanTable).values({
    userId,
    surah,
    surahNumber: Number(surahNumber),
    ayahStart: Number(ayahStart),
    ayahEnd: Number(ayahEnd),
    status,
    date,
  }).returning();

  await updateStreak(userId);

  return res.status(201).json({
    id: created.id,
    userId: created.userId,
    surah: created.surah,
    surahNumber: created.surahNumber,
    ayahStart: created.ayahStart,
    ayahEnd: created.ayahEnd,
    ayahCount: created.ayahEnd - created.ayahStart + 1,
    status: created.status,
    date: created.date,
    createdAt: created.createdAt.toISOString(),
  });
});

router.put("/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);

  const { surah, surahNumber, ayahStart, ayahEnd, status, date } = req.body;
  const updates: any = {};
  if (surah !== undefined) updates.surah = surah;
  if (surahNumber !== undefined) updates.surahNumber = Number(surahNumber);
  if (ayahStart !== undefined) updates.ayahStart = Number(ayahStart);
  if (ayahEnd !== undefined) updates.ayahEnd = Number(ayahEnd);
  if (status !== undefined) updates.status = status;
  if (date !== undefined) updates.date = date;

  const [updated] = await db
    .update(hafalanTable)
    .set(updates)
    .where(and(eq(hafalanTable.id, id), eq(hafalanTable.userId, userId)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  return res.json({
    id: updated.id,
    userId: updated.userId,
    surah: updated.surah,
    surahNumber: updated.surahNumber,
    ayahStart: updated.ayahStart,
    ayahEnd: updated.ayahEnd,
    ayahCount: updated.ayahEnd - updated.ayahStart + 1,
    status: updated.status,
    date: updated.date,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);

  const deleted = await db
    .delete(hafalanTable)
    .where(and(eq(hafalanTable.id, id), eq(hafalanTable.userId, userId)))
    .returning();

  if (!deleted.length) return res.status(404).json({ error: "Not found" });
  return res.json({ success: true, message: "Deleted" });
});

export default router;
