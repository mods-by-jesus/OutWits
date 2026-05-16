-- ==========================================
-- ЧАСТЬ 2: Индексы + Realtime
-- Скопируй и выполни в Supabase SQL Editor
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_players_lobby_id ON players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_answers_lobby_question ON answers(lobby_id, question_id);

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
