import { Router, type IRouter } from "express";
import {
  getHafalanByUser,
  insertHafalan,
  updateHafalan,
  deleteHafalan,
} from "../services/hafalanService.js";
import { updateStreak } from "../services/userService.js";

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
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { surah, status, dateFrom, dateTo } = req.query as Record<string, string>;
  const result = await getHafalanByUser(userId, { surah, status, dateFrom, dateTo });
  return res.json(result);
});

router.post("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { surah, surahNumber, ayahStart, ayahEnd, status, date } = req.body;
  if (!surah || !surahNumber || !ayahStart || !ayahEnd || !status || !date) {
    return res.status(400).json({ error: "All fields required" });
  }

  const created = await insertHafalan({
    userId,
    surah,
    surahNumber: Number(surahNumber),
    ayahStart: Number(ayahStart),
    ayahEnd: Number(ayahEnd),
    status,
    date,
  });

  await updateStreak(userId);
  return res.status(201).json(created);
});

router.put("/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const { surah, surahNumber, ayahStart, ayahEnd, status, date } = req.body;

  const updated = await updateHafalan(id, userId, {
    surah,
    surahNumber: surahNumber !== undefined ? Number(surahNumber) : undefined,
    ayahStart: ayahStart !== undefined ? Number(ayahStart) : undefined,
    ayahEnd: ayahEnd !== undefined ? Number(ayahEnd) : undefined,
    status,
    date,
  });

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const deleted = await deleteHafalan(id, userId);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.json({ success: true, message: "Deleted" });
});

export default router;
