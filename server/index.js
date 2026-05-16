import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Config ───────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const ROUND_DURATION = 20; // секунды
const RESULTS_DELAY = 5000; // мс — пауза перед следующим вопросом
const MAX_PLAYERS = 5;
const QUESTIONS_PER_GAME = 10;

// ─── Load questions ───────────────────────────────────
const allQuestions = JSON.parse(
  readFileSync(join(__dirname, 'questions.json'), 'utf-8')
);

// Извлекаем все уникальные категории
const availableCategories = [...new Set(allQuestions.map(q => q.category).filter(Boolean))];


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

function selectQuestions(allowedCategories) {
  let filtered = allQuestions;
  if (allowedCategories && allowedCategories.length > 0) {
    filtered = allQuestions.filter(q => allowedCategories.includes(q.category));
  }
  
  if (filtered.length === 0) {
    filtered = allQuestions; // Фолбэк, если выбрали категории без вопросов
  }
  
  const shuffled = shuffleArray(filtered);
  return shuffled.slice(0, Math.min(QUESTIONS_PER_GAME, shuffled.length));
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
      socketId: socket.id,
    };

    const lobby = {
      code,
      status: 'waiting',
      players: [player],
      selectedCategories: [...availableCategories],
      questions: [],
      currentQuestionIndex: -1,
      answers: new Map(), // questionIndex -> Map(playerId -> answer)
      roundTimer: null,
      createdAt: Date.now(),
    };

    lobbies.set(code, lobby);
    playerSockets.set(socket.id, { lobbyCode: code, playerId });

    socket.join(code);
    console.log(`[LOBBY] Created: ${code} by ${player.nickname}`);

    callback({
      lobby: { code, status: lobby.status, selectedCategories: lobby.selectedCategories },
      player: { id: playerId, nickname: player.nickname, is_host: true, score: 0 },
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score,
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
      socketId: socket.id,
    };

    lobby.players.push(player);
    playerSockets.set(socket.id, { lobbyCode: upperCode, playerId });

    socket.join(upperCode);
    console.log(`[JOIN] ${player.nickname} joined ${upperCode}`);

    // Оповестить всех в лобби о новом игроке
    io.to(upperCode).emit('players_updated', {
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score,
      })),
    });

    callback({
      lobby: { code: upperCode, status: lobby.status, selectedCategories: lobby.selectedCategories },
      player: { id: playerId, nickname: player.nickname, is_host: false, score: 0 },
      players: lobby.players.map(p => ({
        id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score,
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
    lobby.questions = selectQuestions(lobby.selectedCategories);
    lobby.currentQuestionIndex = 0;
    lobby.status = 'playing';
    lobby.answers = new Map();

    console.log(`[GAME] Started in ${info.lobbyCode} with ${lobby.players.length} players`);

    // Отправить первый вопрос
    sendQuestion(lobby);
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

    roundAnswers.set(info.playerId, {
      playerId: info.playerId,
      answerIndex,
      isCorrect,
    });

    // Начислить очки (10 базовых, без таймер-бонуса на сервере — клиент покажет)
    if (isCorrect) {
      const player = lobby.players.find(p => p.id === info.playerId);
      if (player) player.score += 10;
    }

    console.log(`[ANSWER] ${info.playerId} answered ${answerIndex} (${isCorrect ? '✓' : '✗'}) in ${info.lobbyCode}`);

    // Отправить обновление количества ответов
    io.to(info.lobbyCode).emit('answer_count', {
      count: roundAnswers.size,
      total: lobby.players.length,
    });

    callback?.({ isCorrect, correctAnswer: question.correct_answer });

    // Все ответили?
    if (roundAnswers.size >= lobby.players.length) {
      endRound(lobby);
    }
  });

  // ─── LEAVE LOBBY ──────────────────────────────────
  socket.on('leave_lobby', () => {
    removePlayer(socket);
  });

  // ─── DISCONNECT ───────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    removePlayer(socket);
  });
});

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

  // Отправить вопрос всем
  io.to(lobby.code).emit('new_question', {
    questionIndex: qi,
    totalQuestions: lobby.questions.length,
    question: {
      text: question.text,
      options: question.options,
    },
    duration: ROUND_DURATION,
  });

  // Таймер раунда — принудительно завершить через ROUND_DURATION + 2 сек (буфер)
  lobby.roundTimer = setTimeout(() => {
    endRound(lobby);
  }, (ROUND_DURATION + 2) * 1000);
}

function endRound(lobby) {
  // Очистить таймер
  if (lobby.roundTimer) {
    clearTimeout(lobby.roundTimer);
    lobby.roundTimer = null;
  }

  const qi = lobby.currentQuestionIndex;
  const question = lobby.questions[qi];
  const roundAnswers = lobby.answers.get(qi) || new Map();

  // Отправить результаты раунда
  io.to(lobby.code).emit('round_results', {
    correctAnswer: question.correct_answer,
    answers: Array.from(roundAnswers.values()),
    players: lobby.players.map(p => ({
      id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score,
    })),
  });

  // Через RESULTS_DELAY — следующий вопрос
  lobby.roundTimer = setTimeout(() => {
    lobby.currentQuestionIndex++;
    if (lobby.currentQuestionIndex >= lobby.questions.length) {
      finishGame(lobby);
    } else {
      sendQuestion(lobby);
    }
  }, RESULTS_DELAY);
}

function finishGame(lobby) {
  if (lobby.roundTimer) {
    clearTimeout(lobby.roundTimer);
    lobby.roundTimer = null;
  }

  lobby.status = 'finished';

  const finalPlayers = lobby.players
    .map(p => ({ id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score }))
    .sort((a, b) => b.score - a.score);

  io.to(lobby.code).emit('game_finished', { players: finalPlayers });

  console.log(`[FINISH] Game ended in ${lobby.code}`);

  // Удалить лобби через 60 сек (дать время увидеть результаты)
  setTimeout(() => {
    lobbies.delete(lobby.code);
    console.log(`[CLEANUP] Lobby ${lobby.code} removed`);
  }, 60000);
}

function removePlayer(socket) {
  const info = playerSockets.get(socket.id);
  if (!info) return;

  const lobby = lobbies.get(info.lobbyCode);
  playerSockets.delete(socket.id);

  if (!lobby) return;

  const playerIndex = lobby.players.findIndex(p => p.id === info.playerId);
  if (playerIndex === -1) return;

  const wasHost = lobby.players[playerIndex].is_host;
  const playerName = lobby.players[playerIndex].nickname;
  lobby.players.splice(playerIndex, 1);

  console.log(`[LEAVE] ${playerName} left ${info.lobbyCode} (${lobby.players.length} remaining)`);

  socket.leave(info.lobbyCode);

  // Если никого не осталось — удалить лобби
  if (lobby.players.length === 0) {
    if (lobby.roundTimer) clearTimeout(lobby.roundTimer);
    lobbies.delete(info.lobbyCode);
    console.log(`[CLEANUP] Empty lobby ${info.lobbyCode} removed`);
    return;
  }

  // Если хост ушёл — назначить нового хоста
  if (wasHost && lobby.players.length > 0) {
    lobby.players[0].is_host = true;
    console.log(`[HOST] New host: ${lobby.players[0].nickname} in ${info.lobbyCode}`);
  }

  // Оповестить оставшихся
  io.to(info.lobbyCode).emit('players_updated', {
    players: lobby.players.map(p => ({
      id: p.id, nickname: p.nickname, is_host: p.is_host, score: p.score,
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
