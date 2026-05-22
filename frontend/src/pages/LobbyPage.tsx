import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Monitor, Play, Settings, Users, ArrowRight, Gamepad2, Info } from 'lucide-react'
import { wsClient } from '../lib/wsClient'
import { hostController } from '../lib/hostController'
import { CLIENT_GAME_REGISTRY, getClientGameMeta } from '../games/gameRegistry'
import { CastModal } from '../components/CastModal'
import { SecretSignalsLobby } from '../games/secret_signals/SecretSignalsLobby'
import type { GameClientMeta } from '../games/gameRegistry'

export function LobbyPage() {
  const { room } = useParams<{ room: string }>()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState<any>(null)
  const [selectedGameId, setSelectedGameId] = useState('secret_signals')
  const [wordPack, setWordPack] = useState('Standard')
  const [starting, setStarting] = useState(false)
  const [showCastModal, setShowCastModal] = useState(false)
  const hasConnected = useRef(false)

  useEffect(() => {
    if (!hasConnected.current) {
      hasConnected.current = true
      wsClient.connect('HOST', 'TV Host', room)
      hostController.initHost(room || 'DEFAULT')
    }
    const unsub = hostController.subscribe(setGameState)
    return () => unsub()
  }, [room])

  // Automatically select the game on load so the backend initializes the engine
  useEffect(() => {
    if (gameState?.room && !gameState?.game && hasConnected.current) {
      hostController.initGame(selectedGameId)
    }
  }, [gameState?.room, gameState?.game, selectedGameId])

  const roomInfo = gameState?.room
  // hostController stores players inside room.players; normalize uuid vs id
  const playersRaw = gameState?.room?.players || gameState?.players || []
  // Normalize p.uuid and p.id since backend uses uuid and hostController uses id
  const normalizedPlayers = playersRaw.map((p: any) => ({
    ...p,
    uuid: p.uuid || p.id
  }))
  const players = normalizedPlayers.filter((p: any) => p.uuid !== 'HOST')
  const game = gameState?.game
  const host = window.location.hostname
  const effectiveHost = (roomInfo?.localIp && host === 'localhost')
    ? `${roomInfo.localIp}:5173`
    : window.location.host
  const joinUrl = `${window.location.protocol}//${effectiveHost}/play?room=${room}`

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId)
    hostController.initGame(gameId)
  }

  const handleStartGame = () => {
    if (selectedGameId === 'secret_signals' && game) {
      const pTeams = game.playerTeams || {}
      const pLeader = game.playerIsLeader || {}
      
      const unassigned = players.some((p: any) => !pTeams[p.uuid])
      if (unassigned) {
        alert("Cannot start: Some players are unassigned. Please use Auto-Assign Teams first.")
        return
      }

      // Use p.uuid consistently (normalized above)
      const teamASpies = players.filter((p: any) => pTeams[p.uuid] === 'teamA' && pLeader[p.uuid])
      const teamBSpies = players.filter((p: any) => pTeams[p.uuid] === 'teamB' && pLeader[p.uuid])
      const teamAOps = players.filter((p: any) => pTeams[p.uuid] === 'teamA' && !pLeader[p.uuid])
      const teamBOps = players.filter((p: any) => pTeams[p.uuid] === 'teamB' && !pLeader[p.uuid])

      if (teamASpies.length !== 1) {
        alert("Cannot start: Blue team must have exactly 1 Spymaster (has " + teamASpies.length + "). Please re-run Auto-Assign.")
        return
      }
      if (teamBSpies.length !== 1) {
        alert("Cannot start: Pink team must have exactly 1 Spymaster (has " + teamBSpies.length + "). Please re-run Auto-Assign.")
        return
      }
      if (teamAOps.length < 1) {
        alert("Cannot start: Blue team must have at least 1 Operative.")
        return
      }
      if (teamBOps.length < 1) {
        alert("Cannot start: Pink team must have at least 1 Operative.")
        return
      }
    }

    setStarting(true)
    hostController.startGame()
    
    // Navigate to host control panel after start
    setTimeout(() => navigate(`/host/${room}`), 400)
  }

  const handleConfigureGame = () => {
    hostController.setGameConfiguring(true)
  }

  const handleBackToGames = () => {
    hostController.setGameConfiguring(false)
  }

  const handleAutoAssign = () => {
    // Use p.uuid (normalized from backend's p.uuid or p.id)
    const playerIds = players.filter((p: any) => p.uuid !== 'HOST').map((p: any) => p.uuid);
    hostController.handleLocalAction({ action: 'autoAssignTeams', playerIds });
  }

  const handleExitSession = () => {
    wsClient.disconnect()
    navigate('/')
  }

  const handleOpenTV = async () => {
    setShowCastModal(true)
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
    <div className="h-screen bg-[#0A0A0F] flex flex-col md:flex-row overflow-hidden" style={{
      background: 'radial-gradient(ellipse at 50% -20%, rgba(0,229,255,0.07) 0%, transparent 60%), #0A0A0F'
    }}>

      {/* ── Left Sidebar ── */}
      <aside className="w-full md:w-72 shrink-0 bg-[#111118] border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6 gap-4 md:gap-6 z-10 overflow-y-auto max-h-[40vh] md:max-h-screen">
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
        {roomInfo?.isConfiguring && availablePacks.length > 0 && (
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
          onClick={() => hostController.addMockPlayers()}
          className="w-full py-2.5 rounded-xl border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-bold hover:bg-[#00E5FF]/10 transition"
        >
          + Add Test Players
        </button>

        {/* Auto Assign Teams */}
        {roomInfo?.isConfiguring && (
          <button
            onClick={handleAutoAssign}
            className="w-full py-2 rounded-xl border border-[#00E5FF]/20 text-[#00E5FF] text-xs font-bold hover:bg-[#00E5FF]/10 transition"
          >
            🎲 Auto-Assign Teams
          </button>
        )}

        {/* Exit Session */}
        <button
          onClick={handleExitSession}
          className="w-full mt-auto py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
        >
          Exit Session
        </button>
      </aside>

      {/* ── Main Area ── */}
      <main className="flex-1 flex flex-col p-4 md:p-8 gap-6 md:gap-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between animate-slide-up">
          <div>
            <h1 className="font-poppins font-black text-3xl md:text-4xl text-white tracking-tight">
              {roomInfo?.isConfiguring ? 'Configure Game' : 'Game Lobby'}
            </h1>
            <p className="text-[#6B7280] text-xs md:text-sm mt-1 uppercase tracking-[0.2em]">
              {roomInfo?.isConfiguring ? 'Assign roles · Prepare' : 'Select a game · Launch'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {roomInfo?.isConfiguring && (
              <button
                onClick={handleBackToGames}
                className="text-[#6B7280] hover:text-white text-sm transition-colors border border-white/10 rounded-lg px-4 py-2"
              >
                ← Back to Games
              </button>
            )}
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
        </div>

        {/* Content Body */}
        {!roomInfo?.isConfiguring ? (
          <>
            {/* ── Game Selection (Hero + Thumbnails) ── */}
            <section className="flex flex-col gap-6">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#6B7280]">Choose Game</h2>
              
              {/* Hero Selected Game */}
              {selectedMeta && (
                <div 
                  className="w-full rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 border border-white/10 relative overflow-hidden animate-slide-up"
                  style={{ background: `radial-gradient(circle at 80% 20%, ${selectedMeta.accentColor}15 0%, #111118 60%)` }}
                >
                  <div className="absolute -top-10 -right-10 text-[180px] opacity-5 select-none pointer-events-none blur-sm">{selectedMeta.icon}</div>
                  
                  <div className="w-24 h-24 shrink-0 rounded-2xl flex items-center justify-center text-6xl shadow-xl border border-white/10"
                       style={{ background: `linear-gradient(135deg, ${selectedMeta.accentColor}22 0%, transparent 100%)` }}>
                    {selectedMeta.icon}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left z-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                      <h3 className="font-poppins font-black text-3xl text-white tracking-tight">{selectedMeta.displayName}</h3>
                      <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold self-center md:self-auto border border-white/20 text-[#E5E7EB] bg-white/5 backdrop-blur-md">
                        {selectedMeta.minPlayers}-{selectedMeta.maxPlayers} Players
                      </span>
                    </div>
                    <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-2xl mb-4">{selectedMeta.description}</p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      {selectedMeta.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold"
                              style={{ background: `${selectedMeta.accentColor}22`, color: selectedMeta.accentColor }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Other Games List */}
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {CLIENT_GAME_REGISTRY.map((meta, i) => (
                  <div
                    key={meta.gameId}
                    onClick={() => !meta.comingSoon && handleSelectGame(meta.gameId)}
                    className={`snap-start shrink-0 w-40 rounded-2xl p-4 border transition-all cursor-pointer flex flex-col items-center text-center gap-2
                      ${selectedGameId === meta.gameId 
                        ? 'border-[#00E5FF] bg-[#00E5FF]/10 scale-100' 
                        : meta.comingSoon 
                          ? 'border-white/5 opacity-40 grayscale cursor-not-allowed scale-95' 
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5 scale-95 hover:scale-100'}`}
                  >
                    <div className="text-3xl mb-1">{meta.icon}</div>
                    <h4 className="font-poppins font-bold text-sm text-white leading-tight">{meta.displayName}</h4>
                    {meta.comingSoon && <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest text-[#6B7280]">Soon</span>}
                  </div>
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
          </>
        ) : (
          <section className="flex-1">
            {selectedGameId === 'secret_signals' && (
              <SecretSignalsLobby
                players={players}
                playerTeams={game?.playerTeams || {}}
                playerIsLeader={game?.playerIsLeader || {}}
                onAutoAssign={handleAutoAssign}
              />
            ) || (
              <div className="flex items-center justify-center h-full text-[#6B7280] italic">
                Game specific lobby coming soon...
              </div>
            )}
          </section>
        )}

        {/* ── Action Button ── */}
        <div className="flex flex-col gap-2 pb-4 mt-auto">
          {!roomInfo?.isConfiguring ? (
            <button
              className="w-full py-4 md:py-5 rounded-2xl font-poppins font-black text-xl md:text-2xl text-[#0A0A0F] transition-all active:scale-95 disabled:opacity-20 disabled:grayscale relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${selectedMeta?.accentColor ?? '#00E5FF'} 0%, #0077FF 100%)`,
                boxShadow: `0 0 40px ${selectedMeta?.accentColor ?? '#00E5FF'}44`,
              }}
              onClick={handleConfigureGame}
            >
              CONFIGURE {selectedMeta?.displayName.toUpperCase() ?? 'GAME'}
            </button>
          ) : (
            <button
              className="w-full py-4 md:py-5 rounded-2xl font-poppins font-black text-xl md:text-2xl text-[#0A0A0F] transition-all active:scale-95 disabled:opacity-20 disabled:grayscale relative overflow-hidden"
              style={{
                background: starting ? '#6B7280' : `linear-gradient(135deg, ${selectedMeta?.accentColor ?? '#00E5FF'} 0%, #0077FF 100%)`,
                boxShadow: starting ? 'none' : `0 0 40px ${selectedMeta?.accentColor ?? '#00E5FF'}44`,
              }}
              disabled={players.length < (selectedMeta?.minPlayers ?? 2) || starting}
              onClick={handleStartGame}
            >
              {starting ? 'LAUNCHING...' : `🚀 LAUNCH ${selectedMeta?.displayName.toUpperCase() ?? 'GAME'}`}
            </button>
          )}
        </div>
      </main>

      {/* ── Cast Modal ── */}
      {showCastModal && (
        <CastModal roomCode={room} onClose={() => setShowCastModal(false)} />
      )}
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
