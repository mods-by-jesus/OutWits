import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { showToast } from '../lib/toast';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: number;
  category: string;
  image?: string;
}

interface SoloState {
  score: number;
  selectedCategories: string[];
  answeredQuestionKeys: string[];
  currentQuestion: Question | null;
  shuffledOptions: string[];
  correctAnswerIndex: number;
  status: 'setup' | 'playing' | 'answered' | 'completed';
  selectedAnswerIndex: number | null;
}

const getApiUrl = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
  if (!socketUrl) return '';
  return socketUrl.replace(/^ws(s)?:\/\//, 'http$1://');
};

export function Solo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Игровое состояние
  const [score, setScore] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [answeredQuestionKeys, setAnsweredQuestionKeys] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(-1);
  const [status, setStatus] = useState<'setup' | 'playing' | 'answered' | 'completed'>('setup');
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Разблокировка аудиоконтекста
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

  // Синтез звуков (как в мультиплеере)
  const playSound = (type: 'correct' | 'incorrect') => {
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
      } else {
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
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Загрузка всех вопросов с бэкенда
  useEffect(() => {
    fetch(`${getApiUrl()}/api/questions`)
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить вопросы');
        return res.json();
      })
      .then((data: Question[]) => {
        setAllQuestions(data);
        const uniqueCats = Array.from(new Set(data.map((q) => q.category).filter(Boolean)));
        setCategories(uniqueCats);
        
        // Восстановление состояния из localStorage
        const saved = localStorage.getItem('outwits_solo_state');
        if (saved) {
          try {
            const parsed: SoloState = JSON.parse(saved);
            setScore(parsed.score);
            setSelectedCategories(parsed.selectedCategories);
            setAnsweredQuestionKeys(parsed.answeredQuestionKeys || []);
            // Принудительно сбрасываем сессию в настройку категорий при входе
            setStatus('setup');
            setCurrentQuestion(null);
            setShuffledOptions([]);
            setCorrectAnswerIndex(-1);
            setSelectedAnswerIndex(null);

            // Записываем сброшенное состояние сессии
            const updatedState: SoloState = {
              score: parsed.score,
              selectedCategories: parsed.selectedCategories,
              answeredQuestionKeys: parsed.answeredQuestionKeys || [],
              currentQuestion: null,
              shuffledOptions: [],
              correctAnswerIndex: -1,
              status: 'setup',
              selectedAnswerIndex: null
            };
            localStorage.setItem('outwits_solo_state', JSON.stringify(updatedState));
          } catch (e) {
            console.error('Ошибка восстановления состояния:', e);
          }
        } else {
          // Если сохранения нет, выбираем все категории по умолчанию
          setSelectedCategories(uniqueCats);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Ошибка загрузки базы вопросов. Проверьте подключение к серверу.', 'error');
        setLoading(false);
      });
  }, []);

  // Сохранение состояния в localStorage при изменении
  const saveState = (updates: Partial<SoloState>) => {
    const currentState: SoloState = {
      score: updates.score !== undefined ? updates.score : score,
      selectedCategories: updates.selectedCategories !== undefined ? updates.selectedCategories : selectedCategories,
      answeredQuestionKeys: updates.answeredQuestionKeys !== undefined ? updates.answeredQuestionKeys : answeredQuestionKeys,
      currentQuestion: updates.currentQuestion !== undefined ? updates.currentQuestion : currentQuestion,
      shuffledOptions: updates.shuffledOptions !== undefined ? updates.shuffledOptions : shuffledOptions,
      correctAnswerIndex: updates.correctAnswerIndex !== undefined ? updates.correctAnswerIndex : correctAnswerIndex,
      status: updates.status !== undefined ? updates.status : status,
      selectedAnswerIndex: updates.selectedAnswerIndex !== undefined ? updates.selectedAnswerIndex : selectedAnswerIndex,
    };
    localStorage.setItem('outwits_solo_state', JSON.stringify(currentState));
  };

  // Генерация следующего вопроса
  const generateNextQuestion = (
    currentSelectedCats = selectedCategories,
    currentHistory = answeredQuestionKeys
  ) => {
    // Фильтруем вопросы по выбранным категориям
    const pool = allQuestions.filter((q) => currentSelectedCats.includes(q.category));
    
    // Исключаем отвеченные вопросы
    const uncompleted = pool.filter((q) => !currentHistory.includes(`${q.category}-${q.id}`));

    if (uncompleted.length === 0) {
      // Все вопросы в категориях пройдены!
      setStatus('completed');
      setCurrentQuestion(null);
      saveState({ status: 'completed', currentQuestion: null });
      return;
    }

    // Выбираем случайный вопрос
    const nextQ = uncompleted[Math.floor(Math.random() * uncompleted.length)];
    const correctText = nextQ.options[nextQ.correct_answer];
    
    // Перемешиваем варианты ответов
    const options = [...nextQ.options].sort(() => Math.random() - 0.5);
    const correctIdx = options.indexOf(correctText);

    // Обновляем состояние
    setCurrentQuestion(nextQ);
    setShuffledOptions(options);
    setCorrectAnswerIndex(correctIdx);
    setSelectedAnswerIndex(null);
    setStatus('playing');

    saveState({
      currentQuestion: nextQ,
      shuffledOptions: options,
      correctAnswerIndex: correctIdx,
      selectedAnswerIndex: null,
      status: 'playing',
      selectedCategories: currentSelectedCats,
      answeredQuestionKeys: currentHistory,
    });
  };

  // Старт игры после выбора категорий
  const handleStartGame = () => {
    if (selectedCategories.length === 0) {
      showToast('Выберите хотя бы одну категорию!', 'error');
      return;
    }
    generateNextQuestion(selectedCategories, answeredQuestionKeys);
  };

  // Клик по варианту ответа
  const handleAnswerClick = (index: number) => {
    if (status !== 'playing' || !currentQuestion) return;

    const isCorrect = index === correctAnswerIndex;
    let nextScore = score;

    if (isCorrect) {
      nextScore += 1;
      setScore(nextScore);
      playSound('correct');
      
      // Элегантное конфетти из углов
      const colors = ['#a78bfa', '#818cf8', '#6ee7b7', '#fef08a', '#ffffff'];
      confetti({
        particleCount: 25,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: colors,
        disableForReducedMotion: true
      });
      confetti({
        particleCount: 25,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: colors,
        disableForReducedMotion: true
      });
    } else {
      playSound('incorrect');
    }

    // Записываем вопрос в историю
    const nextHistory = [...answeredQuestionKeys, `${currentQuestion.category}-${currentQuestion.id}`];
    setAnsweredQuestionKeys(nextHistory);
    setSelectedAnswerIndex(index);
    setStatus('answered');

    saveState({
      score: nextScore,
      answeredQuestionKeys: nextHistory,
      selectedAnswerIndex: index,
      status: 'answered',
    });
  };

  // Переход к следующему вопросу
  const handleNextQuestion = () => {
    generateNextQuestion();
  };

  // Переключение выбора категории
  const toggleCategory = (cat: string) => {
    let nextCats = [...selectedCategories];
    if (nextCats.includes(cat)) {
      nextCats = nextCats.filter((c) => c !== cat);
    } else {
      nextCats.push(cat);
    }
    setSelectedCategories(nextCats);
    saveState({ selectedCategories: nextCats });
  };

  // Сброс истории ответов в выбранных категориях (сохраняя очки)
  const handleResetHistoryOnly = () => {
    // Удаляем из истории только вопросы выбранных категорий
    const nextHistory = answeredQuestionKeys.filter((key) => {
      const catOfKey = key.split('-')[0];
      return !selectedCategories.includes(catOfKey);
    });
    setAnsweredQuestionKeys(nextHistory);
    setStatus('playing');
    saveState({ answeredQuestionKeys: nextHistory, status: 'playing' });
    generateNextQuestion(selectedCategories, nextHistory);
    showToast('История ответов для выбранных категорий сброшена!', 'success');
  };

  // Полный сброс соло режима
  const handleFullReset = () => {
    if (window.confirm('Вы уверены, что хотите полностью сбросить прогресс и очки?')) {
      localStorage.removeItem('outwits_solo_state');
      setScore(0);
      setAnsweredQuestionKeys([]);
      setCurrentQuestion(null);
      setShuffledOptions([]);
      setCorrectAnswerIndex(-1);
      setSelectedAnswerIndex(null);
      setStatus('setup');
      setSelectedCategories(categories);
      showToast('Прогресс полностью сброшен!', 'success');
    }
  };

  // Выход на главную или к настройкам
  const handleExit = () => {
    if (status !== 'setup') {
      setStatus('setup');
      setCurrentQuestion(null);
      saveState({ status: 'setup', currentQuestion: null });
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-xl font-medium text-neutral-400">Загрузка вопросов...</p>
      </div>
    );
  }

  // Расчет прогресса по выбранным категориям
  const poolCount = allQuestions.filter((q) => selectedCategories.includes(q.category)).length;
  const completedInPool = answeredQuestionKeys.filter((key) => {
    const cat = key.split('-')[0];
    return selectedCategories.includes(cat);
  }).length;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-neutral-900 text-white p-4 overflow-hidden select-none">
      {/* Элегантный фоновый градиент с туманностями */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40"></div>
      
      {/* Главный контейнер */}
      <div className="w-full max-w-2xl bg-neutral-800/40 backdrop-blur-md border border-neutral-700/50 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Хедер страницы */}
        <div className="flex justify-between items-center border-b border-neutral-700/40 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExit}
              className="bg-white text-black font-semibold px-4 py-2 rounded-xl hover:bg-neutral-200 transition-colors shadow-md text-sm md:text-base"
            >
              Выйти
            </button>
            <span className="text-sm md:text-base font-bold text-neutral-400 tracking-wider">
              ОДИНОЧНЫЙ РЕЖИМ
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Счет</div>
              <div className="text-2xl font-black text-white transition-all">
                {score}
              </div>
            </div>
          </div>
        </div>

        {/* ───────── SCREEN 1: SETUP (Выбор категорий) ───────── */}
        {status === 'setup' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-black tracking-tight text-white">Настройка категорий</h2>
              <p className="text-neutral-400 font-medium">Выберите темы, по которым хотите отвечать на вопросы</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const totalInCat = allQuestions.filter((q) => q.category === cat).length;
                const answeredInCat = answeredQuestionKeys.filter((key) => key.startsWith(`${cat}-`)).length;
                const isSelected = selectedCategories.includes(cat);

                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'border-neutral-700/60 bg-neutral-800/40 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-700/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-lg">{cat}</div>
                      <div className="text-xs text-neutral-400 font-semibold">
                        Пройдено: {answeredInCat} / {totalInCat}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-white bg-white' : 'border-neutral-600'
                    }`}>
                      {isSelected && <span className="text-xs text-black font-bold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={handleStartGame}
                className="flex-1 bg-white text-black font-bold py-4 rounded-xl text-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                Начать игру
              </button>
              {answeredQuestionKeys.length > 0 && (
                <button
                  onClick={handleFullReset}
                  className="bg-white text-black font-bold px-6 rounded-xl hover:bg-neutral-200 transition-colors shadow-md"
                  title="Полный сброс"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>
        )}

        {/* ───────── SCREEN 2: GAMEPLAY (Игровой цикл) ───────── */}
        {(status === 'playing' || status === 'answered') && currentQuestion && (
          <div className="space-y-6 animate-fade-in">
            {/* Индикатор темы и прогресса */}
            <div className="flex justify-between items-center text-sm text-neutral-400 font-semibold border-b border-neutral-700/30 pb-2">
              <span className="bg-neutral-700/40 px-3 py-1 rounded-full border border-neutral-600/20 text-white font-bold">
                {currentQuestion.category}
              </span>
              <span>
                Прогресс: {completedInPool} / {poolCount}
              </span>
            </div>

            {/* Картинка вопроса (если есть) */}
            {currentQuestion.image && (
              <div className="flex justify-center w-full max-h-[220px] rounded-xl overflow-hidden bg-neutral-900/50 border border-neutral-700/30 p-2 shadow-inner">
                <img
                  src={currentQuestion.image}
                  alt="Вопрос"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-w-full max-h-[200px] object-contain rounded-lg filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] select-none pointer-events-none"
                />
              </div>
            )}

            {/* Текст вопроса */}
            <h3 className="text-xl md:text-2xl font-bold text-center leading-snug px-2 text-white">
              {currentQuestion.text}
            </h3>

            {/* Варианты ответов */}
            <div className="grid grid-cols-1 gap-3">
              {shuffledOptions.map((opt, idx) => {
                const isSelected = selectedAnswerIndex === idx;
                const isCorrectOption = idx === correctAnswerIndex;
                const isAnswered = status === 'answered';

                let btnStyle = 'border-neutral-700 bg-neutral-800/40 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-700/20';

                if (isAnswered) {
                  if (isCorrectOption) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
                  } else {
                    btnStyle = 'border-neutral-800 bg-neutral-800/20 text-neutral-500 opacity-60 cursor-not-allowed';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerClick(idx)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl border-2 font-bold text-left transition-all relative ${btnStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{opt}</span>
                      {isAnswered && isCorrectOption && (
                        <span className="text-emerald-400 font-extrabold text-xl">✓</span>
                      )}
                      {isAnswered && isSelected && !isCorrectOption && (
                        <span className="text-rose-400 font-extrabold text-xl">✗</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Панель управления снизу */}
            {status === 'answered' && (
              <div className="pt-4 flex gap-3 animate-slide-up">
                <button
                  onClick={handleNextQuestion}
                  className="flex-1 bg-white text-black font-bold py-4 rounded-xl text-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                  Следующий вопрос
                </button>
              </div>
            )}
          </div>
        )}

        {/* ───────── SCREEN 3: COMPLETED (Все вопросы пройдены) ───────── */}
        {status === 'completed' && (
          <div className="space-y-6 text-center py-6 animate-fade-in">
            <div className="inline-block px-6 py-3 bg-white/10 rounded-full border border-white/20 text-xl font-bold tracking-widest text-white mb-2 animate-bounce">
              ПОБЕДА!
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">Все вопросы пройдены!</h2>
              <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
                Вы ответили на все доступные вопросы в выбранных категориях. Вы можете сбросить историю и продолжить копить очки, либо начать с нуля.
              </p>
            </div>

            <div className="border border-neutral-700/40 bg-neutral-800/30 rounded-xl p-4 max-w-sm mx-auto">
              <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Текущий счет</div>
              <div className="text-4xl font-black text-white">{score}</div>
            </div>

            <div className="space-y-3 max-w-md mx-auto pt-4">
              <button
                onClick={handleResetHistoryOnly}
                className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-neutral-200 transition-all shadow-lg"
              >
                Сбросить историю ответов и продолжить
              </button>
              
              <button
                onClick={() => {
                  setStatus('setup');
                  saveState({ status: 'setup' });
                }}
                className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-neutral-200 transition-all shadow-lg"
              >
                Изменить категории
              </button>

              <button
                onClick={handleFullReset}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-md"
              >
                Сбросить всё и начать с нуля
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
