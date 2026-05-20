import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
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
    // Betting
    bettingPhase,
    bettingCategory,
    bettingTimeLeft,
    currentBet,
    betCount,
    betTotal,
    pot,
    submitBet,
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

  // Звуковые эффекты
  const playSound = (type: 'correct' | 'incorrect' | 'tick') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      if (type === 'correct') {
        // Приятный восходящий аккорд (C-E-G)
        [523, 659, 784].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + 0.5);
        });
      } else if (type === 'incorrect') {
        // Мягкий нисходящий тон (два тона вниз)
        [400, 300].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.06, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + 0.4);
        });
      } else {
        // Тик обратного отсчёта
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freq = timeLeft === 1 ? 1200 : 800;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Звук при получении результатов раунда
  const prevShowResults = useRef(false);
  useEffect(() => {
    if (showResults && !prevShowResults.current) {
      // Результаты только что появились
      const myAnswer = roundAnswers.find(a => a.playerId === playerId);
      if (myAnswer) {
        if (myAnswer.isCorrect) {
          playSound('correct');
          // Ненавязчивый элегантный салют из углов
          const colors = ['#10b981', '#34d399', '#6ee7b7', '#fef08a', '#ffffff'];
          confetti({
            particleCount: 20,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: colors,
            disableForReducedMotion: true
          });
          confetti({
            particleCount: 20,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: colors,
            disableForReducedMotion: true
          });
        } else {
          playSound('incorrect');
        }
      }
    }
    prevShowResults.current = showResults;
  }, [showResults, roundAnswers, playerId]);

  // Звук обратного отсчёта (последние 5 секунд)
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && !showResults) {
      playSound('tick');
    }
  }, [timeLeft, showResults]);

  // Loading screen
  if (loading || (!question && !bettingPhase)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-neutral-900 text-white space-y-4">
        <div className="text-3xl font-black animate-pulse tracking-widest">ИГРА НАЧИНАЕТСЯ</div>
        <div className="text-neutral-500 font-bold uppercase text-sm tracking-widest">Готовьтесь к первому вопросу...</div>
      </div>
    );
  }

  const currentPlayer = players.find(p => p.id === playerId);
  const myScore = currentPlayer?.score || 0;

  // Render Scoreboard
  const renderScoreboard = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {players
        .sort((a, b) => b.score - a.score)
        .map(p => {
          const myAnswer = roundAnswers.find(a => a.playerId === p.id);
          const betResult = myAnswer?.betResult;
          
          return (
            <div
              key={p.id}
              className={`relative bg-neutral-800/50 p-4 rounded-xl border text-center transition-all ${
                p.id === playerId
                  ? 'border-white/30'
                  : 'border-neutral-700/50'
              }`}
            >
              <div className={`text-xs font-bold uppercase mb-1 truncate ${p.online === false ? 'text-red-500' : 'text-neutral-500'}`}>
                {p.nickname} {p.online === false && '(Офлайн)'}
              </div>
              <div className="text-xl font-black flex items-center justify-center gap-2">
                {p.score}
                {showResults && betResult !== undefined && betResult !== 0 && (
                  <span className={`text-sm font-bold ${betResult > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {betResult > 0 ? `+${betResult}` : betResult}
                  </span>
                )}
              </div>
              {p.streak >= 10 ? (
                <div className="absolute -top-3 -right-3 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded-full border border-purple-400 shadow-lg animate-bounce">
                  🔥 x2
                </div>
              ) : p.streak >= 3 ? (
                <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full border border-red-400 shadow-lg animate-bounce">
                  🔥 x1.5
                </div>
              ) : null}
              {p.correctCount !== undefined && p.correctCount > 0 && (
                <div className="absolute -bottom-3 -left-3 bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-full border border-green-400 shadow-lg">
                  ✅ {p.correctCount}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  // Betting phase screen
  if (bettingPhase) {
    return (
      <div className="flex flex-col items-center min-h-screen w-full bg-neutral-900 text-white p-4">
        <div className="w-full max-w-4xl mt-12">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div className="bg-neutral-800 px-6 py-2 rounded-full border border-neutral-700 font-bold">
              {code}
            </div>
            <div className={`text-4xl font-black transition-colors ${bettingTimeLeft < 3 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
              {bettingTimeLeft}s
            </div>
            <div className="bg-neutral-800 px-6 py-2 rounded-full border border-neutral-700 font-bold">
              {betCount} / {betTotal} ставок
            </div>
          </div>

            <div className="text-center mb-8">
              <div className="inline-block bg-yellow-500/20 text-yellow-400 px-6 py-3 rounded-2xl border-2 border-yellow-500/50 mb-6">
                <span className="text-2xl mr-2">💰</span>
                <span className="text-sm font-bold uppercase tracking-widest mr-2">Банк:</span>
                <span className="text-3xl font-black">{pot}</span>
              </div>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mb-2">
                Вопрос {questionIndex + 1} из {totalQuestions} · Категория
              </p>
              <h2 className="text-3xl font-black text-white mb-2">{bettingCategory}</h2>
              <p className="text-neutral-400 text-sm">Сделай ставку в общий котёл!</p>
              <p className="text-neutral-500 text-xs">Победители поделят банк. Не угадаешь — потеряешь ставку.</p>
            </div>

            <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto mb-8">
              {[0, 25, 50, 100].map(pct => {
                const amount = Math.floor(myScore * (pct / 100));
                const isDisabled = currentBet !== null || (pct > 0 && amount === 0);
                
                return (
                  <button
                    key={pct}
                    onClick={() => submitBet(amount)}
                    disabled={isDisabled}
                    className={`py-6 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${
                      currentBet === amount && currentBet !== null
                        ? 'bg-yellow-500 border-yellow-400 text-black scale-105'
                        : isDisabled
                          ? 'bg-neutral-800 border-neutral-800 text-neutral-600 cursor-default opacity-50'
                          : 'bg-neutral-800 border-neutral-700 text-white hover:border-yellow-500 hover:bg-yellow-500/10'
                    }`}
                  >
                    <span className="text-sm font-bold opacity-70 mb-1">
                      {pct === 0 ? 'Пас' : pct === 100 ? 'Ва-банк' : `${pct}%`}
                    </span>
                    <span className="text-2xl font-black">
                      {amount}
                    </span>
                  </button>
                );
              })}
            </div>

            {currentBet !== null && (
              <div className="text-center animate-pulse mb-8">
                <p className="text-yellow-400 font-bold uppercase tracking-widest text-sm">
                  Ставка {currentBet > 0 ? `${currentBet} очков` : 'пропущена'} · Ожидаем остальных...
                </p>
              </div>
            )}

            {/* Scoreboard in betting phase */}
            <div className="mt-8 border-t border-neutral-800 pt-8">
              {renderScoreboard()}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-neutral-900 text-white p-4 relative overflow-hidden">
      <div className="w-full max-w-4xl mt-12">
        {/* Pot display during question */}
        {pot > 0 && (
          <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl border border-yellow-500/50 flex items-center gap-2 animate-pulse">
            <span>💰</span>
            <span className="font-bold">Банк: {pot}</span>
          </div>
        )}
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
          {question?.image && (
            <div className="mb-6 flex justify-center">
              <img 
                src={question.image} 
                alt="Question visual" 
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="max-h-64 rounded-xl object-contain border-2 border-neutral-700 bg-black/20 p-2 select-none pointer-events-none" 
              />
            </div>
          )}
          <h2 className="text-4xl font-bold leading-tight">{question?.text}</h2>
        </div>

        {/* Answers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {question?.options.map((option, idx) => {
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
                          className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1"
                        >
                          <span>{players.find(p => p.id === a.playerId)?.nickname}</span>
                          {a.time !== undefined && (
                            <span className="text-white/60 text-[10px] ml-1">{a.time}s</span>
                          )}
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
        {/* Players Scoreboard */}
        {renderScoreboard()}
      </div>
    </div>
  );
}
