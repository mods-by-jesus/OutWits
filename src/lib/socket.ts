import { io, Socket } from 'socket.io-client';

// В dev-режиме Vite проксирует /socket.io на localhost:3001
// В проде — сервер и клиент на одном домене
const URL = import.meta.env.VITE_SOCKET_URL || '';

export const socket: Socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 10000,
});

// Логирование для отладки
socket.on('connect', () => {
  console.log('[OutWits] Socket connected:', socket.id);
  
  const playerId = sessionStorage.getItem('playerId');
  const code = window.location.pathname.split('/').pop();
  
  if (playerId && code && code.length === 5) {
    socket.emit('rejoin_lobby', { code, playerId });
  }
});

socket.on('disconnect', (reason) => {
  console.log('[OutWits] Socket disconnected:', reason);
});

socket.on('connect_error', (err) => {
  console.error('[OutWits] Socket connection error:', err.message);
});
