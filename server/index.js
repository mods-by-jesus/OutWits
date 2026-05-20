import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Config ───────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const RESULTS_DELAY = 5000; // мс — пауза перед следующим вопросом
const BETTING_DURATION = 8000; // мс — время на ставку
const MAX_PLAYERS = 5;
const QUESTIONS_PER_GAME = 10;
const HOUSE_SPONSOR_BONUS = 50;

// ─── Load questions ───────────────────────────────────
const questionsDir = join(__dirname, 'questions');
let allQuestions = [];
let availableCategories = [];

function loadQuestions() {
  try {
    const questionFiles = readdirSync(questionsDir).filter(f => f.endsWith('.json'));
    let tempQuestions = [];
    for (const file of questionFiles) {
      const content = JSON.parse(readFileSync(join(questionsDir, file), 'utf-8'));
      tempQuestions = tempQuestions.concat(content);
    }
    allQuestions = tempQuestions;
    availableCategories = [...new Set(allQuestions.map(q => q.category).filter(Boolean))];
    console.log(`[Server] Вопросы загружены: ${allQuestions.length} шт. Категорий: ${availableCategories.length}`);
  } catch (e) {
    console.error('[Server] Ошибка при загрузке вопросов:', e.message);
  }
}

// Initial load
loadQuestions();

// Live-reload questions when files change
import fs from 'fs';
fs.watch(questionsDir, (eventType, filename) => {
  if (filename && filename.endsWith('.json')) {
    console.log(`[Server] Файл ${filename} изменился, перезагружаю базу вопросов...`);
    loadQuestions();
  }
});


// ─── In-memory storage ───────────────────────────────
const lobbies = new Map(); // code -> lobby
const playerSockets = new Map(); // socketId -> { lobbyCode, playerId }

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectQuestions(allowedCategories, limit = 10, usedQuestions = new Set()) {
  let filtered = allQuestions;
  if (allowedCategories && allowedCategories.length > 0) {
    filtered = allQuestions.filter(q => allowedCategories.includes(q.category));
  }
  
  let unused = filtered.filter(q => !usedQuestions.has(`${q.category}-${q.id}`));

  if (unused.length < limit) {
    // Если неиспользованных вопросов меньше, чем нужно — сбрасываем историю
    usedQuestions.clear();
    unused = filtered;
  }

  if (unused.length === 0) {
    unused = allQuestions; // Фолбэк, если выбрали категории без вопросов
  }
  
  const shuffled = shuffleArray(unused);
  const selected = shuffled.slice(0, Math.min(limit, shuffled.length));

  // Записываем выбранные вопросы в использованные
  selected.forEach(q => usedQuestions.add(`${q.category}-${q.id}`));

  return selected;
}

// ─── Express app ──────────────────────────────────────
const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    lobbies: lobbies.size,
    connections: io.engine.clientsCount,
  });
});

app.get('/api/questions', (_req, res) => {
  res.json(allQuestions);
});


const httpServer = createServer(app);

