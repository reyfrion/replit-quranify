import { Router, type IRouter } from "express";
import { buildLeaderboard } from "../services/leaderboardService.js";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const userId = (req.session as any)?.userId as number | undefined;
  const entries = await buildLeaderboard();
  const top10 = entries.slice(0, 10);
  const currentUserRank = userId
    ? (entries.findIndex(e => e.userId === userId) + 1) || null
    : null;
  return res.json({ entries: top10, currentUserRank });
});

export { buildLeaderboard };
export default router;
