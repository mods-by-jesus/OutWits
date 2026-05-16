import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  nickname: string;
  is_host: boolean;
  score: number;
}

export function Results() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    // Результаты берём из sessionStorage (сохранены при game_finished)
    const stored = sessionStorage.getItem('gameResults');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPlayers(parsed);
      } catch {
        navigate('/');
        return;
      }
    } else {
      navigate('/');
      return;
    }

    setLoading(false);
  }, [code, navigate]);

  const handleGoHome = () => {
    sessionStorage.removeItem('playerId');
    sessionStorage.removeItem('gameResults');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-neutral-900 text-white">
        <div className="text-xl font-bold text-neutral-500 animate-pulse">Загрузка результатов...</div>
      </div>
    );
  }

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-neutral-900 text-white p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-5xl font-black text-center mb-2 tracking-tighter">Игра окончена!</h1>
        <p className="text-neutral-500 text-center font-bold uppercase tracking-widest text-sm mb-10">
          Финальные результаты
        </p>

        <div className="space-y-3 mb-10">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`
                flex items-center justify-between p-5 rounded-2xl border transition-all
                ${index === 0
                  ? 'bg-yellow-500/10 border-yellow-500/30 scale-[1.02]'
                  : index === 1
                    ? 'bg-neutral-400/10 border-neutral-500/30'
                    : index === 2
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-neutral-800/50 border-neutral-700/50'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl w-10 text-center">{getMedal(index)}</span>
                <span className="text-lg font-bold">{player.nickname}</span>
              </div>
              <span className={`text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                {player.score}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleGoHome}
          className="w-full bg-white text-black font-bold py-4 rounded-xl text-xl hover:bg-neutral-200 transition-colors"
        >
          На главную
        </button>
      </div>
    </div>
  );
}
