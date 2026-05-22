import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { wsClient } from '../lib/wsClient'
import { CLIENT_GAME_REGISTRY, getClientGameMeta } from '../games/gameRegistry'
import type { GameClientMeta } from '../games/gameRegistry'

export function LobbyPage() {
  const { room } = useParams<{ room: string }>()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState<any>(null)
  const [selectedGameId, setSelectedGameId] = useState('secret_signals')
  const [wordPack, setWordPack] = useState('Standard')
  const [starting, setStarting] = useState(false)
  const hasConnected = useRef(false)

  useEffect(() => {
    if (!hasConnected.current) {
      hasConnected.current = true
      wsClient.connect('HOST', 'TV Host', room)
    }
    const unsub = wsClient.subscribe(setGameState)
    return () => unsub()
  }, [room])

  // Automatically select the game on load so the backend initializes the engine
  useEffect(() => {
    if (gameState?.room && !gameState?.game && hasConnected.current) {
      wsClient.sendAction({ action: 'selectGame', gameId: selectedGameId })
    }
  }, [gameState?.room, gameState?.game, selectedGameId])

  const roomInfo = gameState?.room
  const game = gameState?.game
  const players = roomInfo?.players?.filter((p: any) => p.uuid !== 'HOST') || []

  const host = window.location.hostname
  const effectiveHost = (roomInfo?.localIp && host === 'localhost')
    ? `${roomInfo.localIp}:5173`
    : window.location.host
  const joinUrl = `${window.location.protocol}//${effectiveHost}/play?room=${room}`

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId)
    wsClient.sendAction({ action: 'selectGame', gameId })
  }

  const handleStartGame = () => {
    setStarting(true)
    wsClient.sendAction({ action: 'startGame', gameId: selectedGameId })
    
    // Open player view in new tab for the host to participate
    const playerUrl = `${window.location.protocol}//${window.location.host}/play?room=${room}&name=Host`
    window.open(playerUrl, '_blank', 'noopener,width=400,height=800')
    
    // Navigate to host control panel after start
    setTimeout(() => navigate(`/host/${room}`), 400)
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

  const selectedMeta = CLIENT_GAME_REGISTRY.find(g => g.gameId === selectedGameId)

  const wordPacks: Record<string, string[]> = {
    secret_signals: ['Standard', 'Tech', 'Movies', 'Food', 'Sports', 'Science'],
  }
  const availablePacks = wordPacks[selectedGameId] || []

  if (!gameState) {
    return (
      <div className="h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-6">
        <div className="w-14 h-14 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-blue" />
        <p className="text-white font-poppins font-black text-lg tracking-widest animate-pulse">CONNECTING...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0A0A0F] flex overflow-hidden" style={{
      background: 'radial-gradient(ellipse at 50% -20%, rgba(0,229,255,0.07) 0%, transparent 60%), #0A0A0F'
    }}>

      {/* ── Left Sidebar ── */}
      <aside className="w-72 shrink-0 bg-[#111118] border-r border-white/5 flex flex-col p-6 gap-6 z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#0077FF] flex items-center justify-center text-black font-poppins font-black text-sm">P</div>
          <span className="font-poppins font-black text-xl text-white">Party<span className="text-[#FF007F]">Hub</span></span>
        </div>

        {/* QR + Room Code */}
        <div className="bg-black rounded-2xl p-4 flex flex-col items-center gap-3 border border-white/5">
          <div className="bg-white p-2.5 rounded-xl">
            <QRCodeSVG value={joinUrl} size={150} />
          </div>
          <div className="text-center">
            <p className="text-[#6B7280] text-[9px] uppercase tracking-[0.3em] mb-1">Scan to Join</p>
            <p className="font-poppins font-black text-3xl text-[#00E5FF] tracking-[0.2em]">{room}</p>
          </div>
        </div>

        {/* Player count */}
        <div className="flex items-center justify-between px-3">
          <div>
            <p className="text-white font-poppins font-black text-2xl">{players.length}</p>
            <p className="text-[#6B7280] text-[10px] uppercase tracking-widest">Players joined</p>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${players.length > 0 ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-[#6B7280]'} animate-pulse`} />
        </div>

        {/* Word Pack (if applicable) */}
        {availablePacks.length > 0 && (
          <div>
            <label className="text-[9px] text-[#6B7280] uppercase tracking-[0.3em] block mb-2">Word Pack</label>
            <select
              className="w-full bg-[#0A0A0F] text-white border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#00E5FF] transition-colors"
              value={wordPack}
              onChange={e => {
                setWordPack(e.target.value)
                wsClient.sendAction({ action: 'changeCategory', category: e.target.value })
              }}
            >
              {availablePacks.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* TV Button */}
        <button
          onClick={handleOpenTV}
          className="w-full py-2.5 rounded-xl border border-white/10 text-[#6B7280] text-sm font-bold hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          📺 Open TV View
        </button>

        {/* Mock players (dev helper) */}
        <button
          onClick={() => wsClient.sendAction({ action: 'addMockPlayers' })}
          className="w-full py-2 rounded-xl border border-white/5 text-[#4B5563] text-xs font-mono hover:bg-white/3 transition"
        >
          + Add Test Players
        </button>
      </aside>

      {/* ── Main Area ── */}
      <main className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between animate-slide-up">
          <div>
            <h1 className="font-poppins font-black text-4xl text-white tracking-tight">Game Lobby</h1>
            <p className="text-[#6B7280] text-sm mt-1 uppercase tracking-[0.2em]">Select a game · Configure · Launch</p>
          </div>
          {players.length >= (selectedMeta?.minPlayers ?? 2) ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Ready to launch</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest">
                Need {Math.max(0, (selectedMeta?.minPlayers ?? 2) - players.length)} more player{(selectedMeta?.minPlayers ?? 2) - players.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* ── Game Selection Grid ── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#6B7280] mb-4">Choose Game</h2>
          <div className="grid grid-cols-3 gap-4">
            {CLIENT_GAME_REGISTRY.map((meta, i) => (
              <GameCard
                key={meta.gameId}
                meta={meta}
                selected={selectedGameId === meta.gameId}
                onSelect={() => !meta.comingSoon && handleSelectGame(meta.gameId)}
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </section>

        {/* ── Player Roster ── */}
        <section className="flex-1">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#6B7280] mb-4">Waiting Room</h2>
          <div className="bg-[#111118] rounded-2xl border border-white/5 p-5 min-h-[140px]">
            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 gap-3 opacity-40">
                <div className="w-10 h-10 border-2 border-dashed border-white/20 rounded-full animate-spin-slow" />
                <p className="text-[#6B7280] text-sm font-inter italic">Waiting for players to scan and join...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 stagger">
                {players.map((p: any) => (
                  <div
                    key={p.uuid}
                    className="player-chip animate-slide-up"
                    style={{ color: p.isConnected ? '#fff' : '#6B7280' }}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${p.isConnected ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500'}`}
                    />
                    {p.nickname}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Launch Button ── */}
        <div className="flex items-center gap-4 pb-2">
          <button
            className="flex-1 py-5 rounded-2xl font-poppins font-black text-2xl text-[#0A0A0F] transition-all active:scale-95 disabled:opacity-20 disabled:grayscale relative overflow-hidden"
            style={{
              background: starting ? '#6B7280' : `linear-gradient(135deg, ${selectedMeta?.accentColor ?? '#00E5FF'} 0%, #0077FF 100%)`,
              boxShadow: starting ? 'none' : `0 0 40px ${selectedMeta?.accentColor ?? '#00E5FF'}44`,
              transition: 'all 0.3s',
            }}
            disabled={players.length < (selectedMeta?.minPlayers ?? 2) || starting}
            onClick={handleStartGame}
          >
            {starting ? 'LAUNCHING...' : `🚀 LAUNCH ${selectedMeta?.displayName.toUpperCase() ?? 'GAME'}`}
          </button>
        </div>
      </main>
    </div>
  )
}

/* ── Game Card Component ── */
function GameCard({ meta, selected, onSelect, style }: {
  meta: GameClientMeta
  selected: boolean
  onSelect: () => void
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`game-card animate-slide-up ${selected ? 'selected' : ''} ${meta.comingSoon ? 'coming-soon' : ''}`}
      style={style}
      onClick={onSelect}
      role="button"
      aria-pressed={selected}
      id={`game-card-${meta.gameId}`}
    >
      {meta.comingSoon && (
        <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/10 rounded-full text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
          Soon
        </div>
      )}
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00E5FF] flex items-center justify-center">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      <div className="text-4xl mb-3">{meta.icon}</div>
      <h3 className="font-poppins font-black text-lg text-white mb-1">{meta.displayName}</h3>
      <p className="text-[#6B7280] text-xs leading-relaxed mb-3">{meta.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {meta.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold"
            style={{
              background: selected ? `${meta.accentColor}22` : 'rgba(255,255,255,0.06)',
              color: selected ? meta.accentColor : '#6B7280',
              border: `1px solid ${selected ? meta.accentColor + '44' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
