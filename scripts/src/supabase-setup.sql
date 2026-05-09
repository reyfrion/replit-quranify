-- ============================================================
-- Quranify — Supabase Database Setup
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,
  role       TEXT    NOT NULL DEFAULT 'member',
  halaqah_group       INTEGER,
  streak              INTEGER NOT NULL DEFAULT 0,
  last_activity_date  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. HALAQAH TABLE
CREATE TABLE IF NOT EXISTS halaqah (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT    NOT NULL,
  mentor_id  INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HAFALAN TABLE
CREATE TABLE IF NOT EXISTS hafalan (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah        TEXT    NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_start   INTEGER NOT NULL,
  ayah_end     INTEGER NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'memorized',
  date         TEXT    NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FOREIGN KEY: users.halaqah_group → halaqah.id
--    Added after halaqah table to avoid forward-reference error
ALTER TABLE users
  ADD CONSTRAINT fk_users_halaqah
  FOREIGN KEY (halaqah_group) REFERENCES halaqah(id)
  ON DELETE SET NULL;

-- 5. DISABLE ROW LEVEL SECURITY
--    The API server uses the service role key which bypasses RLS.
--    Enable RLS only if you add Supabase Auth in the future.
ALTER TABLE users   DISABLE ROW LEVEL SECURITY;
ALTER TABLE halaqah DISABLE ROW LEVEL SECURITY;
ALTER TABLE hafalan  DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- OPTIONAL: Seed demo accounts (password = password123)
-- SHA-256 of "password123quranify_salt"
-- ============================================================
-- INSERT INTO users (name, email, password, role) VALUES
--   ('Admin',   'admin@quranify.com',   '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'admin'),
--   ('Mentor',  'mentor@quranify.com',  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'mentor'),
--   ('Zainab',  'zainab@quranify.com',  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'member'),
--   ('Omar',    'omar@quranify.com',    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'member'),
--   ('Ibrahim', 'ibrahim@quranify.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'member');
