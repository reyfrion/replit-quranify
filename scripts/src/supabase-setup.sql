-- ============================================================
-- Quranify — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  name               TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  password           TEXT NOT NULL,
  role               TEXT NOT NULL DEFAULT 'member',
  halaqah_group      INTEGER,
  streak             INTEGER NOT NULL DEFAULT 0,
  last_activity_date TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. HALAQAH TABLE
CREATE TABLE IF NOT EXISTS halaqah (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  mentor_id  INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HAFALAN TABLE
CREATE TABLE IF NOT EXISTS hafalan (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah        TEXT NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_start   INTEGER NOT NULL,
  ayah_end     INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'memorized',
  date         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Foreign key: users.halaqah_group → halaqah.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_halaqah'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_halaqah
      FOREIGN KEY (halaqah_group) REFERENCES halaqah(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Disable RLS (server uses service role key which bypasses RLS anyway)
ALTER TABLE users   DISABLE ROW LEVEL SECURITY;
ALTER TABLE halaqah DISABLE ROW LEVEL SECURITY;
ALTER TABLE hafalan  DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED DATA — Demo accounts (password = "password123")
-- ============================================================

INSERT INTO users (name, email, password, role) VALUES
  ('Admin',   'admin@quranify.com',   '394a5d0efe7d79cbcf8a521cc2ef5d43f1c386ce264f6f2e31694ae99f76895f', 'admin'),
  ('Mentor',  'mentor@quranify.com',  '394a5d0efe7d79cbcf8a521cc2ef5d43f1c386ce264f6f2e31694ae99f76895f', 'mentor'),
  ('Zainab',  'zainab@quranify.com',  '394a5d0efe7d79cbcf8a521cc2ef5d43f1c386ce264f6f2e31694ae99f76895f', 'member'),
  ('Omar',    'omar@quranify.com',    '394a5d0efe7d79cbcf8a521cc2ef5d43f1c386ce264f6f2e31694ae99f76895f', 'member'),
  ('Ibrahim', 'ibrahim@quranify.com', '394a5d0efe7d79cbcf8a521cc2ef5d43f1c386ce264f6f2e31694ae99f76895f', 'member')
ON CONFLICT (email) DO NOTHING;

INSERT INTO halaqah (name, mentor_id)
SELECT 'Al-Fatihah Circle', id FROM users WHERE email = 'mentor@quranify.com'
ON CONFLICT DO NOTHING;

INSERT INTO halaqah (name, mentor_id)
SELECT 'Al-Baqarah Circle', id FROM users WHERE email = 'admin@quranify.com'
ON CONFLICT DO NOTHING;

UPDATE users SET halaqah_group = (SELECT id FROM halaqah WHERE name = 'Al-Fatihah Circle')
WHERE email IN ('zainab@quranify.com', 'omar@quranify.com');

UPDATE users SET halaqah_group = (SELECT id FROM halaqah WHERE name = 'Al-Baqarah Circle')
WHERE email = 'ibrahim@quranify.com';

-- Hafalan entries
INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'Al-Fatihah', 1, 1, 7, 'memorized', CURRENT_DATE::TEXT FROM users WHERE email = 'zainab@quranify.com';

INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'Al-Baqarah', 2, 1, 20, 'memorized', (CURRENT_DATE - INTERVAL '1 day')::TEXT FROM users WHERE email = 'zainab@quranify.com';

INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'Al-Baqarah', 2, 21, 40, 'reviewing', (CURRENT_DATE - INTERVAL '2 days')::TEXT FROM users WHERE email = 'zainab@quranify.com';

INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'Al-Fatihah', 1, 1, 7, 'memorized', CURRENT_DATE::TEXT FROM users WHERE email = 'omar@quranify.com';

INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'Al-Ikhlas', 112, 1, 4, 'memorized', (CURRENT_DATE - INTERVAL '1 day')::TEXT FROM users WHERE email = 'omar@quranify.com';

INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'Al-Falaq', 113, 1, 5, 'memorized', (CURRENT_DATE - INTERVAL '2 days')::TEXT FROM users WHERE email = 'omar@quranify.com';

INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'An-Nas', 114, 1, 6, 'reviewing', (CURRENT_DATE - INTERVAL '3 days')::TEXT FROM users WHERE email = 'omar@quranify.com';

INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'Al-Fatihah', 1, 1, 7, 'memorized', (CURRENT_DATE - INTERVAL '1 day')::TEXT FROM users WHERE email = 'ibrahim@quranify.com';

INSERT INTO hafalan (user_id, surah, surah_number, ayah_start, ayah_end, status, date)
SELECT id, 'Al-Baqarah', 2, 1, 50, 'memorized', (CURRENT_DATE - INTERVAL '3 days')::TEXT FROM users WHERE email = 'ibrahim@quranify.com';

-- Update streaks
UPDATE users SET streak = 3, last_activity_date = CURRENT_DATE::TEXT WHERE email = 'zainab@quranify.com';
UPDATE users SET streak = 4, last_activity_date = CURRENT_DATE::TEXT WHERE email = 'omar@quranify.com';
UPDATE users SET streak = 2, last_activity_date = (CURRENT_DATE - INTERVAL '1 day')::TEXT WHERE email = 'ibrahim@quranify.com';
