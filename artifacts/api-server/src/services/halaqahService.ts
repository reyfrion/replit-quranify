import { supabase, type HalaqahRow, type UserRow } from "../lib/supabase.js";

export async function getAllHalaqah(): Promise<HalaqahRow[]> {
  const { data, error } = await supabase
    .from("halaqah")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as HalaqahRow[];
}

export async function getHalaqahById(id: number): Promise<HalaqahRow | null> {
  const { data, error } = await supabase
    .from("halaqah")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as HalaqahRow;
}

export async function createHalaqah(input: {
  name: string;
  mentorId: number;
}): Promise<HalaqahRow> {
  const { data, error } = await supabase
    .from("halaqah")
    .insert({ name: input.name, mentor_id: input.mentorId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HalaqahRow;
}

export async function getMembersByHalaqah(halaqahId: number): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("halaqah_group", halaqahId);
  if (error || !data) return [];
  return data as UserRow[];
}

export async function assignUserToHalaqah(
  userId: number,
  halaqahId: number | null
): Promise<void> {
  await supabase
    .from("users")
    .update({ halaqah_group: halaqahId })
    .eq("id", userId);
}
