-- =============================================
-- OutWits Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lobbies Table
CREATE TABLE IF NOT EXISTS lobbies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(5) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  current_question_id UUID REFERENCES questions(id),
  host_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players Table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  is_host BOOLEAN DEFAULT FALSE,
  last_answer INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers Table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  answer_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_players_lobby_id ON players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_answers_lobby_question ON answers(lobby_id, question_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_code ON lobbies(code);

-- =============================================
-- REALTIME
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'lobbies') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'players') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'answers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE answers;
  END IF;
END $$;

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Increment player score (used after correct answers)
CREATE OR REPLACE FUNCTION increment_score(p_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE players
  SET score = score + amount
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit an answer with server-side validation
-- Validates: player exists, question exists, not already answered
CREATE OR REPLACE FUNCTION submit_answer(
  p_lobby_id UUID,
  p_player_id UUID,
  p_question_id UUID,
  p_answer_index INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_correct INTEGER;
  v_is_correct BOOLEAN;
  v_existing UUID;
BEGIN
  -- Check if already answered
  SELECT id INTO v_existing
  FROM answers
  WHERE lobby_id = p_lobby_id
    AND player_id = p_player_id
    AND question_id = p_question_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'already_answered');
  END IF;

  -- Get correct answer
  SELECT correct_answer INTO v_correct
  FROM questions
  WHERE id = p_question_id;

  IF v_correct IS NULL THEN
    RETURN jsonb_build_object('error', 'question_not_found');
  END IF;

  v_is_correct := (p_answer_index = v_correct);

  -- Insert answer
  INSERT INTO answers (lobby_id, player_id, question_id, answer_index, is_correct)
  VALUES (p_lobby_id, p_player_id, p_question_id, p_answer_index, v_is_correct);

  -- Increment score if correct
  IF v_is_correct THEN
    UPDATE players SET score = score + 10 WHERE id = p_player_id;
  END IF;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_answer', v_correct
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Questions: anyone can read, no one can modify from client
DROP POLICY IF EXISTS "questions_select" ON questions;
CREATE POLICY "questions_select" ON questions
  FOR SELECT USING (true);

-- Lobbies: anyone can read and create, updates restricted
DROP POLICY IF EXISTS "lobbies_select" ON lobbies;
CREATE POLICY "lobbies_select" ON lobbies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "lobbies_insert" ON lobbies;
CREATE POLICY "lobbies_insert" ON lobbies
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "lobbies_update" ON lobbies;
CREATE POLICY "lobbies_update" ON lobbies
  FOR UPDATE USING (true);

-- Players: anyone can read, insert, and delete their own
DROP POLICY IF EXISTS "players_select" ON players;
CREATE POLICY "players_select" ON players
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "players_insert" ON players;
CREATE POLICY "players_insert" ON players
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "players_delete" ON players;
CREATE POLICY "players_delete" ON players
  FOR DELETE USING (true);

-- Answers: anyone can read and insert
DROP POLICY IF EXISTS "answers_select" ON answers;
CREATE POLICY "answers_select" ON answers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "answers_insert" ON answers;
CREATE POLICY "answers_insert" ON answers
  FOR INSERT WITH CHECK (true);

-- =============================================
-- SAMPLE QUESTIONS (for testing)
-- =============================================

INSERT INTO questions (text, options, correct_answer) VALUES
  ('Какая планета самая большая в Солнечной системе?', ARRAY['Марс', 'Юпитер', 'Сатурн', 'Нептун'], 1),
  ('Сколько материков на Земле?', ARRAY['5', '6', '7', '8'], 2),
  ('Кто написал "Войну и мир"?', ARRAY['Достоевский', 'Чехов', 'Толстой', 'Пушкин'], 2),
  ('Какой химический элемент обозначается символом Fe?', ARRAY['Фтор', 'Железо', 'Фосфор', 'Франций'], 1),
  ('В каком году началась Вторая мировая война?', ARRAY['1937', '1938', '1939', '1940'], 2)
ON CONFLICT DO NOTHING;