// ─── Socket.IO ────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ─── CREATE LOBBY ─────────────────────────────────
  socket.on('create_lobby', ({ nickname }, callback) => {
    if (!nickname || nickname.trim().length === 0) {
      return callback({ error: 'Введите никнейм' });
    }

    let code = generateCode();
    while (lobbies.has(code)) {
      code = generateCode();
    }

    const playerId = generateId();
    const player = {
      id: playerId,
      nickname: nickname.trim().substring(0, 12),
      is_host: true,
      score: 0,
      streak: 0,
      socketId: socket.id,
    };

    const lobby = {
      code,
      status: 'waiting',
      players: [player],
      selectedCategories: [...availableCategories],
      settings: { speedBonus: false, hotStreak: false, betting: false, questionsCount: 10, roundDuration: 20 },
      usedQuestions: new Set(),
      questions: [],
      currentQuestionIndex: -1,
      answers: new Map(), // questionIndex -> Map(playerId -> answer)
      roundTimer: null,
      roundStartTime: null,
      createdAt: Date.now(),
    };

    lobbies.set(code, lobby);
    playerSockets.set(socket.id, { lobbyCode: code, playerId });

    socket.join(code);
    console.log(`[LOBBY] Created: ${code} by ${player.nickname}`);

    callback({
      lobby: { code, status: lobby.status, selectedCategories: lobby.selectedCategories, settings: lobby.settings },
      player: { id: playerId, nickname: player.nickname, is_host: true, score: 0, streak: 0, correctCount: 0 },
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
      })),
      availableCategories,
    });
  });

  // ─── JOIN LOBBY ───────────────────────────────────
  socket.on('join_lobby', ({ code, nickname }, callback) => {
    if (!nickname || nickname.trim().length === 0) {
      return callback({ error: 'Введите никнейм' });
    }
    if (!code) {
      return callback({ error: 'Введите код комнаты' });
    }

    const upperCode = code.trim().toUpperCase();
    const lobby = lobbies.get(upperCode);

    if (!lobby) {
      return callback({ error: 'Лобби не найдено' });
    }
    if (lobby.status !== 'waiting') {
      return callback({ error: 'Игра уже началась' });
    }
    if (lobby.players.length >= MAX_PLAYERS) {
      return callback({ error: 'Лобби заполнено' });
    }

    const playerId = generateId();
    const player = {
      id: playerId,
      nickname: nickname.trim().substring(0, 12),
      is_host: false,
      score: 0,
      streak: 0,
      correctCount: 0,
      online: true,
      socketId: socket.id,
    };

    lobby.players.push(player);
    playerSockets.set(socket.id, { lobbyCode: upperCode, playerId });

    socket.join(upperCode);
    console.log(`[JOIN] ${player.nickname} joined ${upperCode}`);

    // Оповестить всех в лобби о новом игроке
    io.to(upperCode).emit('players_updated', {
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
      })),
    });

    callback({
      lobby: { code: upperCode, status: lobby.status, selectedCategories: lobby.selectedCategories, settings: lobby.settings },
      player: { id: playerId, nickname: player.nickname, is_host: false, score: 0, streak: 0, correctCount: 0 },
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
      })),
      availableCategories,
    });
  });

  // ─── START GAME ───────────────────────────────────
  socket.on('start_game', (_, callback) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback?.({ error: 'Не в лобби' });

    const lobby = lobbies.get(info.lobbyCode);
    if (!lobby) return callback?.({ error: 'Лобби не найдено' });

    const player = lobby.players.find(p => p.id === info.playerId);
    if (!player?.is_host) return callback?.({ error: 'Только хост может начать' });

    if (lobby.players.length < 2) {
      return callback?.({ error: 'Нужно минимум 2 игрока' });
    }

    if (lobby.selectedCategories.length === 0) {
      return callback?.({ error: 'Выберите хотя бы одну категорию' });
    }

    // Подготовить вопросы
    const limit = lobby.settings?.questionsCount || 10;
    lobby.questions = selectQuestions(lobby.selectedCategories, limit, lobby.usedQuestions);
    lobby.currentQuestionIndex = 0;
    lobby.status = 'playing';
    lobby.answers = new Map();
    lobby.bets = new Map(); // questionIndex -> Map(playerId -> betAmount)
    lobby.pot = 0; // Shared pot for betting
    lobby.playerStats = new Map(); // playerId -> { totalTime, wrongCount, maxStreak, currentStreak }

    console.log(`[GAME] Started in ${info.lobbyCode} with ${lobby.players.length} players`);

    // Сообщаем клиентам, что нужно переключиться на экран игры
    io.to(lobby.code).emit('game_started');

    // Ждём 3 секунды, чтобы все успели загрузить интерфейс, затем шлём первый вопрос
    setTimeout(() => {
      if (lobbies.has(lobby.code)) {
        sendQuestion(lobby);
      }
    }, 3000);
    
    callback?.({ ok: true });
  });

  // ─── UPDATE CATEGORIES ────────────────────────────
  socket.on('update_categories', ({ categories }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;

    const lobby = lobbies.get(info.lobbyCode);
    if (!lobby || lobby.status !== 'waiting') return;

    const player = lobby.players.find(p => p.id === info.playerId);
    if (!player?.is_host) return;

    lobby.selectedCategories = categories;
    
    // Рассылаем всем
    io.to(info.lobbyCode).emit('categories_updated', { categories });
  });

  // ─── UPDATE SETTINGS ────────────────────────────
  socket.on('update_settings', ({ settings }) => {
    const info = playerSockets.get(socket.id);
    if (!info) return;

    const lobby = lobbies.get(info.lobbyCode);
    if (!lobby || lobby.status !== 'waiting') return;

    const player = lobby.players.find(p => p.id === info.playerId);
    if (!player?.is_host) return;

    lobby.settings = { ...lobby.settings, ...settings };
    
    // Рассылаем всем
    io.to(info.lobbyCode).emit('settings_updated', { settings: lobby.settings });
  });

  // ─── SUBMIT ANSWER ────────────────────────────────
  socket.on('submit_answer', ({ answerIndex }, callback) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback?.({ error: 'Не в лобби' });

    const lobby = lobbies.get(info.lobbyCode);
    if (!lobby || lobby.status !== 'playing') return callback?.({ error: 'Игра не идёт' });

    const qi = lobby.currentQuestionIndex;
    const question = lobby.questions[qi];
    if (!question) return callback?.({ error: 'Нет текущего вопроса' });

    // Инициализируем Map ответов для текущего вопроса
    if (!lobby.answers.has(qi)) {
      lobby.answers.set(qi, new Map());
    }

    const roundAnswers = lobby.answers.get(qi);

    // Уже отвечал?
    if (roundAnswers.has(info.playerId)) {
      return callback?.({ error: 'Уже ответил' });
    }

    const isCorrect = answerIndex === question.correct_answer;
    const elapsed = lobby.roundStartTime ? ((Date.now() - lobby.roundStartTime) / 1000).toFixed(1) : '0.0';

    // Track player stats for achievements
    if (!lobby.playerStats) lobby.playerStats = new Map();
    if (!lobby.playerStats.has(info.playerId)) {
      lobby.playerStats.set(info.playerId, { totalTime: 0, wrongCount: 0, maxStreak: 0, currentStreak: 0 });
    }
    const stats = lobby.playerStats.get(info.playerId);
    stats.totalTime += parseFloat(elapsed);
    if (!isCorrect) {
      stats.wrongCount++;
      stats.currentStreak = 0;
    } else {
      stats.currentStreak++;
      if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
    }

    let betResult = 0;

    // Начислить очки
    const player = lobby.players.find(p => p.id === info.playerId);
    if (player) {
      if (isCorrect) {
        let points = 10;
        player.correctCount = (player.correctCount || 0) + 1;
        
        // Speed Bonus
        if (lobby.settings?.speedBonus && lobby.roundStartTime) {
          const elapsed = (Date.now() - lobby.roundStartTime) / 1000;
          const baseRd = lobby.settings?.roundDuration || 20;
          const rd = getDynamicDuration(question, baseRd);
          const remaining = Math.max(0, rd - elapsed);
          points += Math.floor(remaining);
        }

        // Hot Streak
        player.streak = (player.streak || 0) + 1;
        if (lobby.settings?.hotStreak) {
          if (player.streak >= 10) {
            points = Math.floor(points * 2);
          } else if (player.streak >= 3) {
            points = Math.floor(points * 1.5);
          }
        }

        // Betting bonus/penalty will be handled in endRound
        player.score += points;
      } else {
        player.streak = 0;
      }
    }

    roundAnswers.set(info.playerId, {
      playerId: info.playerId,
      answerIndex,
      isCorrect,
      time: parseFloat(elapsed),
      betResult,
    });

    console.log(`[ANSWER] ${info.playerId} answered ${answerIndex} (${isCorrect ? '✓' : '✗'}) in ${info.lobbyCode}`);

    // Отправить обновление количества ответов
    const activePlayers = getActivePlayerCount(lobby);
    io.to(info.lobbyCode).emit('answer_count', {
      count: roundAnswers.size,
      total: activePlayers,
    });

    callback?.({ isCorrect, correctAnswer: question.correct_answer });

    // Все активные игроки ответили?
    if (roundAnswers.size >= activePlayers) {
      endRound(lobby);
    }
  });

  // ─── RETURN TO LOBBY ──────────────────────────────
  socket.on('return_to_lobby', (_, callback) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback?.({ error: 'Не в лобби' });

    const lobby = lobbies.get(info.lobbyCode);
    if (!lobby || lobby.status !== 'finished') return callback?.({ error: 'Игра ещё не закончена' });

    const player = lobby.players.find(p => p.id === info.playerId);
    if (!player?.is_host) return callback?.({ error: 'Только хост может вернуть всех в лобби' });

    // Отменяем удаление лобби
    if (lobby.cleanupTimer) {
      clearTimeout(lobby.cleanupTimer);
      lobby.cleanupTimer = null;
    }

    // Сброс состояния
    lobby.status = 'waiting';
    lobby.questions = [];
    lobby.currentQuestionIndex = -1;
    lobby.answers.clear();
    lobby.bets.clear();
    lobby.pot = 0;
    lobby.playerStats.clear();
    lobby.roundStartTime = null;

    if (lobby.roundTimer) {
      clearTimeout(lobby.roundTimer);
      lobby.roundTimer = null;
    }

    lobby.players.forEach(p => {
      p.score = 0;
      p.streak = 0;
      p.correctCount = 0;
    });

    console.log(`[LOBBY] ${info.lobbyCode} returned to waiting state by ${player.nickname}`);
    io.to(lobby.code).emit('returned_to_lobby', {
      lobby: { code: lobby.code, status: lobby.status, selectedCategories: lobby.selectedCategories, settings: lobby.settings },
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
      })),
      availableCategories,
    });
    callback?.({ ok: true });
  });

  // ─── REJOIN LOBBY ─────────────────────────────────
  socket.on('rejoin_lobby', ({ code, playerId }, callback) => {
    const lobby = lobbies.get(code);
    if (!lobby) return callback?.({ error: 'Лобби не найдено' });
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) return callback?.({ error: 'Игрок не найден' });

    player.online = true;
    player.socketId = socket.id; // КРИТИЧЕСКИ ВАЖНО: обновить socketId при переподключении!
    socket.join(code);
    playerSockets.set(socket.id, { lobbyCode: code, playerId });
    console.log(`[REJOIN] ${player.nickname} reconnected to ${code} with socket ${socket.id}`);
    
    io.to(code).emit('players_updated', {
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
      })),
    });
    
    callback?.({ ok: true });
  });

  // ─── LEAVE LOBBY ──────────────────────────────────
  socket.on('leave_lobby', () => {
    const info = playerSockets.get(socket.id);
    if (info) {
      removePlayerById(info.lobbyCode, info.playerId);
      playerSockets.delete(socket.id);
      socket.leave(info.lobbyCode);
    }
  });

  // ─── DISCONNECT ───────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    const info = playerSockets.get(socket.id);
    if (info) {
      playerSockets.delete(socket.id);
      
      const lobby = lobbies.get(info.lobbyCode);
      if (lobby) {
        const player = lobby.players.find(p => p.id === info.playerId);
        if (player && player.socketId === socket.id) {
          // Даем игроку 3 секунды на переподключение (rejoin) перед тем как объявить его офлайн
          setTimeout(() => {
            const currentLobby = lobbies.get(info.lobbyCode);
            if (!currentLobby) return;
            const currentPlayer = currentLobby.players.find(p => p.id === info.playerId);
            if (!currentPlayer) return;

            // Если за 3 секунды сокет не обновился, значит игрок действительно отключился
            if (currentPlayer.socketId === socket.id) {
              currentPlayer.online = false;
              console.log(`[DISCONNECT] ${currentPlayer.nickname} is confirmed offline in ${info.lobbyCode}`);
              
              io.to(info.lobbyCode).emit('players_updated', {
                players: currentLobby.players.map(p => ({
                  id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
                })),
              });
              
              if (currentLobby.status === 'playing') {
                const activePlayers = getActivePlayerCount(currentLobby);
                const qi = currentLobby.currentQuestionIndex;
                const roundAnswers = currentLobby.answers.get(qi) || new Map();
                
                io.to(info.lobbyCode).emit('answer_count', {
                  count: roundAnswers.size,
                  total: activePlayers,
                });
                
                if (activePlayers > 0 && roundAnswers.size >= activePlayers && !currentLobby._endingRound) {
                  endRound(currentLobby);
                }
              }
            }
          }, 3000);
        }
      }
    }
  });

  // ─── FORCE END ROUND (client fallback) ─────────────
  socket.on('force_end_round', (_, callback) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback?.({ error: 'Не в лобби' });
    const lobby = lobbies.get(info.lobbyCode);
    if (!lobby || lobby.status !== 'playing') return callback?.({ error: 'Игра не идёт' });
    console.log(`[FORCE] Round force-ended by client in ${info.lobbyCode}`);
    endRound(lobby);
    callback?.({ ok: true });
  });

  // ─── SUBMIT BET ─────────────────────────────────────
  socket.on('submit_bet', ({ amount }, callback) => {
    const info = playerSockets.get(socket.id);
    if (!info) return callback?.({ error: 'Не в лобби' });
    const lobby = lobbies.get(info.lobbyCode);
    if (!lobby || lobby.status !== 'playing') return callback?.({ error: 'Игра не идёт' });
    if (!lobby.settings?.betting) return callback?.({ error: 'Ставки выключены' });

    const qi = lobby.currentQuestionIndex;
    if (!lobby.bets) lobby.bets = new Map();
    if (!lobby.bets.has(qi)) lobby.bets.set(qi, new Map());
    const roundBets = lobby.bets.get(qi);

    if (roundBets.has(info.playerId)) return callback?.({ error: 'Уже сделал ставку' });

    const player = lobby.players.find(p => p.id === info.playerId);
    if (!player) return callback?.({ error: 'Игрок не найден' });

    const bet = Math.max(0, Math.min(player.score, parseInt(amount) || 0));
    roundBets.set(info.playerId, bet);
    
    // Deduct immediately and add to pot
    player.score -= bet;
    lobby.pot += bet;

    console.log(`[BET] ${info.playerId} bet ${bet} in ${info.lobbyCode}, pot is now ${lobby.pot}`);

    // Notify all about bet count and new pot
    const activePlayers = getActivePlayerCount(lobby);
    io.to(info.lobbyCode).emit('bet_count', { count: roundBets.size, total: activePlayers, pot: lobby.pot });
    io.to(info.lobbyCode).emit('players_updated', {
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
      })),
    });

    callback?.({ ok: true });

    // If all active players bet, end betting phase early
    if (roundBets.size >= activePlayers && lobby._bettingTimer) {
      clearTimeout(lobby._bettingTimer);
      lobby._bettingTimer = null;
      sendQuestionAfterBetting(lobby);
    }
  });

  // Reaction handler removed
});

