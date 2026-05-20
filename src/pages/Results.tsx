import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import confetti from 'canvas-confetti';

interface Player {
  id: string;
  nickname: string;
  is_host: boolean;
  score: number;
  correctCount?: number;
}

interface Achievement {
  emoji: string;
  title: string;
  description: string;
  nickname: string;
  value: string;
}

const AUTO_RETURN_SECONDS = 20;

export function Results() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(AUTO_RETURN_SECONDS);
  const intervalRef = useRef<number | null>(null);
  const returnedRef = useRef(false);

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    const stored = sessionStorage.getItem('gameResults');
    if (stored) {
      try {
        setPlayers(JSON.parse(stored));
      } catch {
        navigate('/');
        return;
      }
    } else {
      navigate('/');
      return;
    }

    const storedAchievements = sessionStorage.getItem('gameAchievements');
    if (storedAchievements) {
      try {
        setAchievements(JSON.parse(storedAchievements));
      } catch {
        // ignore
      }
    }

    setLoading(false);

    // Запускаем обратный отсчёт
    setCountdown(AUTO_RETURN_SECONDS);
    intervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [code, navigate]);

  const handleGoHome = useCallback(() => {
    sessionStorage.removeItem('playerId');
    sessionStorage.removeItem('gameResults');
    sessionStorage.removeItem('gameAchievements');
    navigate('/');
  }, [navigate]);

  const handleReturnToLobby = useCallback(() => {
    if (returnedRef.current) return;
    returnedRef.current = true;
    socket.emit('return_to_lobby');
  }, []);

  useEffect(() => {
    const onReturnedToLobby = (data: any) => {
      const playerId = sessionStorage.getItem('playerId');
      sessionStorage.removeItem('gameAchievements');
      navigate(`/lobby/${code}`, {
        state: {
          ...data,
          player: data?.players?.find((p: any) => p.id === playerId)
        }
      });
    };
    socket.on('returned_to_lobby', onReturnedToLobby);
    return () => {
      socket.off('returned_to_lobby', onReturnedToLobby);
    };
  }, [code, navigate]);

  const currentPlayerId = sessionStorage.getItem('playerId');
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.is_host;

  const confettiTriggered = useRef(false);
  useEffect(() => {
    if (!loading && players.length > 0 && !confettiTriggered.current) {
      confettiTriggered.current = true;
      const sorted = [...players].sort((a, b) => b.score - a.score);
      const myRankIndex = sorted.findIndex(p => p.id === currentPlayerId);

      if (myRankIndex === 0) {
        // Золотой кубок победителю: элегантный непрекращающийся 2-секундный фейерверк
        const duration = 2 * 1000;
        const end = Date.now() + duration;
        const colors = ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff', '#eab308'];

        const frame = () => {
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.85 },
            colors: colors,
            disableForReducedMotion: true
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.85 },
            colors: colors,
            disableForReducedMotion: true
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      } else if (myRankIndex === 1 || myRankIndex === 2) {
        // Серебряный или Бронзовый призер: благородные блестки соответствующего цвета
        const colors = myRankIndex === 1
          ? ['#94a3b8', '#cbd5e1', '#e2e8f0', '#ffffff'] // Серебро
          : ['#d97706', '#f59e0b', '#ffedd5', '#ffffff']; // Бронза

        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.75 },
          colors: colors,
          disableForReducedMotion: true
        });
      } else {
        // Обычное завершение игры: аккуратный праздничный салют в честь окончания игры
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff'],
          disableForReducedMotion: true
        });
      }
    }
  }, [loading, players, currentPlayerId]);

  // Автовозврат в лобби когда таймер дошёл до 0
  useEffect(() => {
    if (countdown === 0 && isHost && !returnedRef.current) {
      handleReturnToLobby();
    }
  }, [countdown, isHost, handleReturnToLobby]);

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
                <span className="text-lg font-bold flex items-center gap-2">
                  {player.nickname}
                  {player.correctCount !== undefined && player.correctCount > 0 && (
                    <span className="bg-green-600/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 whitespace-nowrap">
                      ✅ {player.correctCount}
                    </span>
                  )}
                </span>
              </div>
              <span className={`text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {/* Achievements section */}
        {achievements.length > 0 && (
          <div className="mb-10">
            <p className="text-neutral-500 text-center font-bold uppercase tracking-widest text-sm mb-4">
              🏆 Спец-номинации
            </p>
            <div className="grid grid-cols-1 gap-3">
              {achievements.map((ach, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-800/70 border border-neutral-700/50"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="text-3xl w-12 h-12 flex items-center justify-center bg-neutral-700/50 rounded-xl shrink-0">
                    {ach.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white">{ach.title}</span>
                      <span className="text-xs text-neutral-500">{ach.description}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-yellow-400 truncate">{ach.nickname}</span>
                      <span className="text-xs text-neutral-500">{ach.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {isHost ? (
            <button
              onClick={handleReturnToLobby}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-xl hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2"
            >
              Вернуться в лобби <span className="opacity-50">({countdown}s)</span>
            </button>
          ) : (
            <div className="text-center p-4 bg-neutral-900 rounded-xl border border-neutral-800">
              <p className="text-neutral-400 font-medium animate-pulse">Ожидаем хоста... ({countdown}s)</p>
            </div>
          )}
          <button
            onClick={handleGoHome}
            className="w-full bg-white text-black font-bold py-4 rounded-xl text-xl hover:bg-neutral-200 transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}
