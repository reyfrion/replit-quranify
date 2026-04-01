import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, hafalanTable, halaqahTable } from "@workspace/db/schema";
import { sql, eq } from "drizzle-orm";

const router: IRouter = Router();

async function buildLeaderboard() {
  const rows = await db.execute(sql`
    SELECT
      u.id as "userId",
      u.name,
      u.streak,
      u.halaqah_group as "halaqahGroup",
      COALESCE(SUM(h.ayah_end - h.ayah_start + 1), 0) as "totalAyat"
    FROM users u
    LEFT JOIN hafalan h ON h.user_id = u.id
    GROUP BY u.id, u.name, u.streak, u.halaqah_group
    ORDER BY "totalAyat" DESC
    LIMIT 50
  `);

  const halaqahMap: Record<number, string> = {};
  const uniqueHalaqahIds = [...new Set(
    (rows.rows as any[]).filter(r => r.halaqahGroup).map(r => Number(r.halaqahGroup))
  )];
  for (const hId of uniqueHalaqahIds) {
    const h = await db.select().from(halaqahTable).where(eq(halaqahTable.id, hId)).limit(1);
    if (h[0]) halaqahMap[hId] = h[0].name;
  }

  function computeBadges(totalAyat: number): string[] {
    const badges: string[] = [];
    if (totalAyat >= 100) badges.push("100 Ayat");
    if (totalAyat >= 500) badges.push("500 Ayat");
    if (totalAyat >= 1000) badges.push("1000 Ayat");
    return badges;
  }

  return (rows.rows as any[]).map((r: any, i: number) => ({
    rank: i + 1,
    userId: Number(r.userId),
    name: String(r.name),
    totalAyat: Number(r.totalAyat),
    streak: Number(r.streak),
    halaqahName: r.halaqahGroup ? (halaqahMap[Number(r.halaqahGroup)] ?? null) : null,
    badges: computeBadges(Number(r.totalAyat)),
  }));
}

router.get("/", async (req, res) => {
  const userId = (req.session as any)?.userId as number | undefined;
  const entries = await buildLeaderboard();
  const top10 = entries.slice(0, 10);
  const currentUserRank = userId ? (entries.findIndex(e => e.userId === userId) + 1) || null : null;
  return res.json({ entries: top10, currentUserRank });
});

export { buildLeaderboard };
export default router;
