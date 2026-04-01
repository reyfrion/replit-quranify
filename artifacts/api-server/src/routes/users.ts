import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, hafalanTable, halaqahTable } from "@workspace/db/schema";
import { sql, eq } from "drizzle-orm";

const router: IRouter = Router();

function computeBadges(totalAyat: number): string[] {
  const badges: string[] = [];
  if (totalAyat >= 100) badges.push("100 Ayat");
  if (totalAyat >= 500) badges.push("500 Ayat");
  if (totalAyat >= 1000) badges.push("1000 Ayat");
  return badges;
}

router.get("/", async (req, res) => {
  const users = await db.select().from(usersTable);
  const result = await Promise.all(users.map(async (u) => {
    const ayatRes = await db
      .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
      .from(hafalanTable)
      .where(eq(hafalanTable.userId, u.id));
    const totalAyat = Number(ayatRes[0]?.total ?? 0);

    let halaqahName: string | null = null;
    if (u.halaqahGroup) {
      const h = await db.select().from(halaqahTable).where(eq(halaqahTable.id, u.halaqahGroup)).limit(1);
      halaqahName = h[0]?.name ?? null;
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      halaqahGroup: u.halaqahGroup ?? null,
      halaqahName,
      totalAyat,
      streak: u.streak,
      badges: computeBadges(totalAyat),
      createdAt: u.createdAt.toISOString(),
    };
  }));

  return res.json(result);
});

router.put("/:id/assign-halaqah", async (req, res) => {
  const id = Number(req.params.id);
  const { halaqahId } = req.body;

  await db.update(usersTable).set({ halaqahGroup: halaqahId }).where(eq(usersTable.id, id));

  const user = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user[0]) return res.status(404).json({ error: "User not found" });

  const ayatRes = await db
    .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
    .from(hafalanTable)
    .where(eq(hafalanTable.userId, id));
  const totalAyat = Number(ayatRes[0]?.total ?? 0);

  let halaqahName: string | null = null;
  if (user[0].halaqahGroup) {
    const h = await db.select().from(halaqahTable).where(eq(halaqahTable.id, user[0].halaqahGroup)).limit(1);
    halaqahName = h[0]?.name ?? null;
  }

  return res.json({
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    role: user[0].role,
    halaqahGroup: user[0].halaqahGroup ?? null,
    halaqahName,
    totalAyat,
    streak: user[0].streak,
    badges: computeBadges(totalAyat),
    createdAt: user[0].createdAt.toISOString(),
  });
});

export default router;