// ─── Helper: count connected players ──────────────────
function getActivePlayerCount(lobby) {
  let count = 0;
  for (const p of lobby.players) {
    for (const [, info] of playerSockets) {
      if (info.lobbyCode === lobby.code && info.playerId === p.id) {
        count++;
        break;
      }
    }
  }
  return Math.max(count, 1); // минимум 1 чтобы избежать деления на 0
}

function getDynamicDuration(question, baseDuration) {
  if (!question) return baseDuration;
  const totalLength = question.text.length + question.options.join('').length;
  if (totalLength > 250) {
    return baseDuration + 20; // +20 секунд для очень длинных
  } else if (totalLength > 150) {
    return baseDuration + 10; // +10 секунд для длинных
  }
  return baseDuration;
}

// ─── Game Logic ───────────────────────────────────────

function sendQuestion(lobby) {
  const qi = lobby.currentQuestionIndex;
  const question = lobby.questions[qi];

  if (!question) {
    finishGame(lobby);
    return;
  }

  // Очистить предыдущий таймер
  if (lobby.roundTimer) {
    clearTimeout(lobby.roundTimer);
  }

  // If betting is enabled, start betting phase first
  if (lobby.settings?.betting) {
    // Add house sponsor bonus at start of betting phase
    lobby.pot = (lobby.pot || 0) + HOUSE_SPONSOR_BONUS;

    io.to(lobby.code).emit('betting_phase', {
      category: question.category || 'Общие знания',
      duration: BETTING_DURATION / 1000,
      pot: lobby.pot || 0,
    });

    lobby._bettingTimer = setTimeout(() => {
      lobby._bettingTimer = null;
      sendQuestionAfterBetting(lobby);
    }, BETTING_DURATION);
    return;
  }

  sendQuestionAfterBetting(lobby);
}

