import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const playerId = sessionStorage.getItem('playerId');

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answerCount, setAnswerCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [roundAnswers, setRoundAnswers] = useState<AnswerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayersCount, setActivePlayersCount] = useState(0);

  // Betting state
  const [bettingPhase, setBettingPhase] = useState(false);
  const [bettingCategory, setBettingCategory] = useState('');
  const [, setBettingDuration] = useState(8);
  const [currentBet, setCurrentBet] = useState<number | null>(null);
  const [betCount, setBetCount] = useState(0);
  const [betTotal, setBetTotal] = useState(0);



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

  // Проверка входа
  useEffect(() => {
    if (!code || !playerId) {
      navigate('/');
      return;
    }
  }, [code, playerId, navigate]);

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

    const onBettingPhase = (data: { category: string; duration: number }) => {
      setBettingPhase(true);
      setBettingCategory(data.category);
      setBettingDuration(data.duration);
      setCurrentBet(null);
      setBetCount(0);
      setBetTotal(0);
      setLoading(false);
      resetBettingTimer(data.duration);
    };

    const onBetCount = (data: { count: number; total: number }) => {
      setBetCount(data.count);
      setBetTotal(data.total);
    };

    const onAnswerCount = (data: { count: number; total: number }) => {
      setAnswerCount(data.count);
      setActivePlayersCount(data.total);
    };

    const onRoundResults = (data: {
      correctAnswer: number;
      answers: AnswerInfo[];
      players: Player[];
    }) => {
      setCorrectAnswer(data.correctAnswer);
      setRoundAnswers(data.answers);
      setPlayers(data.players);
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


    socket.on('betting_phase', onBettingPhase);
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
    submitBet,
  };
}
