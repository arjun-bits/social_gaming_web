import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { wsClient } from '../lib/wsClient'
const wordCategories = {
  Standard: [],
  Tech: [],
  Movies: [],
  Food: [],
  Sports: [],
  Science: []
};

export function HostView() {
  const { room } = useParams<{ room: string }>()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState<any>(null)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showNewGameModal, setShowNewGameModal] = useState(false)
  const hasConnected = useRef(false)

  useEffect(() => {
    if (!hasConnected.current) {
      hasConnected.current = true
      wsClient.connect('HOST', 'TV Host', room)
    }
    const unsub = wsClient.subscribe(setGameState)
    return () => unsub()
  }, [room])

  if (!gameState) {
    return (
      <div className="h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-6">
        <div className="w-14 h-14 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-blue" />
        <div className="text-center">
          <p className="text-white font-poppins font-black text-lg tracking-widest animate-pulse">CONNECTING...</p>
          <p className="text-[#6B7280] text-[10px] uppercase tracking-[0.3em] mt-2">Syncing with Arcade Server</p>
        </div>
        <button
          className="mt-2 px-5 py-2 rounded-lg border border-white/10 text-[#6B7280] text-xs font-bold hover:bg-white/5 transition"
          onClick={() => window.location.reload()}
        >↺ Reload</button>
      </div>
    )
  }

  const roomInfo = gameState?.room
  const game = gameState?.game
  const localIp = roomInfo?.localIp

  const effectiveHost = (localIp && window.location.hostname === 'localhost')
    ? `${localIp}:5173`
    : window.location.host
  const joinUrl = `${window.location.protocol}//${effectiveHost}/play?room=${room}`

  const isLobby = !game || game.phase === 'lobby' || game.phase === 'teamSetup'
  const isPlaying = game?.phase === 'playing'
  const isGameOver = game?.phase === 'gameOver'

  const players = roomInfo?.players?.filter((p: any) => p.uuid !== 'HOST') || []

  const onReset = () => {
    wsClient.sendAction({ action: 'resetGame' })
    setShowEndModal(false)
    navigate(`/lobby/${room}`)
  }

  const onNewGame = () => {
    wsClient.sendAction({ action: 'startGame', gameId: 'secret_signals' })
    setShowNewGameModal(false)
  }

  const handleOpenTV = async () => {
    const url = `${window.location.protocol}//${window.location.host}/tv/${room}`
    // @ts-ignore - Presentation API is standard but sometimes missing in older TS definitions
    if (navigator.presentation && navigator.presentation.request) {
      try {
        // @ts-ignore
        const request = new PresentationRequest([url])
        await request.start()
        return
      } catch (err) {
        console.warn('Presentation API failed or was cancelled, falling back to popup', err)
      }
    }
    window.open(url, 'TV_VIEW', 'noopener,width=1920,height=1080')
  }

  return (
    <div className="h-screen bg-[#0A0A0F] flex overflow-hidden">

      {/* ── Left Sidebar ── */}
      <aside className="w-72 shrink-0 bg-[#111118] border-r border-white/5 flex flex-col p-5 gap-5 z-10">
        {/* Logo + back */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#0077FF] flex items-center justify-center text-black font-poppins font-black text-xs">P</div>
            <span className="font-poppins font-black text-lg text-white">Party<span className="text-[#FF007F]">Hub</span></span>
          </div>
          <button
            onClick={() => navigate(`/lobby/${room}`)}
            className="text-[#6B7280] text-[10px] uppercase tracking-widest hover:text-white transition flex items-center gap-1"
          >
            ← Lobby
          </button>
        </div>

        {/* Room QR */}
        <div className="bg-black rounded-2xl p-3 flex flex-col items-center gap-2 border border-white/5">
          <div className="bg-white p-2 rounded-lg"><QRCodeSVG value={joinUrl} size={130} /></div>
          <p className="text-[#6B7280] text-[9px] uppercase tracking-[0.25em]">Scan to Join</p>
          <p className="font-poppins font-black text-2xl text-[#00E5FF] tracking-widest">{room}</p>
        </div>

        {/* Game Status */}
        <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-white/5">
          <p className="text-[9px] uppercase tracking-widest text-[#6B7280] mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]' : isGameOver ? 'bg-yellow-500' : 'bg-[#6B7280]'}`} />
            <span className="text-white text-sm font-bold">
              {isPlaying ? 'Game in Progress' : isGameOver ? 'Game Over' : 'In Lobby'}
            </span>
          </div>
          {isPlaying && (
            <p className="text-[#6B7280] text-[10px] mt-1">
              {game.currentTurn === 'teamA' ? '🔵 Blue' : '🩷 Pink'} Team's Turn
              {game.turnPhase === 'givingClue' ? ' — Spymaster thinking' : ` — ${game.guessesRemaining} guess${game.guessesRemaining !== 1 ? 'es' : ''} left`}
            </p>
          )}
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <p className="text-[9px] uppercase tracking-widest text-[#6B7280] mb-2">Players ({players.length})</p>
          <div className="space-y-1.5">
            {players.map((p: any) => {
              const team = game?.playerTeams?.[p.uuid]
              const isLeader = game?.playerIsLeader?.[p.uuid]
              const teamColor = team === 'teamA' ? '#00E5FF' : team === 'teamB' ? '#FF007F' : '#4B5563'
              return (
                <div key={p.uuid} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? 'bg-green-400' : 'bg-red-500'}`} />
                    <span className="text-white text-sm">{p.nickname}</span>
                  </div>
                  {team && (
                    <div className="flex items-center gap-1">
                      {isLeader && <span className="text-[9px]">👑</span>}
                      <div className="w-2 h-2 rounded-full" style={{ background: teamColor }} />
                    </div>
                  )}
                </div>
              )
            })}
            {players.length === 0 && (
              <p className="text-[#4B5563] text-xs italic px-3">No players yet...</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={handleOpenTV}
            className="w-full py-2.5 rounded-xl border border-white/10 text-[#6B7280] text-sm font-bold hover:bg-white/5 hover:text-white transition flex items-center justify-center gap-2"
          >
            📺 Open TV View
          </button>
          {game && (
            <button
              className="w-full py-2.5 rounded-xl border border-[#FF007F]/20 text-[#FF007F] text-sm font-bold hover:bg-[#FF007F]/5 transition"
              onClick={() => setShowEndModal(true)}
            >
              🛑 End Session
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-poppins font-black text-3xl text-white tracking-tight">
              {isLobby ? 'Lobby Controls' : isGameOver ? 'Game Over' : 'Host Control Panel'}
            </h2>
            <p className="text-[#6B7280] text-xs uppercase tracking-[0.2em] mt-1">Secret Signals · Room {room}</p>
          </div>
          {isPlaying && (
            <div className="flex items-center gap-3">
              <div className="bg-[#00E5FF] text-black font-poppins font-black text-xl w-11 h-11 rounded-xl flex items-center justify-center shadow-blue">{game.teamARemaining}</div>
              <div className="bg-[#FF007F] text-white font-poppins font-black text-xl w-11 h-11 rounded-xl flex items-center justify-center shadow-pink">{game.teamBRemaining}</div>
            </div>
          )}
        </div>

        {/* ── LOBBY CONTROLS ── */}
        {isLobby && (
          <div className="flex flex-col gap-6 animate-slide-up">
            {/* Word Pack */}
            <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
              <h3 className="font-poppins font-bold text-white mb-4">Word Pack</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(wordCategories).map(cat => (
                  <button
                    key={cat}
                    onClick={() => wsClient.sendAction({ action: 'changeCategory', category: cat })}
                    className="py-3 px-4 rounded-xl border-2 font-poppins font-bold text-sm transition-all"
                    style={{
                      borderColor: game?.selectedCategory === cat ? '#00E5FF' : 'rgba(255,255,255,0.1)',
                      color: game?.selectedCategory === cat ? '#00E5FF' : '#6B7280',
                      background: game?.selectedCategory === cat ? 'rgba(0,229,255,0.08)' : 'transparent',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Team overview */}
            <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
              <h3 className="font-poppins font-bold text-white mb-4">Team Setup</h3>
              <div className="grid grid-cols-2 gap-4">
                <TeamSummary title="Blue Squad" team="teamA" game={game} players={roomInfo?.players || []} color="#00E5FF" />
                <TeamSummary title="Pink Squad" team="teamB" game={game} players={roomInfo?.players || []} color="#FF007F" />
              </div>
            </div>

            {/* Start button */}
            <button
              className="py-5 rounded-2xl font-poppins font-black text-2xl text-[#0A0A0F] transition-all active:scale-95 disabled:opacity-25 disabled:grayscale"
              style={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #0077FF 100%)',
                boxShadow: '0 0 40px rgba(0,229,255,0.3)',
              }}
              disabled={players.length < 2}
              onClick={() => {
                wsClient.sendAction({ action: 'startGame', gameId: 'secret_signals' })
              }}
            >
              🚀 START OPERATION
            </button>
            {players.length < 2 && (
              <p className="text-center text-yellow-500 text-sm">⚠️ Need at least 2 players to start</p>
            )}
          </div>
        )}

        {/* ── PLAYING CONTROLS ── */}
        {isPlaying && (
          <div className="flex flex-col gap-6 animate-slide-up">
            {/* Current clue */}
            {game.currentClue && (
              <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
                <p className="text-[9px] uppercase tracking-widest text-[#6B7280] mb-2">Active Signal</p>
                <div className="flex items-center gap-4">
                  <p className="font-roboto font-black text-4xl text-white tracking-widest">{game.currentClue.word}</p>
                  <div className="h-10 w-px bg-white/10" />
                  <p className="font-poppins font-black text-4xl text-[#00E5FF]">
                    {game.currentClue.count === -1 ? '∞' : game.currentClue.count}
                  </p>
                  <p className="text-[#6B7280] text-xs uppercase">guesses</p>
                </div>
              </div>
            )}

            {/* Host override grid — see all cards */}
            <div className="bg-[#111118] rounded-2xl border border-white/5 p-5 flex-1">
              <p className="text-[9px] uppercase tracking-widest text-[#6B7280] mb-3">Board Overview (Host Only)</p>
              <div className="grid grid-cols-5 gap-2">
                {(game.grid || []).map((card: any, idx: number) => {
                  const bgClass = card.isRevealed
                    ? card.team === 'teamA' ? 'bg-[#00E5FF]/30 border-[#00E5FF]/50'
                      : card.team === 'teamB' ? 'bg-[#FF007F]/30 border-[#FF007F]/50'
                        : card.team === 'assassin' ? 'bg-black border-red-600'
                          : 'bg-white/10 border-white/10'
                    : card.team === 'teamA' ? 'bg-[#00E5FF]/10 border-[#00E5FF]/30'
                      : card.team === 'teamB' ? 'bg-[#FF007F]/10 border-[#FF007F]/30'
                        : card.team === 'assassin' ? 'bg-black/80 border-red-900'
                          : 'bg-white/5 border-white/10'
                  const textColor = card.isRevealed ? 'opacity-40' : 'opacity-100'
                  return (
                    <div
                      key={idx}
                      className={`${bgClass} border rounded-lg px-2 py-2 flex items-center justify-center text-center ${textColor} transition-all`}
                    >
                      <span className={`font-roboto font-bold text-[10px] uppercase tracking-wide leading-tight
                        ${card.team === 'teamA' ? 'text-[#00E5FF]' : card.team === 'teamB' ? 'text-[#FF007F]' : card.team === 'assassin' ? 'text-red-500' : 'text-[#6B7280]'}`}
                      >
                        {card.team === 'assassin' && '☠ '}{card.word}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-yellow-500/30 text-yellow-500 font-bold text-sm hover:bg-yellow-500/5 transition"
                onClick={() => wsClient.sendAction({ action: 'hostPassTurn' })}
              >
                ⏭ Force Next Turn
              </button>
              <button
                className="flex-1 py-3 rounded-xl border border-[#FF007F]/30 text-[#FF007F] font-bold text-sm hover:bg-[#FF007F]/5 transition"
                onClick={() => setShowEndModal(true)}
              >
                🛑 Abort Mission
              </button>
            </div>
          </div>
        )}

        {/* ── GAME OVER CONTROLS ── */}
        {isGameOver && (
          <div className="flex flex-col items-center justify-center flex-1 gap-8 animate-pop-in">
            <div className="text-center">
              <p className="text-7xl mb-4">{game.winner === 'teamA' ? '🔵' : '🩷'}</p>
              <h2 className="font-poppins font-black text-5xl text-white">
                {game.winner === 'teamA' ? 'BLUE' : 'PINK'} WINS!
              </h2>
              <p className="text-[#6B7280] mt-2">The mission is complete.</p>
            </div>
            <div className="flex gap-4 w-full max-w-sm">
              <button
                className="flex-1 py-4 rounded-2xl font-poppins font-black text-lg text-[#0A0A0F] transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #00E5FF, #0077FF)', boxShadow: '0 0 30px rgba(0,229,255,0.3)' }}
                onClick={() => setShowNewGameModal(true)}
              >
                🔄 Play Again
              </button>
              <button
                className="flex-1 py-4 rounded-2xl border border-white/10 text-[#6B7280] font-bold text-sm hover:bg-white/5 transition"
                onClick={onReset}
              >
                ↩ Back to Lobby
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── End Game Modal ── */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="bg-[#111118] p-8 rounded-3xl max-w-xs w-full text-center shadow-red border border-[#FF007F]/20 animate-pop-in">
            <h2 className="font-poppins font-black text-2xl text-white mb-2">End Session?</h2>
            <p className="text-[#6B7280] text-sm mb-6">This ends the game for all players and returns to lobby.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl border border-white/10 text-[#6B7280] font-bold text-sm" onClick={() => setShowEndModal(false)}>Cancel</button>
              <button className="flex-1 py-3 rounded-xl bg-[#FF007F] text-white font-bold text-sm" onClick={onReset}>End & Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Game Modal ── */}
      {showNewGameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="bg-[#111118] p-8 rounded-3xl max-w-xs w-full text-center border border-[#00E5FF]/20 animate-pop-in">
            <h2 className="font-poppins font-black text-2xl text-white mb-2">New Game?</h2>
            <p className="text-[#6B7280] text-sm mb-6">Keep teams and start a fresh board with new words.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl border border-white/10 text-[#6B7280] font-bold text-sm" onClick={() => setShowNewGameModal(false)}>Cancel</button>
              <button
                className="flex-1 py-3 rounded-xl font-bold text-sm text-[#0A0A0F]"
                style={{ background: 'linear-gradient(135deg, #00E5FF, #0077FF)' }}
                onClick={onNewGame}
              >
                New Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TeamSummary({ title, team, game, players, color }: any) {
  const teamPlayers = players.filter((p: any) => game?.playerTeams?.[p.uuid] === team)
  const leaderId = Object.keys(game?.playerIsLeader || {}).find(
    (id: string) => game.playerIsLeader[id] && game.playerTeams[id] === team
  )
  const leader = teamPlayers.find((p: any) => p.uuid === leaderId)
  const operatives = teamPlayers.filter((p: any) => p.uuid !== leaderId)

  return (
    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <span className="font-poppins font-bold text-sm text-white">{title}</span>
        <span className="text-[#6B7280] text-xs ml-auto">{teamPlayers.length} players</span>
      </div>
      {leader ? (
        <div className="text-xs mb-2">
          <span className="text-[#6B7280]">Spymaster: </span>
          <span className="font-bold" style={{ color }}>👑 {leader.nickname}</span>
        </div>
      ) : (
        <div className="text-xs text-[#4B5563] mb-2 italic">No spymaster yet</div>
      )}
      {operatives.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {operatives.map((p: any) => (
            <span key={p.uuid} className="text-[10px] text-[#6B7280] bg-white/5 px-2 py-0.5 rounded-full">{p.nickname}</span>
          ))}
        </div>
      )}
    </div>
  )
}