function sendQuestionAfterBetting(lobby) {
  const qi = lobby.currentQuestionIndex;
  const question = lobby.questions[qi];

  if (!question) {
    finishGame(lobby);
    return;
  }

  // Shuffle options to have random locations
  const correctOptionText = question.options[question.correct_answer];
  const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
  const newCorrectAnswer = shuffledOptions.indexOf(correctOptionText);

  // Update question with shuffled options so correct answer index is accurate
  lobby.questions[qi] = {
    ...question,
    options: shuffledOptions,
    correct_answer: newCorrectAnswer
  };
  const updatedQuestion = lobby.questions[qi];

  // Отправить вопрос всем
  lobby.roundStartTime = Date.now();
  const baseRd = lobby.settings?.roundDuration || 20;
  const rd = getDynamicDuration(updatedQuestion, baseRd);

  io.to(lobby.code).emit('new_question', {
    questionIndex: qi,
    totalQuestions: lobby.questions.length,
    question: {
      text: updatedQuestion.text,
      options: updatedQuestion.options,
      image: updatedQuestion.image,
    },
    duration: rd,
  });

  // Таймер раунда — принудительно завершить через roundDuration + 2 сек (буфер)
  lobby.roundTimer = setTimeout(() => {
    endRound(lobby);
  }, (rd + 2) * 1000);
}

