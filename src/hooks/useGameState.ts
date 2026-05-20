import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../lib/socket';
import { useTimer } from './useTimer';
import { showToast } from '../lib/toast';

export interface Player {
  id: string;
  nickname: string;
  is_host: boolean;
  score: number;
  streak: number;
  correctCount?: number;
  online?: boolean;
}

interface Question {
  text: string;
  options: string[];
  image?: string;
}

interface AnswerInfo {
  playerId: string;
  answerIndex: number;
  isCorrect: boolean;
  time?: number;
  betResult?: number;
}

const ROUND_DURATION = 20;

export function useGameState() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const rejoinData = (location.state as any)?.rejoinData;
  const playerId = localStorage.getItem('playerId') || sessionStorage.getItem('playerId');

  const [question, setQuestion] = useState<Question | null>(
    rejoinData?.gameState?.question ?? null
  );
  const [questionIndex, setQuestionIndex] = useState(
    rejoinData?.lobby?.currentQuestionIndex ?? 0
  );
  const [totalQuestions, setTotalQuestions] = useState(
    rejoinData?.lobby?.totalQuestions ?? 0
  );
  const [players, setPlayers] = useState<Player[]>(
    rejoinData?.players ?? []
  );
  const [answerCount, setAnswerCount] = useState(
    rejoinData?.gameState?.answerCount ?? 0
  );
  const [showResults, setShowResults] = useState(
    rejoinData?.gameState?.showResults ?? false
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    rejoinData?.gameState?.selectedAnswer ?? null
  );
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(
    rejoinData?.gameState?.correctAnswer ?? null
  );
  const [roundAnswers, setRoundAnswers] = useState<AnswerInfo[]>(
    rejoinData?.gameState?.roundAnswers ?? []
  );
  const [loading, setLoading] = useState(
    rejoinData ? false : true
  );
  const [activePlayersCount, setActivePlayersCount] = useState(
    rejoinData?.gameState?.activePlayersCount ?? 0
  );

  // Betting state
  const [bettingPhase, setBettingPhase] = useState(
    rejoinData?.gameState?.bettingPhase ?? false
  );
  const [bettingCategory, setBettingCategory] = useState(
    rejoinData?.gameState?.bettingCategory ?? ''
  );
  const [, setBettingDuration] = useState(8);
  const [currentBet, setCurrentBet] = useState<number | null>(
    rejoinData?.gameState?.currentBet ?? null
  );
  const [betCount, setBetCount] = useState(
    rejoinData?.gameState?.betCount ?? 0
  );
  const [betTotal, setBetTotal] = useState(
    rejoinData?.gameState?.activePlayersCount ?? 0
  );
  const [pot, setPot] = useState(
    rejoinData?.gameState?.pot ?? 0
  );

  const handleRoundEnd = useCallback(() => {
    // Таймер клиента истёк — сервер тоже завершит раунд
  }, []);

  const { timeLeft, reset: resetTimer, stop: stopTimer } = useTimer({
    duration: ROUND_DURATION,
    onExpire: handleRoundEnd,
    autoStart: false,
  });

  // Betting timer
  const handleBettingEnd = useCallback(() => {}, []);
  const { timeLeft: bettingTimeLeft, reset: resetBettingTimer, stop: stopBettingTimer } = useTimer({
    duration: 8,
    onExpire: handleBettingEnd,
    autoStart: false,
  });

  // Проверка входа и автореконнект при F5
  useEffect(() => {
    const pId = localStorage.getItem('playerId') || sessionStorage.getItem('playerId');
    if (!code || !pId) {
      navigate('/');
      return;
    }

    if (!question && !rejoinData) {
      setLoading(true);
      socket.emit('rejoin_lobby', { code, playerId: pId }, (response: any) => {
        if (response && response.ok && response.lobby) {
          localStorage.setItem('playerId', pId);
          localStorage.setItem('lastLobbyCode', code);
          sessionStorage.setItem('playerId', pId);
          
          setPlayers(response.players);
          setTotalQuestions(response.lobby.totalQuestions || 10);
          setQuestionIndex(response.lobby.currentQuestionIndex || 0);

          if (response.gameState) {
            const gs = response.gameState;
            if (gs.question) setQuestion(gs.question);
            setQuestionIndex(response.lobby.currentQuestionIndex);
            
            // Восстанавливаем фазу ставок
            setBettingPhase(gs.bettingPhase);
            setBettingCategory(gs.bettingCategory);
            setPot(gs.pot || 0);
            setBetCount(gs.betCount || 0);
            
            // Восстанавливаем ответы
            setSelectedAnswer(gs.selectedAnswer);
            setCurrentBet(gs.currentBet);
            setAnswerCount(gs.answerCount || 0);
            setActivePlayersCount(gs.activePlayersCount || 0);
            
            // Восстанавливаем время
            if (gs.bettingPhase) {
              resetBettingTimer(gs.bettingTimeLeft || 8);
            } else {
              resetTimer(gs.timeLeft || 20);
            }

            // Восстанавливаем результаты раунда, если сейчас фаза показа результатов
            if (gs.showResults) {
              setCorrectAnswer(gs.correctAnswer);
              setRoundAnswers(gs.roundAnswers);
              setShowResults(true);
              stopTimer();
            }
          }
          setLoading(false);
        } else {
          showToast(response?.error || 'Игра не найдена', 'error');
          localStorage.removeItem('lastLobbyCode');
          navigate('/');
        }
      });
    } else if (rejoinData) {
      // Инициализируем таймеры из rejoinData при первом рендере
      const gs = rejoinData.gameState;
      if (gs) {
        if (gs.bettingPhase) {
          resetBettingTimer(gs.bettingTimeLeft || 8);
        } else if (!gs.showResults) {
          resetTimer(gs.timeLeft || 20);
        }
      }
    }
  }, [code, navigate, question, rejoinData, resetTimer, resetBettingTimer, stopTimer]);

  // Socket.IO подписки
  useEffect(() => {
    if (!code) return;

    const onNewQuestion = (data: {
      questionIndex: number;
      totalQuestions: number;
      question: Question;
      duration: number;
    }) => {
      setBettingPhase(false);
      stopBettingTimer();
      setQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setRoundAnswers([]);
      setShowResults(false);
      setAnswerCount(0);
      setCurrentBet(null);
      setLoading(false);
      resetTimer(data.duration);
    };

    const onBettingPhase = (data: { category: string; duration: number; pot?: number }) => {
      setBettingPhase(true);
      setBettingCategory(data.category);
      setBettingDuration(data.duration);
      setCurrentBet(null);
      setBetCount(0);
      setBetTotal(0);
      setPot(data.pot || 0);
      setLoading(false);
      resetBettingTimer(data.duration);
    };

    const onBetCount = (data: { count: number; total: number; pot?: number }) => {
      setBetCount(data.count);
      setBetTotal(data.total);
      if (data.pot !== undefined) setPot(data.pot);
    };

    const onAnswerCount = (data: { count: number; total: number }) => {
      setAnswerCount(data.count);
      setActivePlayersCount(data.total);
    };

    const onRoundResults = (data: {
      correctAnswer: number;
      answers: AnswerInfo[];
      players: Player[];
      pot?: number;
    }) => {
      setCorrectAnswer(data.correctAnswer);
      setRoundAnswers(data.answers);
      setPlayers(data.players);
      if (data.pot !== undefined) setPot(data.pot);
      setShowResults(true);
      stopTimer();
    };

    const onGameFinished = (data: { players: Player[]; achievements?: any[] }) => {
      setPlayers(data.players);
      // Сохраняем результаты и переходим
      sessionStorage.setItem('gameResults', JSON.stringify(data.players));
      if (data.achievements) {
        sessionStorage.setItem('gameAchievements', JSON.stringify(data.achievements));
      }
      navigate(`/results/${code}`);
    };

    const onPlayersUpdated = (data: { players: Player[] }) => {
      setPlayers(data.players);
    };



    socket.on('new_question', onNewQuestion);
    socket.on('betting_phase', onBettingPhase);
    socket.on('bet_count', onBetCount);
    socket.on('answer_count', onAnswerCount);
    socket.on('round_results', onRoundResults);
    socket.on('game_finished', onGameFinished);
    socket.on('players_updated', onPlayersUpdated);

    return () => {
      socket.off('new_question', onNewQuestion);
      socket.off('betting_phase', onBettingPhase);
      socket.off('bet_count', onBetCount);
      socket.off('answer_count', onAnswerCount);
      socket.off('round_results', onRoundResults);
      socket.off('game_finished', onGameFinished);
      socket.off('players_updated', onPlayersUpdated);
    };
  }, [code, navigate, resetTimer, stopTimer, resetBettingTimer, stopBettingTimer]);

  // Fallback: если таймер истёк и через 5 сек нет round_results — просим сервер завершить раунд
  useEffect(() => {
    if (timeLeft !== 0 || showResults || loading || bettingPhase) return;
    const fallback = setTimeout(() => {
      if (!showResults) {
        console.log('[OutWits] Timer expired, forcing round end...');
        socket.emit('force_end_round');
      }
    }, 5000);
    return () => clearTimeout(fallback);
  }, [timeLeft, showResults, loading, bettingPhase]);

  // Submit answer
  const submitAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null || showResults || !question) return;

    setSelectedAnswer(index);

    socket.emit('submit_answer', { answerIndex: index }, (response: {
      isCorrect?: boolean;
      correctAnswer?: number;
      error?: string;
    }) => {
      if (response.error) {
        showToast(response.error, 'error');
      }
    });
  }, [selectedAnswer, showResults, question]);

  // Submit bet
  const submitBet = useCallback((amount: number) => {
    if (currentBet !== null) return;
    setCurrentBet(amount);
    socket.emit('submit_bet', { amount }, (response: { ok?: boolean; error?: string }) => {
      if (response.error) {
        showToast(response.error, 'error');
      }
    });
  }, [currentBet]);

  return {
    code,
    question,
    questionIndex,
    totalQuestions,
    players,
    answerCount,
    totalPlayers: activePlayersCount > 0 ? activePlayersCount : players.length,
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
  };
}
