import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, hafalanTable, halaqahTable } from "@workspace/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { buildLeaderboard } from "./leaderboard.js";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

function computeBadges(totalAyat: number): string[] {
  const badges: string[] = [];
  if (totalAyat >= 100) badges.push("100 Ayat");
  if (totalAyat >= 500) badges.push("500 Ayat");
  if (totalAyat >= 1000) badges.push("1000 Ayat");
  return badges;
}

async function getHalaqahWithStats(id: number) {
  const halaqah = await db.select().from(halaqahTable).where(eq(halaqahTable.id, id)).limit(1);
  if (!halaqah[0]) return null;

  const mentor = await db.select().from(usersTable).where(eq(usersTable.id, halaqah[0].mentorId)).limit(1);
  const mentorName = mentor[0]?.name ?? "Unknown";

  const members = await db.select().from(usersTable).where(eq(usersTable.halaqahGroup, id));

  const membersWithStats = await Promise.all(members.map(async (m) => {
    const ayatRes = await db
      .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
      .from(hafalanTable)
      .where(eq(hafalanTable.userId, m.id));
    const totalAyat = Number(ayatRes[0]?.total ?? 0);
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      halaqahGroup: m.halaqahGroup ?? null,
      halaqahName: halaqah[0].name,
      totalAyat,
      streak: m.streak,
      badges: computeBadges(totalAyat),
      createdAt: m.createdAt.toISOString(),
    };
  }));

  const totalAyat = membersWithStats.reduce((sum, m) => sum + m.totalAyat, 0);

  return {
    id: halaqah[0].id,
    name: halaqah[0].name,
    mentorId: halaqah[0].mentorId,
    mentorName,
    members: membersWithStats,
    totalAyat,
    createdAt: halaqah[0].createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const allHalaqah = await db.select().from(halaqahTable).orderBy(halaqahTable.createdAt);

  const result = await Promise.all(allHalaqah.map(async (h) => {
    const mentor = await db.select().from(usersTable).where(eq(usersTable.id, h.mentorId)).limit(1);
    const members = await db.select().from(usersTable).where(eq(usersTable.halaqahGroup, h.id));

    const totalAyatRes = await Promise.all(members.map(async (m) => {
      const r = await db
        .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
        .from(hafalanTable)
        .where(eq(hafalanTable.userId, m.id));
      return Number(r[0]?.total ?? 0);
    }));
    const totalAyat = totalAyatRes.reduce((a, b) => a + b, 0);

    return {
      id: h.id,
      name: h.name,
      mentorId: h.mentorId,
      mentorName: mentor[0]?.name ?? "Unknown",
      memberCount: members.length,
      totalAyat,
      createdAt: h.createdAt.toISOString(),
    };
  }));

  return res.json(result);
});

router.post("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const { name, mentorId } = req.body;
  if (!name || !mentorId) return res.status(400).json({ error: "Name and mentorId required" });

  const [created] = await db.insert(halaqahTable).values({ name, mentorId: Number(mentorId) }).returning();

  const mentor = await db.select().from(usersTable).where(eq(usersTable.id, created.mentorId)).limit(1);

  return res.status(201).json({
    id: created.id,
    name: created.name,
    mentorId: created.mentorId,
    mentorName: mentor[0]?.name ?? "Unknown",
    memberCount: 0,
    totalAyat: 0,
    createdAt: created.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const detail = await getHalaqahWithStats(id);
  if (!detail) return res.status(404).json({ error: "Not found" });
  return res.json(detail);
});

router.get("/:id/leaderboard", async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.session?.userId as number | undefined;

  const members = await db.select().from(usersTable).where(eq(usersTable.halaqahGroup, id));
  const memberIds = new Set(members.map(m => m.id));

  const allEntries = await buildLeaderboard();
  const filtered = allEntries
    .filter(e => memberIds.has(e.userId))
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const currentUserRank = userId ? (filtered.findIndex(e => e.userId === userId) + 1) || null : null;

  return res.json({ entries: filtered, currentUserRank });
});

export default router;
