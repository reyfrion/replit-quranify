import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "quranify_salt").digest("hex");
}

function computeBadges(totalAyat: number): string[] {
  const badges: string[] = [];
  if (totalAyat >= 100) badges.push("100 Ayat");
  if (totalAyat >= 500) badges.push("500 Ayat");
  if (totalAyat >= 1000) badges.push("1000 Ayat");
  return badges;
}

async function getUserWithStats(userId: number) {
  const { hafalanTable, halaqahTable } = await import("@workspace/db/schema");
  const { sql, sum } = await import("drizzle-orm");

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) return null;

  const totalAyatResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
    .from(hafalanTable)
    .where(eq(hafalanTable.userId, userId));

  const totalAyat = Number(totalAyatResult[0]?.total ?? 0);
  const badges = computeBadges(totalAyat);

  let halaqahName: string | null = null;
  if (user[0].halaqahGroup) {
    const halaqah = await db.select().from(halaqahTable).where(eq(halaqahTable.id, user[0].halaqahGroup)).limit(1);
    halaqahName = halaqah[0]?.name ?? null;
  }

  return {
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    role: user[0].role,
    halaqahGroup: user[0].halaqahGroup ?? null,
    halaqahName,
    totalAyat,
    streak: user[0].streak,
    badges,
    createdAt: user[0].createdAt.toISOString(),
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const hashed = hashPassword(password);
    const [created] = await db.insert(usersTable).values({
      name,
      email,
      password: hashed,
      role: role ?? "member",
    }).returning();

    (req.session as any).userId = created.id;

    const user = await getUserWithStats(created.id);
    return res.status(201).json({ user, message: "Registered successfully" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const hashed = hashPassword(password);
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!users[0] || users[0].password !== hashed) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    (req.session as any).userId = users[0].id;
    const user = await getUserWithStats(users[0].id);
    return res.json({ user, message: "Logged in successfully" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

router.get("/me", async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const user = await getUserWithStats(userId);
  if (!user) return res.status(401).json({ error: "User not found" });
  return res.json(user);
});

router.put("/me/profile", async (req, res) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  const { name, email } = req.body;
  const updates: Record<string, string> = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (Object.keys(updates).length === 0) {
    const user = await getUserWithStats(userId);
    return res.json(user);
  }
  await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
  const user = await getUserWithStats(userId);
  return res.json(user);
});

export { getUserWithStats, computeBadges };
export default router;
