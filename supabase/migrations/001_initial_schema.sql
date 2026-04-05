-- ============================
-- 1. themes 테이블
-- ============================
CREATE TABLE IF NOT EXISTS themes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id          TEXT UNIQUE NOT NULL,
  game_type         TEXT NOT NULL CHECK (game_type IN ('2048', 'suika', 'slide_puzzle')),
  title             TEXT,
  visibility        TEXT NOT NULL DEFAULT 'link_only' CHECK (visibility IN ('public', 'link_only')),
  creator_nickname  TEXT,
  play_count        INTEGER NOT NULL DEFAULT 0,
  puzzle_size       INTEGER DEFAULT 3 CHECK (puzzle_size IN (3, 4)),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days'
);

CREATE INDEX idx_themes_short_id ON themes(short_id);
CREATE INDEX idx_themes_game_type_visibility ON themes(game_type, visibility, created_at DESC)
  WHERE visibility = 'public';
CREATE INDEX idx_themes_play_count ON themes(play_count DESC)
  WHERE visibility = 'public';

-- ============================
-- 2. theme_images 테이블
-- ============================
CREATE TABLE IF NOT EXISTS theme_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id    UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  slot_index  INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 15),
  image_path  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(theme_id, slot_index)
);

CREATE INDEX idx_theme_images_theme_id ON theme_images(theme_id, slot_index);

-- ============================
-- 3. game_sessions 테이블
-- ============================
CREATE TABLE IF NOT EXISTS game_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token                TEXT UNIQUE NOT NULL,
  game_type            TEXT NOT NULL,
  theme_id             UUID REFERENCES themes(id) ON DELETE SET NULL,
  started_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at           TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '2 hours',
  snapshots            JSONB NOT NULL DEFAULT '[]',
  is_score_submitted   BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_sessions_token ON game_sessions(token);
CREATE INDEX idx_sessions_expires ON game_sessions(expires_at);

-- ============================
-- 4. scores 테이블
-- ============================
CREATE TABLE IF NOT EXISTS scores (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type            TEXT NOT NULL CHECK (game_type IN ('2048', 'suika', 'slide_puzzle')),
  theme_id             UUID REFERENCES themes(id) ON DELETE SET NULL,
  nickname             TEXT NOT NULL,
  score                INTEGER NOT NULL CHECK (score >= 0),
  metadata             JSONB NOT NULL DEFAULT '{}',
  game_session_token   TEXT NOT NULL,
  checksum             TEXT NOT NULL,
  ip_hash              TEXT,
  is_verified          BOOLEAN NOT NULL DEFAULT false,
  is_hidden            BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scores_leaderboard ON scores(game_type, score DESC, created_at ASC)
  WHERE is_verified = true AND is_hidden = false;
CREATE INDEX idx_scores_theme ON scores(theme_id, game_type, score DESC)
  WHERE is_verified = true AND is_hidden = false;
CREATE INDEX idx_scores_weekly ON scores(game_type, created_at DESC, score DESC)
  WHERE is_verified = true AND is_hidden = false;

-- ============================
-- 5. RLS 활성화
-- ============================
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- themes: public 테마는 누구나 읽기, link_only는 short_id 알면 접근 (API에서 처리)
CREATE POLICY "themes_select" ON themes
  FOR SELECT USING (true);

CREATE POLICY "themes_insert" ON themes
  FOR INSERT WITH CHECK (false);  -- API(service role)만 삽입

CREATE POLICY "themes_update" ON themes
  FOR UPDATE USING (false);       -- API(service role)만 수정

-- theme_images: 누구나 읽기
CREATE POLICY "theme_images_select" ON theme_images
  FOR SELECT USING (true);

CREATE POLICY "theme_images_insert" ON theme_images
  FOR INSERT WITH CHECK (false);  -- API만 삽입

-- game_sessions: 클라이언트 직접 접근 차단
CREATE POLICY "sessions_no_access" ON game_sessions
  FOR ALL USING (false);

-- scores: 검증된 점수만 읽기
CREATE POLICY "scores_select" ON scores
  FOR SELECT USING (is_verified = true AND is_hidden = false);

CREATE POLICY "scores_insert" ON scores
  FOR INSERT WITH CHECK (false);  -- API만 삽입

-- ============================
-- 6. 만료된 세션/테마 정리 함수 (pg_cron 등에서 호출)
-- ============================
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
  DELETE FROM game_sessions WHERE expires_at < now();
  DELETE FROM themes WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
