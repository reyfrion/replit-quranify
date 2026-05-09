import { supabase, type UserRow } from "../lib/supabase.js";

export async function getUserById(id: number): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as UserRow;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) return null;
  return data as UserRow | null;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<UserRow> {
  const { data, error } = await supabase
    .from("users")
    .insert({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role ?? "member",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as UserRow;
}

export async function updateUser(
  id: number,
  updates: Partial<
    Pick<UserRow, "name" | "email" | "streak" | "last_activity_date" | "halaqah_group">
  >
): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return data as UserRow;
}

export async function getAllUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return [];
  return (data as UserRow[]) ?? [];
}

export async function getUserTotalAyat(userId: number): Promise<number> {
  const { data, error } = await supabase
    .from("hafalan")
    .select("ayah_start, ayah_end")
    .eq("user_id", userId);
  if (error || !data) return 0;
  return data.reduce((sum, h) => sum + (h.ayah_end - h.ayah_start + 1), 0);
}

export async function updateStreak(userId: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const user = await getUserById(userId);
  if (!user) return;

  const lastActivity = user.last_activity_date;
  if (lastActivity === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = lastActivity === yesterdayStr ? user.streak + 1 : 1;
  await updateUser(userId, { streak: newStreak, last_activity_date: today });
}