function endRound(lobby) {
  try {
    // Защита от повторного вызова
    if (lobby._endingRound) return;
    lobby._endingRound = true;

    // Очистить таймер
    if (lobby.roundTimer) {
      clearTimeout(lobby.roundTimer);
      lobby.roundTimer = null;
    }

    const qi = lobby.currentQuestionIndex;
    const question = lobby.questions[qi];
    
    if (!question) {
      lobby._endingRound = false;
      finishGame(lobby);
      return;
    }
    
    const roundAnswers = lobby.answers.get(qi) || new Map();

    // Добавляем неправильные ответы тем, кто не ответил
    lobby.players.forEach(p => {
      if (!roundAnswers.has(p.id)) {
        const baseRd = lobby.settings?.roundDuration || 20;
        const rd = getDynamicDuration(question, baseRd);
        
        roundAnswers.set(p.id, {
          playerId: p.id,
          answerIndex: -1,
          isCorrect: false,
          time: rd,
          betResult: 0,
        });
        p.streak = 0;
      }
    });

    // Handle Shared Pot betting distribution
    if (lobby.settings?.betting) {
      const correctPlayers = Array.from(roundAnswers.values()).filter(a => a.isCorrect).map(a => a.playerId);
      
      // Calculate total bets placed by correct players
      let totalCorrectBets = 0;
      const roundBets = lobby.bets.get(qi);
      correctPlayers.forEach(pid => {
        const pBet = (roundBets && roundBets.get(pid)) || 0;
        totalCorrectBets += pBet;
      });

      if (totalCorrectBets > 0 && lobby.pot > 0) {
        correctPlayers.forEach(pid => {
          const pBet = (roundBets && roundBets.get(pid)) || 0;
          const gain = Math.floor(lobby.pot * (pBet / totalCorrectBets));
          
          const p = lobby.players.find(player => player.id === pid);
          if (p) p.score += gain;
          
          const answer = roundAnswers.get(pid);
          if (answer) answer.betResult = gain;
        });
        console.log(`[POT] Split ${lobby.pot} proportionally among winners. Total correct bets: ${totalCorrectBets}`);
        lobby.pot = 0; // Reset pot after distributing
      } else {
        // Carry over the pot (either no one answered correctly, or only those who bet 0 did)
        console.log(`[POT] No betters won, pot of ${lobby.pot} carries over!`);
        // Set betResult to 0 for everyone since they didn't win anything from the pot
        Array.from(roundAnswers.values()).forEach(a => {
          a.betResult = 0;
        });
      }
    }

    // Отправить результаты раунда
    io.to(lobby.code).emit('round_results', {
      correctAnswer: question.correct_answer,
      answers: Array.from(roundAnswers.values()),
      pot: lobby.pot,
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
      })),
    });

    // Через RESULTS_DELAY — следующий вопрос
    lobby.roundTimer = setTimeout(() => {
      lobby._endingRound = false;
      lobby.currentQuestionIndex++;
      if (lobby.currentQuestionIndex >= lobby.questions.length) {
        finishGame(lobby);
      } else {
        sendQuestion(lobby);
      }
    }, RESULTS_DELAY);
  } catch (err) {
    console.error('[ERROR] endRound crashed:', err);
    lobby._endingRound = false;
    // Попытка восстановить игру
    try {
      lobby.currentQuestionIndex++;
      if (lobby.currentQuestionIndex >= lobby.questions.length) {
        finishGame(lobby);
      } else {
        sendQuestion(lobby);
      }
    } catch (e) {
      console.error('[FATAL] Could not recover:', e);
    }
  }
}

