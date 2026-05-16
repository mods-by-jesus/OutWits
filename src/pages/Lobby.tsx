import { useLobbyState } from '../hooks/useLobbyState';

export function Lobby() {
  const {
    code,
    players,
    currentPlayer,
    loading,
    availableCategories,
    selectedCategories,
    toggleCategory,
    startGame,
    leaveLobby,
    copyCode,
  } = useLobbyState();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-neutral-900 text-white p-4">
        <div className="w-full max-w-md bg-neutral-800 rounded-3xl p-8 border border-neutral-700 animate-pulse">
          <div className="h-8 bg-neutral-700 rounded-lg w-1/3 mx-auto mb-6"></div>
          <div className="h-16 bg-neutral-700 rounded-xl mb-6"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-neutral-700/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-neutral-900 text-white p-4">
      <div className="w-full max-w-md bg-neutral-800 rounded-3xl p-8 border border-neutral-700">
        <div className="text-center mb-8">
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm mb-2">Код комнаты</p>
          <h2
            className="text-5xl font-black tracking-tighter text-white cursor-pointer hover:text-neutral-300 transition-colors"
            onClick={copyCode}
            title="Нажми, чтобы скопировать"
          >
            {code}
          </h2>
          <p className="text-neutral-600 text-xs mt-2">Нажми, чтобы скопировать</p>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">
            Игроки ({players.length}/5)
          </p>
          <div className="grid grid-cols-1 gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-neutral-900/50 p-4 rounded-xl flex justify-between items-center border border-neutral-700/50"
              >
                <span className="text-lg font-bold">{player.nickname}</span>
                {player.is_host && (
                  <span className="bg-white text-black text-[10px] font-black px-2 py-1 rounded uppercase">
                    Host
                  </span>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 5 - players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-2 border-dashed border-neutral-800 p-4 rounded-xl flex justify-center items-center"
              >
                <span className="text-neutral-700 font-bold uppercase text-xs tracking-widest">
                  Ожидание...
                </span>
              </div>
            ))}
          </div>
        </div>

        {availableCategories && availableCategories.length > 0 && (
          <div className="space-y-4 mb-8">
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm text-center">
              Категории
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    disabled={!currentPlayer?.is_host}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border-2 ${
                      isSelected
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    } ${!currentPlayer?.is_host && 'cursor-default opacity-80'} ${
                      currentPlayer?.is_host && !isSelected && 'hover:border-neutral-500'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentPlayer?.is_host ? (
          <button
            onClick={startGame}
            disabled={players.length < 2}
            className="w-full bg-white text-black font-bold py-4 rounded-xl text-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {players.length < 2 ? 'Нужно минимум 2 игрока' : 'Начать игру'}
          </button>
        ) : (
          <div className="text-center p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            <p className="text-neutral-400 font-medium">Ждем, пока хост начнет игру...</p>
          </div>
        )}

        <button
          onClick={leaveLobby}
          className="w-full mt-4 text-neutral-500 hover:text-red-400 font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Покинуть лобби
        </button>
      </div>
    </div>
  );
}
