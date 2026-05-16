import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../lib/socket';
import { showToast } from '../lib/toast';

interface Player {
  id: string;
  nickname: string;
  is_host: boolean;
  score: number;
}

interface LocationState {
  lobby?: { code: string; status: string };
  player?: Player;
  players?: Player[];
}

export function useLobbyState() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const navState = location.state as LocationState | null;

  const [players, setPlayers] = useState<Player[]>(
    navState?.players ?? (navState?.player ? [navState.player] : [])
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(
    navState?.player ?? null
  );
  const [loading, setLoading] = useState(!navState?.lobby);

  const playerId = sessionStorage.getItem('playerId');

  // Если нет данных — редирект
  useEffect(() => {
    if (!code || !playerId) {
      navigate('/');
      return;
    }
    // Если пришли по прямой ссылке без state — на главную
    if (!navState?.lobby) {
      navigate('/');
      return;
    }
    setLoading(false);
  }, [code, playerId, navState, navigate]);

  // Socket.IO подписки
  useEffect(() => {
    if (!code) return;

    const onPlayersUpdated = ({ players: updatedPlayers }: { players: Player[] }) => {
      setPlayers(updatedPlayers);
      const me = updatedPlayers.find(p => p.id === playerId);
      if (me) setCurrentPlayer(me);
    };

    const onNewQuestion = () => {
      // Игра началась — переходим
      navigate(`/game/${code}`);
    };

    socket.on('players_updated', onPlayersUpdated);
    socket.on('new_question', onNewQuestion);

    return () => {
      socket.off('players_updated', onPlayersUpdated);
      socket.off('new_question', onNewQuestion);
    };
  }, [code, playerId, navigate]);

  const startGame = useCallback(() => {
    if (!currentPlayer?.is_host) return;

    socket.emit('start_game', {}, (response: { ok?: boolean; error?: string }) => {
      if (response.error) {
        showToast(response.error, 'error');
      }
    });
  }, [currentPlayer]);

  const leaveLobby = useCallback(() => {
    socket.emit('leave_lobby');
    sessionStorage.removeItem('playerId');
    navigate('/');
  }, [navigate]);

  const copyCode = useCallback(() => {
    if (code) {
      navigator.clipboard.writeText(code);
      showToast('Код скопирован!', 'success');
    }
  }, [code]);

  return {
    code,
    players,
    currentPlayer,
    loading,
    startGame,
    leaveLobby,
    copyCode,
  };
}