function finishGame(lobby) {
  if (lobby.roundTimer) {
    clearTimeout(lobby.roundTimer);
    lobby.roundTimer = null;
  }

  lobby.status = 'finished';

  const finalPlayers = lobby.players
    .map(p => ({ id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false }))
    .sort((a, b) => b.score - a.score);

  // Calculate achievements
  const achievements = calculateAchievements(lobby);

  io.to(lobby.code).emit('game_finished', { players: finalPlayers, achievements });

  console.log(`[FINISH] Game ended in ${lobby.code}`);

  // Удалить лобби через 90 сек (дать время увидеть результаты + ачивки)
  lobby.cleanupTimer = setTimeout(() => {
    lobbies.delete(lobby.code);
    console.log(`[CLEANUP] Lobby ${lobby.code} removed`);
  }, 90000);
}

function calculateAchievements(lobby) {
  const achievements = [];
  if (!lobby.playerStats || lobby.playerStats.size === 0) return achievements;

  const stats = Array.from(lobby.playerStats.entries()).map(([playerId, s]) => {
    const player = lobby.players.find(p => p.id === playerId);
    const answeredCount = (player?.correctCount || 0) + (s.wrongCount || 0);
    return {
      playerId,
      nickname: player?.nickname || '???',
      avgTime: answeredCount > 0 ? s.totalTime / answeredCount : 999,
      maxStreak: s.maxStreak || 0,
      wrongCount: s.wrongCount || 0,
      correctCount: player?.correctCount || 0,
    };
  });

  if (stats.length === 0) return achievements;

  // ⚡ Шумахер — fastest avg time
  const fastest = stats.reduce((a, b) => a.avgTime < b.avgTime ? a : b);
  if (fastest.avgTime < 900) {
    achievements.push({ emoji: '⚡', title: 'Шумахер', description: 'Самые быстрые ответы', nickname: fastest.nickname, value: fastest.avgTime.toFixed(1) + 'с (ср.)' });
  }

  // 🧊 Хладнокровный — slowest avg time
  const slowest = stats.reduce((a, b) => a.avgTime > b.avgTime ? a : b);
  if (slowest.avgTime < 900 && slowest.playerId !== fastest.playerId) {
    achievements.push({ emoji: '🧊', title: 'Хладнокровный', description: 'Самые обдуманные ответы', nickname: slowest.nickname, value: slowest.avgTime.toFixed(1) + 'с (ср.)' });
  }

  // 🎯 Снайпер — longest streak
  const sniper = stats.reduce((a, b) => a.maxStreak > b.maxStreak ? a : b);
  if (sniper.maxStreak >= 2) {
    achievements.push({ emoji: '🎯', title: 'Снайпер', description: 'Самая длинная серия', nickname: sniper.nickname, value: sniper.maxStreak + ' подряд' });
  }

  // 💀 Страдалец — most wrong answers
  const sufferer = stats.reduce((a, b) => a.wrongCount > b.wrongCount ? a : b);
  if (sufferer.wrongCount >= 2) {
    achievements.push({ emoji: '💀', title: 'Страдалец', description: 'Больше всех ошибок', nickname: sufferer.nickname, value: sufferer.wrongCount + ' ошибок' });
  }

  // 🧠 Всезнайка — most correct answers
  const brain = stats.reduce((a, b) => a.correctCount > b.correctCount ? a : b);
  if (brain.correctCount >= 2) {
    achievements.push({ emoji: '🧠', title: 'Всезнайка', description: 'Максимум правильных', nickname: brain.nickname, value: brain.correctCount + ' верных' });
  }

  return achievements;
}

