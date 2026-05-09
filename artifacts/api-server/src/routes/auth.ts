import { Router, type IRouter } from "express";
import crypto from "crypto";
import { getUserById, getUserByEmail, createUser, updateUser, getUserTotalAyat } from "../services/userService.js";
import { getHalaqahById } from "../services/halaqahService.js";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "quranify_salt").digest("hex");
}

export function computeBadges(totalAyat: number): string[] {
  const badges: string[] = [];
  if (totalAyat >= 100) badges.push("100 Ayat");
  if (totalAyat >= 500) badges.push("500 Ayat");
  if (totalAyat >= 1000) badges.push("1000 Ayat");
  return badges;
}

export async function getUserWithStats(userId: number) {
  const user = await getUserById(userId);
  if (!user) return null;

  const totalAyat = await getUserTotalAyat(userId);
  const badges = computeBadges(totalAyat);

  let halaqahName: string | null = null;
  if (user.halaqah_group) {
    const halaqah = await getHalaqahById(user.halaqah_group);
    halaqahName = halaqah?.name ?? null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    halaqahGroup: user.halaqah_group ?? null,
    halaqahName,
    totalAyat,
    streak: user.streak,
    badges,
    createdAt: user.created_at,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const hashed = hashPassword(password);
    const created = await createUser({ name, email, password: hashed, role: role ?? "member" });
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
    const foundUser = await getUserByEmail(email);
    if (!foundUser || foundUser.password !== hashed) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    (req.session as any).userId = foundUser.id;
    const user = await getUserWithStats(foundUser.id);
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
  if (name) updates["name"] = name;
  if (email) updates["email"] = email;
  if (Object.keys(updates).length > 0) {
    await updateUser(userId, updates);
  }
  const user = await getUserWithStats(userId);
  return res.json(user);
});

export default router;
