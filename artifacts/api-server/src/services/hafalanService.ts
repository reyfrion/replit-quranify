import { supabase, type HafalanRow } from "../lib/supabase.js";

export function formatHafalan(h: HafalanRow) {
  return {
    id: h.id,
    userId: h.user_id,
    surah: h.surah,
    surahNumber: h.surah_number,
    ayahStart: h.ayah_start,
    ayahEnd: h.ayah_end,
    ayahCount: h.ayah_end - h.ayah_start + 1,
    status: h.status,
    date: h.date,
    createdAt: h.created_at,
  };
}

export async function getHafalanByUser(
  userId: number,
  filters?: { surah?: string; status?: string; dateFrom?: string; dateTo?: string }
) {
  let query = supabase
    .from("hafalan")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (filters?.surah) query = query.eq("surah", filters.surah);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("date", filters.dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as HafalanRow[]).map(formatHafalan);
}

export async function insertHafalan(input: {
  userId: number;
  surah: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  status: string;
  date: string;
}) {
  const { data, error } = await supabase
    .from("hafalan")
    .insert({
      user_id: input.userId,
      surah: input.surah,
      surah_number: input.surahNumber,
      ayah_start: input.ayahStart,
      ayah_end: input.ayahEnd,
      status: input.status,
      date: input.date,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return formatHafalan(data as HafalanRow);
}

export async function updateHafalan(
  id: number,
  userId: number,
  updates: {
    surah?: string;
    surahNumber?: number;
    ayahStart?: number;
    ayahEnd?: number;
    status?: string;
    date?: string;
  }
) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.surah !== undefined) dbUpdates["surah"] = updates.surah;
  if (updates.surahNumber !== undefined) dbUpdates["surah_number"] = updates.surahNumber;
  if (updates.ayahStart !== undefined) dbUpdates["ayah_start"] = updates.ayahStart;
  if (updates.ayahEnd !== undefined) dbUpdates["ayah_end"] = updates.ayahEnd;
  if (updates.status !== undefined) dbUpdates["status"] = updates.status;
  if (updates.date !== undefined) dbUpdates["date"] = updates.date;

  const { data, error } = await supabase
    .from("hafalan")
    .update(dbUpdates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return formatHafalan(data as HafalanRow);
}

export async function deleteHafalan(id: number, userId: number): Promise<boolean> {
  const { error, count } = await supabase
    .from("hafalan")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function getUserTotalAyat(userId: number): Promise<number> {
  const { data, error } = await supabase
    .from("hafalan")
    .select("ayah_start, ayah_end")
    .eq("user_id", userId);
  if (error || !data) return 0;
  return data.reduce((sum, h) => sum + (h.ayah_end - h.ayah_start + 1), 0);
}

export async function getWeeklyAyat(userId: number, weekStart: string): Promise<number> {
  const { data, error } = await supabase
    .from("hafalan")
    .select("ayah_start, ayah_end")
    .eq("user_id", userId)
    .gte("date", weekStart);
  if (error || !data) return 0;
  return data.reduce((sum, h) => sum + (h.ayah_end - h.ayah_start + 1), 0);
}

export async function getDailyAyat(userId: number, date: string): Promise<number> {
  const { data, error } = await supabase
    .from("hafalan")
    .select("ayah_start, ayah_end")
    .eq("user_id", userId)
    .eq("date", date);
  if (error || !data) return 0;
  return data.reduce((sum, h) => sum + (h.ayah_end - h.ayah_start + 1), 0);
}

export async function getRecentHafalan(userId: number, limit = 5) {
  const { data, error } = await supabase
    .from("hafalan")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as HafalanRow[]).map(formatHafalan);
}

export async function getAllHafalanRaw(): Promise<Pick<HafalanRow, "user_id" | "ayah_start" | "ayah_end">[]> {
  const { data, error } = await supabase
    .from("hafalan")
    .select("user_id, ayah_start, ayah_end");
  if (error || !data) return [];
  return data;
}