function removePlayerById(lobbyCode, playerId) {
  const lobby = lobbies.get(lobbyCode);
  if (!lobby) return;

  const playerIndex = lobby.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;

  const wasHost = lobby.players[playerIndex].is_host;
  const playerName = lobby.players[playerIndex].nickname;
  lobby.players.splice(playerIndex, 1);

  console.log(`[LEAVE] ${playerName} permanently left ${lobbyCode} (${lobby.players.length} remaining)`);

  // Если никого не осталось — удалить лобби
  if (lobby.players.length === 0) {
    if (lobby.roundTimer) clearTimeout(lobby.roundTimer);
    lobbies.delete(lobbyCode);
    console.log(`[CLEANUP] Empty lobby ${lobbyCode} removed`);
    return;
  }

  // Если хост ушёл — назначить нового хоста
  if (wasHost && lobby.players.length > 0) {
    lobby.players[0].is_host = true;
    console.log(`[HOST] New host: ${lobby.players[0].nickname} in ${lobbyCode}`);
  }

  // Оповестить оставшихся
  io.to(lobbyCode).emit('players_updated', {
    players: lobby.players.map(p => ({
      id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score, streak: p.streak || 0, correctCount: p.correctCount || 0, online: p.online !== false,
    })),
  });

  // Если шла игра и остался 1 игрок — завершить
  if (lobby.status === 'playing' && lobby.players.length < 2) {
    finishGame(lobby);
  }
}

// ─── Cleanup: удалять старые лобби каждые 5 минут ─────
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 30 * 60 * 1000; // 30 минут

  for (const [code, lobby] of lobbies) {
    if (now - lobby.createdAt > MAX_AGE) {
      if (lobby.roundTimer) clearTimeout(lobby.roundTimer);
      lobbies.delete(code);
      console.log(`[CLEANUP] Stale lobby ${code} removed`);
    }
  }
}, 5 * 60 * 1000);

// ─── Start ────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n  🧠 OutWits Server running on http://localhost:${PORT}`);
  console.log(`  📦 ${allQuestions.length} questions loaded`);
  console.log(`  🎮 Ready for connections!\n`);
});
