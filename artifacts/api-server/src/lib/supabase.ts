import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}
if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type UserRow = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  halaqah_group: number | null;
  streak: number;
  last_activity_date: string | null;
  created_at: string;
};

export type HalaqahRow = {
  id: number;
  name: string;
  mentor_id: number;
  created_at: string;
};

export type HafalanRow = {
  id: number;
  user_id: number;
  surah: string;
  surah_number: number;
  ayah_start: number;
  ayah_end: number;
  status: string;
  date: string;
  created_at: string;
};
