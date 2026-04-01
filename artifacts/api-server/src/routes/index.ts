import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import hafalanRouter from "./hafalan.js";
import leaderboardRouter from "./leaderboard.js";
import halaqahRouter from "./halaqah.js";
import dashboardRouter from "./dashboard.js";
import usersRouter from "./users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/hafalan", hafalanRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/halaqah", halaqahRouter);
router.use("/dashboard", dashboardRouter);
router.use("/users", usersRouter);

export default router;
