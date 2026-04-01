import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, hafalanTable } from "@workspace/db/schema";
import { sql, eq, gte, and, desc } from "drizzle-orm";

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

  const ayatRes = await db
    .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
    .from(hafalanTable)
    .where(eq(hafalanTable.userId, userId));
  const totalAyat = Number(ayatRes[0]?.total ?? 0);

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const streak = user[0]?.streak ?? 0;
  const lastActivity = user[0]?.lastActivityDate ?? null;

  const recent = await db
    .select()
    .from(hafalanTable)
    .where(eq(hafalanTable.userId, userId))
    .orderBy(desc(hafalanTable.createdAt))
    .limit(5);

  const recentHafalan = recent.map(r => ({
    id: r.id,
    userId: r.userId,
    surah: r.surah,
    surahNumber: r.surahNumber,
    ayahStart: r.ayahStart,
    ayahEnd: r.ayahEnd,
    ayahCount: r.ayahEnd - r.ayahStart + 1,
    status: r.status,
    date: r.date,
    createdAt: r.createdAt.toISOString(),
  }));

  function computeBadges(totalAyat: number): string[] {
    const badges: string[] = [];
    if (totalAyat >= 100) badges.push("100 Ayat");
    if (totalAyat >= 500) badges.push("500 Ayat");
    if (totalAyat >= 1000) badges.push("1000 Ayat");
    return badges;
  }

  const dayIndex = new Date().getDay();
  const todayAyah = dailyAyahs[dayIndex % dailyAyahs.length];
  const quoteIndex = (new Date().getDate()) % motivationalQuotes.length;
  const quote = motivationalQuotes[quoteIndex];

  // Calculate weekly progress (ayat this week)
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekStr = startOfWeek.toISOString().split("T")[0];

  const weeklyRes = await db
    .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
    .from(hafalanTable)
    .where(and(eq(hafalanTable.userId, userId), gte(hafalanTable.date, weekStr)));
  const weeklyProgress = Number(weeklyRes[0]?.total ?? 0);

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
  const weekly = [];
  let totalThisWeek = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const res2 = await db
      .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
      .from(hafalanTable)
      .where(and(eq(hafalanTable.userId, userId), eq(hafalanTable.date, dateStr)));
    const ayat = Number(res2[0]?.total ?? 0);
    weekly.push({ day: dayNames[d.getDay()], ayat });
    totalThisWeek += ayat;
  }

  const monthly = [];
  let totalThisMonth = 0;
  for (let w = 3; w >= 0; w--) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - w * 7);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];
    const res2 = await db
      .select({ total: sql<number>`COALESCE(SUM(${hafalanTable.ayahEnd} - ${hafalanTable.ayahStart} + 1), 0)` })
      .from(hafalanTable)
      .where(and(eq(hafalanTable.userId, userId), gte(hafalanTable.date, startStr)));
    const ayat = Number(res2[0]?.total ?? 0);
    monthly.push({ week: `Week ${4 - w}`, ayat });
    totalThisMonth += ayat;
  }

  const averagePerDay = totalThisWeek > 0 ? Math.round(totalThisWeek / 7 * 10) / 10 : 0;

  return res.json({ weekly, monthly, totalThisWeek, totalThisMonth, averagePerDay });
});

export default router;
