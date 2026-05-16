-- ==========================================
-- ЧАСТЬ 3: Функции + RLS
-- Скопируй и выполни в Supabase SQL Editor
-- ==========================================

CREATE OR REPLACE FUNCTION increment_score(p_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE players SET score = score + amount WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select" ON questions FOR SELECT USING (true);
CREATE POLICY "lobbies_select" ON lobbies FOR SELECT USING (true);
CREATE POLICY "lobbies_insert" ON lobbies FOR INSERT WITH CHECK (true);
CREATE POLICY "lobbies_update" ON lobbies FOR UPDATE USING (true);
CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_delete" ON players FOR DELETE USING (true);
CREATE POLICY "answers_select" ON answers FOR SELECT USING (true);
CREATE POLICY "answers_insert" ON answers FOR INSERT WITH CHECK (true);
