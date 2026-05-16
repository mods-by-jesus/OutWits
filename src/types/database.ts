export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: number; // Index 0-3
  created_at: string;
}

export interface Lobby {
  id: string;
  code: string;
  status: 'waiting' | 'playing' | 'results' | 'finished';
  current_question_id: string | null;
  created_at: string;
  host_id: string;
}

export interface Player {
  id: string;
  lobby_id: string;
  nickname: string;
  score: number;
  is_host: boolean;
  last_answer: number | null;
  joined_at: string;
}

export interface Answer {
  id: string;
  lobby_id: string;
  player_id: string;
  question_id: string;
  answer_index: number;
  is_correct: boolean;
  answered_at: string;
}
