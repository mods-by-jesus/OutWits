import { useEffect, useRef } from 'react';
import { useGameState } from '../hooks/useGameState';

export function Game() {
  const {
    code,
    question,
    questionIndex,
    totalQuestions,
    players,
    answerCount,
    totalPlayers,
    timeLeft,
    showResults,
    selectedAnswer,
    correctAnswer,
    roundAnswers,
    loading,
    playerId,
    submitAnswer,
  } = useGameState();

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Разблокировка аудиоконтекста по первому клику/тапу на экран (для Safari/Chrome)
  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch (e) {
        console.log('Unlock audio error:', e);
      }
      // Удаляем слушатели после первой же активности
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && !showResults) {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Возобновляем контекст
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();

        oscillator.type = 'sine';
        // Если осталась 1 секунда, звук будет более высоким
        const freq = timeLeft === 1 ? 1200 : 800;
        oscillator.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);

        oscillator.start();
        oscillator.stop(audioCtxRef.current.currentTime + 0.1);
      } catch (e) {
        console.log('Audio error (autoplay might be blocked):', e);
      }
    }
  }, [timeLeft, showResults]);

  if (loading || !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-neutral-900 text-white space-y-4">
        <div className="text-3xl font-black animate-pulse tracking-widest">ИГРА НАЧИНАЕТСЯ</div>
        <div className="text-neutral-500 font-bold uppercase text-sm tracking-widest">Готовьтесь к первому вопросу...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-neutral-900 text-white p-4">
      <div className="w-full max-w-4xl mt-12">
        {/* Header: Timer and Info */}
        <div className="flex justify-between items-center mb-12">
          <div className="bg-neutral-800 px-6 py-2 rounded-full border border-neutral-700 font-bold">
            {code}
          </div>
          <div className={`text-4xl font-black transition-colors ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
          <div className="bg-neutral-800 px-6 py-2 rounded-full border border-neutral-700 font-bold">
            {answerCount} / {totalPlayers} ответов
          </div>
        </div>

        {/* Question counter */}
        <div className="text-center mb-4">
          <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">
            Вопрос {questionIndex + 1} из {totalQuestions}
          </span>
        </div>

        {/* Question */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold leading-tight">{question.text}</h2>
        </div>

        {/* Answers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {question.options.map((option, idx) => {
            let bgColor = 'bg-neutral-800 border-neutral-700 hover:border-white';
            if (selectedAnswer === idx && !showResults) bgColor = 'bg-blue-600 border-blue-400';
            if (showResults) {
              if (idx === correctAnswer) bgColor = 'bg-green-600 border-green-400';
              else if (selectedAnswer === idx) bgColor = 'bg-red-600 border-red-400';
              else bgColor = 'bg-neutral-800 border-neutral-800 opacity-50';
            }

            return (
              <button
                key={idx}
                onClick={() => submitAnswer(idx)}
                disabled={selectedAnswer !== null || showResults}
                className={`p-8 rounded-2xl border-2 text-xl font-bold transition-all text-left flex justify-between items-center ${bgColor} disabled:cursor-default`}
              >
                <span>{option}</span>
                {showResults && (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {roundAnswers
                      .filter(a => a.answerIndex === idx)
                      .map(a => (
                        <span
                          key={a.playerId}
                          className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                        >
                          {players.find(p => p.id === a.playerId)?.nickname}
                        </span>
                      ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Show results banner */}
        {showResults && (
          <div className="text-center mb-8 animate-pulse">
            <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">
              Следующий вопрос через несколько секунд...
            </p>
          </div>
        )}

        {/* Players Scoreboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {players
            .sort((a, b) => b.score - a.score)
            .map(p => (
              <div
                key={p.id}
                className={`relative bg-neutral-800/50 p-4 rounded-xl border text-center transition-all ${
                  p.id === playerId
                    ? 'border-white/30'
                    : 'border-neutral-700/50'
                }`}
              >
                <div className="text-xs text-neutral-500 font-bold uppercase mb-1 truncate">
                  {p.nickname}
                </div>
                <div className="text-xl font-black">{p.score}</div>
                {p.streak >= 3 && (
                  <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full border border-red-400 shadow-lg animate-bounce">
                    🔥 x1.5
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
