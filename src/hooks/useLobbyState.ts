import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../lib/socket';
import { showToast } from '../lib/toast';

interface Player {
  id: string;
  nickname: string;
  is_host: boolean;
  score: number;
  streak: number;
  correctCount?: number;
}

interface LocationState {
  lobby?: { code: string; status: string; selectedCategories?: string[]; settings?: { speedBonus: boolean; hotStreak: boolean; questionsCount?: number } };
  player?: Player;
  players?: Player[];
  availableCategories?: string[];
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
  
  const [availableCategories] = useState<string[]>(
    navState?.availableCategories ?? []
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    navState?.lobby?.selectedCategories ?? navState?.availableCategories ?? []
  );
  
  const [settings, setSettings] = useState<{ speedBonus: boolean; hotStreak: boolean; questionsCount?: number }>(
    navState?.lobby?.settings ?? { speedBonus: false, hotStreak: false, questionsCount: 10 }
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

    const onGameStarted = () => {
      // Сервер дал сигнал к началу — переходим на экран игры (вопрос придёт через 3 сек)
      navigate(`/game/${code}`);
    };

    const onCategoriesUpdated = ({ categories }: { categories: string[] }) => {
      setSelectedCategories(categories);
    };

    const onSettingsUpdated = ({ settings: newSettings }: { settings: { speedBonus: boolean; hotStreak: boolean; questionsCount?: number } }) => {
      setSettings(newSettings);
    };

    socket.on('players_updated', onPlayersUpdated);
    socket.on('game_started', onGameStarted);
    socket.on('categories_updated', onCategoriesUpdated);
    socket.on('settings_updated', onSettingsUpdated);

    return () => {
      socket.off('players_updated', onPlayersUpdated);
      socket.off('game_started', onGameStarted);
      socket.off('categories_updated', onCategoriesUpdated);
      socket.off('settings_updated', onSettingsUpdated);
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

  const toggleCategory = useCallback((category: string) => {
    if (!currentPlayer?.is_host) return;

    setSelectedCategories((prev) => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      
      socket.emit('update_categories', { categories: newCategories });
      return newCategories;
    });
  }, [currentPlayer]);

  const toggleSetting = useCallback((key: 'speedBonus' | 'hotStreak') => {
    if (!currentPlayer?.is_host) return;

    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      socket.emit('update_settings', { settings: newSettings });
      return newSettings;
    });
  }, [currentPlayer]);

  const updateSettingValue = useCallback((key: 'questionsCount', value: number) => {
    if (!currentPlayer?.is_host) return;

    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      socket.emit('update_settings', { settings: newSettings });
      return newSettings;
    });
  }, [currentPlayer]);

  return {
    code,
    players,
    currentPlayer,
    loading,
    availableCategories,
    selectedCategories,
    settings,
    toggleCategory,
    toggleSetting,
    updateSettingValue,
    startGame,
    leaveLobby,
    copyCode,
  };
}
