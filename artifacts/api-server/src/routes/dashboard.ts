import { Router, type IRouter } from "express";
import { getUserById } from "../services/userService.js";
import {
  getUserTotalAyat,
  getWeeklyAyat,
  getDailyAyat,
  getRecentHafalan,
} from "../services/hafalanService.js";
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

const dailyAyahs = [
  { ayah: "Indeed, with hardship will be ease.", reference: "Quran 94:6" },
  { ayah: "And He found you lost and guided you.", reference: "Quran 93:7" },
  { ayah: "And your Lord is going to give you, and you will be satisfied.", reference: "Quran 93:5" },
  { ayah: "So remember Me; I will remember you.", reference: "Quran 2:152" },
  { ayah: "Allah does not burden a soul beyond that it can bear.", reference: "Quran 2:286" },
  { ayah: "And rely upon Allah; and sufficient is Allah as Disposer of affairs.", reference: "Quran 33:3" },
  { ayah: "And whoever relies upon Allah — then He is sufficient for him.", reference: "Quran 65:3" },
  { ayah: "And it is He who is the Most Gentle, the Acquainted.", reference: "Quran 67:14" },
  { ayah: "Unquestionably, by the remembrance of Allah hearts are assured.", reference: "Quran 13:28" },
  { ayah: "And whoever fears Allah — He will make for him a way out.", reference: "Quran 65:2" },
  { ayah: "Allah is with the patient.", reference: "Quran 2:153" },
  { ayah: "And do not despair of relief from Allah. Indeed, no one despairs of relief from Allah except the disbelieving people.", reference: "Quran 12:87" },
  { ayah: "And He is with you wherever you are.", reference: "Quran 57:4" },
  { ayah: "Say: Indeed, my Lord extends provision for whom He wills and restricts it. But most of the people do not know.", reference: "Quran 34:36" },
  { ayah: "And He found you poor and made you self-sufficient.", reference: "Quran 93:8" },
];

const motivationalQuotes = [
  { quote: "The best of you are those who learn the Quran and teach it.", reference: "Prophet Muhammad (SAW)" },
  { quote: "One who recites the Quran beautifully, smoothly, and precisely will be in the company of noble and obedient angels.", reference: "Bukhari & Muslim" },
  { quote: "Read the Quran, for it will come as an intercessor for its reciters on the Day of Resurrection.", reference: "Muslim" },
  { quote: "Make your homes bright with the recitation of the Quran.", reference: "Baihaqi" },
  { quote: "The one who is proficient in the recitation of the Quran will be with the honorable and obedient scribes.", reference: "Bukhari" },
];

router.get("/summary", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekStr = startOfWeek.toISOString().split("T")[0]!;

  const [totalAyat, user, recentHafalan, weeklyProgress] = await Promise.all([
    getUserTotalAyat(userId),
    getUserById(userId),
    getRecentHafalan(userId, 5),
    getWeeklyAyat(userId, weekStr),
  ]);

  const streak = user?.streak ?? 0;
  const lastActivity = user?.last_activity_date ?? null;

  const dayIndex = new Date().getDay();
  const todayAyah = dailyAyahs[dayIndex % dailyAyahs.length]!;
  const quoteIndex = new Date().getDate() % motivationalQuotes.length;
  const quote = motivationalQuotes[quoteIndex]!;

  return res.json({
    totalAyat,
    streak,
    lastActivity,
    todayAyah: todayAyah.ayah,
    todayAyahReference: todayAyah.reference,
    motivationalQuote: quote.quote,
    motivationalQuoteReference: quote.reference,
    recentHafalan,
    badges: computeBadges(totalAyat),
    weeklyGoal: 50,
    weeklyProgress,
  });
});

router.get("/analytics", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyPromises = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0]!;
    return getDailyAyat(userId, dateStr).then(ayat => ({
      day: dayNames[d.getDay()]!,
      ayat,
    }));
  });

  const weekly = await Promise.all(weeklyPromises);
  const totalThisWeek = weekly.reduce((sum, d) => sum + d.ayat, 0);

  const monthlyPromises = Array.from({ length: 4 }, (_, w) => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - w * 7);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    const startStr = startDate.toISOString().split("T")[0]!;
    return getWeeklyAyat(userId, startStr).then(ayat => ({
      week: `Week ${4 - w}`,
      ayat,
    }));
  });

  const monthly = (await Promise.all(monthlyPromises)).reverse();
  const totalThisMonth = monthly.reduce((sum, w) => sum + w.ayat, 0);
  const averagePerDay = totalThisWeek > 0 ? Math.round((totalThisWeek / 7) * 10) / 10 : 0;

  return res.json({ weekly, monthly, totalThisWeek, totalThisMonth, averagePerDay });
});

export default router;
