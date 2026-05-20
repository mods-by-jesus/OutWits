import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { showToast } from '../lib/toast';

const MAX_NICKNAME_LENGTH = 12;
const CODE_LENGTH = 5;

export function Home() {
  const [nickname, setNickname] = useState(() => localStorage.getItem('nickname') || '');
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validate = (requireCode = false): boolean => {
    if (!nickname.trim()) {
      setError('Введите никнейм');
      return false;
    }
    if (nickname.trim().length > MAX_NICKNAME_LENGTH) {
      setError(`Максимум ${MAX_NICKNAME_LENGTH} символов`);
      return false;
    }
    if (requireCode && !code.trim()) {
      setError('Введите код комнаты');
      return false;
    }
    setError('');
    localStorage.setItem('nickname', nickname.trim());
    return true;
  };

  const handleCreateLobby = () => {
    if (!validate()) return;
    setCreating(true);

    socket.emit('create_lobby', { nickname: nickname.trim() }, (response: {
      lobby?: { code: string; status: string };
      player?: { id: string; nickname: string; is_host: boolean; score: number };
      players?: { id: string; nickname: string; is_host: boolean; score: number }[];
      availableCategories?: string[];
      error?: string;
    }) => {
      setCreating(false);

      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      if (response.lobby && response.player) {
        sessionStorage.setItem('playerId', response.player.id);
        navigate(`/lobby/${response.lobby.code}`, {
          state: { 
            lobby: response.lobby, 
            player: response.player, 
            players: response.players,
            availableCategories: response.availableCategories,
          },
        });
      }
    });
  };

  const handleJoinLobby = () => {
    if (!validate(true)) return;
    setJoining(true);

    socket.emit('join_lobby', {
      code: code.trim().toUpperCase(),
      nickname: nickname.trim(),
    }, (response: {
      lobby?: { code: string; status: string };
      player?: { id: string; nickname: string; is_host: boolean; score: number };
      players?: { id: string; nickname: string; is_host: boolean; score: number }[];
      availableCategories?: string[];
      error?: string;
    }) => {
      setJoining(false);

      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      if (response.lobby && response.player) {
        sessionStorage.setItem('playerId', response.player.id);
        navigate(`/lobby/${response.lobby.code}`, {
          state: { 
            lobby: response.lobby, 
            player: response.player, 
            players: response.players,
            availableCategories: response.availableCategories,
          },
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-neutral-900 text-white p-4">
      <h1 className="text-6xl font-black mb-12 tracking-tighter">OUTWITS</h1>

      <div className="w-full max-w-sm space-y-6">
        <div>
          <input
            type="text"
            placeholder="Твой никнейм"
            value={nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            onChange={(e) => { setNickname(e.target.value); setError(''); }}
            className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-xl px-6 py-4 text-xl focus:border-white transition-colors outline-none"
          />
          {error && (
            <p className="text-red-400 text-sm font-semibold mt-2 pl-2">{error}</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              if (nickname.trim()) {
                localStorage.setItem('nickname', nickname.trim());
              }
              navigate('/solo');
            }}
            className="w-full bg-white text-black font-bold py-4 rounded-xl text-xl hover:bg-neutral-200 transition-colors mb-2"
          >
            Одиночная игра
          </button>

          <button
            onClick={handleCreateLobby}
            disabled={creating || joining}
            className="w-full bg-white text-black font-bold py-4 rounded-xl text-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Создаём...' : 'Создать игру'}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
            <div className="relative flex justify-center text-sm uppercase"><span className="bg-neutral-900 px-2 text-neutral-500 font-bold tracking-widest">или</span></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Код"
              value={code}
              maxLength={CODE_LENGTH}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              className="flex-1 bg-neutral-800 border-2 border-neutral-700 rounded-xl px-6 py-4 text-xl focus:border-white transition-colors outline-none uppercase"
            />
            <button
              onClick={handleJoinLobby}
              disabled={creating || joining}
              className="bg-neutral-100 text-black font-bold px-8 rounded-xl text-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? '...' : 'Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
