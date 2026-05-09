import { Router, type IRouter } from "express";
import {
  getAllHalaqah,
  getHalaqahById,
  createHalaqah,
  getMembersByHalaqah,
} from "../services/halaqahService.js";
import { getUserById, getUserTotalAyat } from "../services/userService.js";
import { buildLeaderboard } from "../services/leaderboardService.js";
import { computeBadges } from "../services/leaderboardService.js";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

router.get("/", async (req, res) => {
  const allHalaqah = await getAllHalaqah();

  const result = await Promise.all(
    allHalaqah.map(async h => {
      const mentor = await getUserById(h.mentor_id);
      const members = await getMembersByHalaqah(h.id);
      const memberAyat = await Promise.all(members.map(m => getUserTotalAyat(m.id)));
      const totalAyat = memberAyat.reduce((a, b) => a + b, 0);

      return {
        id: h.id,
        name: h.name,
        mentorId: h.mentor_id,
        mentorName: mentor?.name ?? "Unknown",
        memberCount: members.length,
        totalAyat,
        createdAt: h.created_at,
      };
    })
  );

  return res.json(result);
});

router.post("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { name, mentorId } = req.body;
  if (!name || !mentorId) {
    return res.status(400).json({ error: "Name and mentorId required" });
  }

  const created = await createHalaqah({ name, mentorId: Number(mentorId) });
  const mentor = await getUserById(created.mentor_id);

  return res.status(201).json({
    id: created.id,
    name: created.name,
    mentorId: created.mentor_id,
    mentorName: mentor?.name ?? "Unknown",
    memberCount: 0,
    totalAyat: 0,
    createdAt: created.created_at,
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const halaqah = await getHalaqahById(id);
  if (!halaqah) return res.status(404).json({ error: "Not found" });

  const mentor = await getUserById(halaqah.mentor_id);
  const members = await getMembersByHalaqah(id);

  const membersWithStats = await Promise.all(
    members.map(async m => {
      const totalAyat = await getUserTotalAyat(m.id);
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        halaqahGroup: m.halaqah_group ?? null,
        halaqahName: halaqah.name,
        totalAyat,
        streak: m.streak,
        badges: computeBadges(totalAyat),
        createdAt: m.created_at,
      };
    })
  );

  const totalAyat = membersWithStats.reduce((sum, m) => sum + m.totalAyat, 0);

  return res.json({
    id: halaqah.id,
    name: halaqah.name,
    mentorId: halaqah.mentor_id,
    mentorName: mentor?.name ?? "Unknown",
    members: membersWithStats,
    totalAyat,
    createdAt: halaqah.created_at,
  });
});

router.get("/:id/leaderboard", async (req, res) => {
  const id = Number(req.params.id);
  const userId = (req.session as any)?.userId as number | undefined;

  const members = await getMembersByHalaqah(id);
  const memberIds = new Set(members.map(m => m.id));

  const allEntries = await buildLeaderboard();
  const filtered = allEntries
    .filter(e => memberIds.has(e.userId))
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const currentUserRank = userId
    ? (filtered.findIndex(e => e.userId === userId) + 1) || null
    : null;

  return res.json({ entries: filtered, currentUserRank });
});

export default router;
