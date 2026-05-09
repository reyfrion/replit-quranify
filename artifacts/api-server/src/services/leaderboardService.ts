import { getAllUsers } from "./userService.js";
import { getAllHafalanRaw } from "./hafalanService.js";
import { getHalaqahById } from "./halaqahService.js";

export function computeBadges(totalAyat: number): string[] {
  const badges: string[] = [];
  if (totalAyat >= 100) badges.push("100 Ayat");
  if (totalAyat >= 500) badges.push("500 Ayat");
  if (totalAyat >= 1000) badges.push("1000 Ayat");
  return badges;
}

export async function buildLeaderboard() {
  const [users, allHafalan] = await Promise.all([getAllUsers(), getAllHafalanRaw()]);

  const totals: Record<number, number> = {};
  for (const h of allHafalan) {
    totals[h.user_id] = (totals[h.user_id] ?? 0) + (h.ayah_end - h.ayah_start + 1);
  }

  const halaqahNameCache: Record<number, string> = {};
  const uniqueHalaqahIds = [...new Set(users.filter(u => u.halaqah_group).map(u => u.halaqah_group as number))];
  await Promise.all(
    uniqueHalaqahIds.map(async (id) => {
      const h = await getHalaqahById(id);
      if (h) halaqahNameCache[id] = h.name;
    })
  );

  const ranked = users
    .map(u => ({
      userId: u.id,
      name: u.name,
      totalAyat: totals[u.id] ?? 0,
      streak: u.streak,
      halaqahGroup: u.halaqah_group,
      halaqahName: u.halaqah_group ? (halaqahNameCache[u.halaqah_group] ?? null) : null,
    }))
    .sort((a, b) => b.totalAyat - a.totalAyat)
    .slice(0, 50)
    .map((entry, i) => ({
      rank: i + 1,
      ...entry,
      badges: computeBadges(entry.totalAyat),
    }));

  return ranked;
}
