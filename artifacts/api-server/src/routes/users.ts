import { Router, type IRouter } from "express";
import { getAllUsers, getUserTotalAyat } from "../services/userService.js";
import { getHalaqahById, assignUserToHalaqah } from "../services/halaqahService.js";
import { getUserById } from "../services/userService.js";
import { computeBadges } from "../services/leaderboardService.js";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const users = await getAllUsers();

  const result = await Promise.all(
    users.map(async u => {
      const totalAyat = await getUserTotalAyat(u.id);
      let halaqahName: string | null = null;
      if (u.halaqah_group) {
        const h = await getHalaqahById(u.halaqah_group);
        halaqahName = h?.name ?? null;
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        halaqahGroup: u.halaqah_group ?? null,
        halaqahName,
        totalAyat,
        streak: u.streak,
        badges: computeBadges(totalAyat),
        createdAt: u.created_at,
      };
    })
  );

  return res.json(result);
});

router.put("/:id/assign-halaqah", async (req, res) => {
  const id = Number(req.params.id);
  const { halaqahId } = req.body;

  await assignUserToHalaqah(id, halaqahId);

  const user = await getUserById(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const totalAyat = await getUserTotalAyat(id);
  let halaqahName: string | null = null;
  if (user.halaqah_group) {
    const h = await getHalaqahById(user.halaqah_group);
    halaqahName = h?.name ?? null;
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    halaqahGroup: user.halaqah_group ?? null,
    halaqahName,
    totalAyat,
    streak: user.streak,
    badges: computeBadges(totalAyat),
    createdAt: user.created_at,
  });
});

export default router;
