import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { wsClient } from '../lib/wsClient'

/* ── helpers ── */
const TEAM_BG: Record<string, string> = {
  teamA: 'bg-[#00E5FF] text-[#121212]',
  teamB: 'bg-[#FF007F] text-white',
  neutral: 'bg-[#6B7280] text-white',
  assassin: 'bg-black text-white border-2 border-red-600',
}
const HOVER_BORDER: Record<string, string> = {
  teamA: 'border-[#00E5FF] neon-blue',
  teamB: 'border-[#FF007F] neon-pink',
}
const countLabel = (n: number | string) => n === -1 || n === '∞' ? '∞' : String(n)

export function HostView() {
  const { room } = useParams()
  const [gameState, setGameState] = useState<any>(null)
  const [showCastModal, setShowCastModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [presentationConnection, setPresentationConnection] = useState<any>(null)

  /* clue reveal overlay */
  const prevClueKey = useRef('')
  const [clueOverlay, setClueOverlay] = useState<{ word: string; count: string } | null>(null)
  const [clueOverlayExiting, setClueOverlayExiting] = useState(false)

  /* card flip tracking */
  const prevRevealed = useRef<Set<number>>(new Set())
  const [flipping, setFlipping] = useState<Set<number>>(new Set())

  useEffect(() => {
    wsClient.connect('HOST', 'HOST', room)
    const unsub = wsClient.subscribe(setGameState)
    return () => unsub()
  }, [room])

  /* clue overlay effect */
  useEffect(() => {
    const clue = gameState?.game?.currentClue
    if (!clue) return
    const key = `${clue.word}_${clue.count}`
    if (key === prevClueKey.current) return
    prevClueKey.current = key
    setClueOverlay({ word: clue.word, count: countLabel(clue.count) })
    setClueOverlayExiting(false)
    const t1 = setTimeout(() => setClueOverlayExiting(true), 2600)
    const t2 = setTimeout(() => setClueOverlay(null), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [gameState?.game?.currentClue])

  /* flip animation effect */
  useEffect(() => {
    const grid: any[] = gameState?.game?.grid || []
    const nowRevealed = new Set(grid.reduce<number[]>((acc, c, i) => { if (c.isRevealed) acc.push(i); return acc }, []))
    const newly = new Set<number>()
    nowRevealed.forEach(i => { if (!prevRevealed.current.has(i)) newly.add(i) })
    prevRevealed.current = nowRevealed
    if (newly.size === 0) return
    setFlipping(newly)
    const t = setTimeout(() => setFlipping(new Set()), 700)
    return () => clearTimeout(t)
  }, [gameState?.game?.grid])

  if (!gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121212]">
        <p className="text-[#6B7280] font-inter text-lg animate-pulse">Connecting…</p>
      </div>
    )
  }

  const joinUrl = `${window.location.origin}/play?room=${room}`
  const hostUrl = `${window.location.origin}/host/${room}`
  const game = gameState.game

  const handleCastToTV = async () => {
    try {
      if ((window as any).PresentationRequest) {
        const req = new (window as any).PresentationRequest([hostUrl]);
        (navigator as any).presentation.defaultRequest = req
        const conn = await req.start()
        setPresentationConnection(conn)
      } else setShowCastModal(true)
    } catch { setShowCastModal(true) }
  }

  /* ── LOBBY / GAME SELECTION ── */
  if (!game) {
    return (
      <div className="flex h-screen bg-[#121212]">
        {/* Sidebar */}
        <Sidebar room={room!} joinUrl={joinUrl} game={null}
          onCast={handleCastToTV} onEnd={() => setShowEndModal(true)} />

        <main className="flex-1 flex items-center justify-center">
          <div className="bg-[#27272A] rounded-2xl p-10 max-w-lg w-full mx-4">
            <h2 className="font-poppins text-3xl font-black text-white mb-2">Choose a Game</h2>
            <p className="text-[#6B7280] mb-8">Select a game to start the session</p>
            <button
              className="w-full py-5 rounded-xl font-poppins font-black text-xl text-[#121212] bg-[#00E5FF] hover:opacity-90 transition mb-3"
              onClick={() => wsClient.sendAction({ action: 'initGame', gameId: 'secret_signals' })}
            >Secret Signals — Codewords</button>
            <button className="w-full py-4 rounded-xl border border-[#6B7280] text-[#6B7280] font-inter" disabled>
              Spectrum (Coming Soon)
            </button>
          </div>
        </main>
      </div>
    )
  }

  /* ── LOBBY ── */
  if (game.phase === 'teamSetup' || game.phase === 'lobby') {
    return (
      <div className="flex h-screen bg-[#121212]">
        <Sidebar room={room!} joinUrl={joinUrl} game={game}
          onCast={handleCastToTV} onEnd={() => setShowEndModal(true)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-[#27272A] rounded-2xl p-10 max-w-2xl w-full mx-4 flex gap-8">
            <div className="flex-1">
              <h2 className="font-poppins text-3xl font-black text-[#00E5FF] mb-1">Secret Signals</h2>
              <p className="text-[#6B7280] mb-6">Game Lobby — waiting for players</p>
              <label className="text-[#6B7280] text-sm uppercase tracking-wider block mb-1">Word Pack</label>
              <select
                className="w-full bg-[#121212] text-white border border-[#6B7280] rounded-lg px-3 py-2 mb-6 font-inter focus:border-[#00E5FF] outline-none"
                value={game.selectedCategory || 'Standard'}
                onChange={e => wsClient.sendAction({ action: 'changeCategory', category: e.target.value })}
              >
                <option value="Standard">Standard</option>
                <option value="Tech">Tech</option>
              </select>
              <button
                className="w-full py-4 rounded-xl font-poppins font-black text-xl text-[#121212] bg-[#00E5FF] hover:opacity-90 transition"
                onClick={() => wsClient.sendAction({ action: 'startGame', gameId: 'secret_signals' })}
              >START GAME</button>
            </div>
            <div className="flex-1">
              <h3 className="font-poppins font-bold text-white mb-3">
                Players ({gameState.room.players.filter((p: any) => p.uuid !== 'HOST').length})
              </h3>
              <div className="space-y-2 max-h-56 overflow-auto mb-4">
                {gameState.room.players.filter((p: any) => p.uuid !== 'HOST').map((p: any) => (
                  <div key={p.uuid} className="flex items-center justify-between bg-[#121212] rounded-lg px-3 py-2">
                    <span className="font-inter text-white">{p.nickname}</span>
                    <span>{p.isConnected ? '🟢' : '🔴'}</span>
                  </div>
                ))}
                {gameState.room.players.length <= 1 && (
                  <p className="text-[#6B7280] text-sm">Waiting for players to scan QR…</p>
                )}
              </div>
              <button
                className="w-full py-2 rounded-lg border border-[#6B7280] text-[#6B7280] text-sm font-inter hover:border-white hover:text-white transition"
                onClick={() => wsClient.sendAction({ action: 'addMockPlayers' })}
              >🧪 Add 4 Test Players</button>
            </div>
          </div>
        </main>
        {showEndModal && <EndModal onConfirm={() => { setShowEndModal(false); wsClient.sendAction({ action: 'resetGame' }) }} onCancel={() => setShowEndModal(false)} />}
      </div>
    )
  }

  /* ── GAME BOARD (TV) ── */
  const isTeamA = game.currentTurn === 'teamA'
  const hoverIdx: number | null = game.hoverCardIndex ?? null
  const hoverTeam: string | null = game.hoverTeam ?? null

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden">
      {/* Sidebar (Host controls) */}
      <Sidebar room={room!} joinUrl={joinUrl} game={game}
        onCast={handleCastToTV} onEnd={() => setShowEndModal(true)} />

      {/* Main TV area */}
      <main className="flex-1 flex flex-col min-w-0 p-4 gap-3">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          {/* Pink score (teamB) */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#FF007F] neon-pink" />
            <span className="font-poppins font-black text-4xl" style={{ color: '#FF007F', textShadow: '0 0 15px #FF007F' }}>
              {game.teamBRemaining}
            </span>
            <span className="font-poppins font-bold text-[#6B7280] text-sm uppercase tracking-widest">Pink</span>
          </div>

          {/* Clue display */}
          <div className="flex flex-col items-center min-w-0 flex-1 px-4">
            {game.currentClue ? (
              <div className="text-center">
                <p className="font-roboto uppercase text-2xl font-bold text-white tracking-widest">{game.currentClue.word}</p>
                <p className="text-[#6B7280] text-sm">{countLabel(game.currentClue.count)} word{game.currentClue.count !== 1 ? 's' : ''} · {game.guessesRemaining} guess{game.guessesRemaining !== 1 ? 'es' : ''} left</p>
              </div>
            ) : (
              <div className={`px-6 py-2 rounded-full border font-poppins font-bold text-lg ${isTeamA ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-[#FF007F] text-[#FF007F]'}`}
                style={{ boxShadow: isTeamA ? '0 0 12px rgba(0,229,255,0.5)' : '0 0 12px rgba(255,0,127,0.5)' }}>
                {isTeamA ? 'BLUE' : 'PINK'} — {game.turnPhase === 'givingClue' ? 'GIVING CLUE' : 'GUESSING'}
              </div>
            )}
          </div>

          {/* Blue score (teamA) */}
          <div className="flex items-center gap-3">
            <span className="font-poppins font-bold text-[#6B7280] text-sm uppercase tracking-widest">Blue</span>
            <span className="font-poppins font-black text-4xl" style={{ color: '#00E5FF', textShadow: '0 0 15px #00E5FF' }}>
              {game.teamARemaining}
            </span>
            <div className="w-3 h-3 rounded-full bg-[#00E5FF] neon-blue" />
          </div>
        </div>

        {/* 5×5 Grid */}
        <div className="flex-[4] grid grid-cols-5 grid-rows-5 gap-3 min-h-0 overflow-hidden">
          {game.grid.map((card: any, idx: number) => {
            const isHovered = hoverIdx === idx && !card.isRevealed
            const hoverBorder = isHovered && hoverTeam ? HOVER_BORDER[hoverTeam] || '' : ''
            const isFlipping = flipping.has(idx)
            return (
              <div key={idx} className="card-wrap h-full"
                onClick={() => !card.isRevealed && wsClient.sendAction({ action: 'hostReveal', cardIndex: idx })}>
                <div className={`card-inner h-full ${card.isRevealed || isFlipping ? 'flipped' : ''}`}>
                  {/* Front face */}
                  <div className={`card-face bg-[#27272A] border-2 cursor-pointer transition-all
                    ${isHovered ? `border-2 ${hoverBorder} hover-pulse` : 'border-transparent hover:border-[#6B7280]'}`}>
                    <span className="font-roboto font-bold uppercase text-white text-center px-1 text-sm lg:text-base xl:text-xl leading-tight select-none">
                      {card.word}
                    </span>
                  </div>
                  {/* Back face (revealed) */}
                  <div className={`card-face card-back ${TEAM_BG[card.team] || 'bg-[#27272A]'}`}>
                    <span className="font-roboto font-bold uppercase text-center px-1 text-sm lg:text-base xl:text-xl leading-tight select-none">
                      {card.word}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom controls */}
        <div className="flex justify-center gap-3">
          <button
            className="px-6 py-2 rounded-lg border border-[#6B7280] text-[#6B7280] text-sm font-inter hover:border-white hover:text-white transition"
            onClick={() => wsClient.sendAction({ action: 'hostPassTurn' })}
          >⏭ Force Pass Turn</button>
        </div>
      </main>

      {/* Clue overlay */}
      {clueOverlay && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/90 backdrop-blur-sm ${clueOverlayExiting ? 'clue-overlay-exit' : 'clue-overlay-enter'}`}>
          <div className="text-center">
            <p className="text-[#6B7280] font-inter text-lg uppercase tracking-[0.3em] mb-4">Clue</p>
            <h1 className="font-poppins font-black text-8xl text-white tracking-tight" style={{ textShadow: isTeamA ? '0 0 40px #00E5FF' : '0 0 40px #FF007F' }}>
              {clueOverlay.word}
            </h1>
            <p className={`font-poppins font-bold text-5xl mt-4 ${isTeamA ? 'text-[#00E5FF]' : 'text-[#FF007F]'}`}>{clueOverlay.count}</p>
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {game.phase === 'gameOver' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/90 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="font-poppins font-black text-7xl text-white mb-4">
              {game.winner === 'teamA' ? '🔵 BLUE' : '🩷 PINK'} WINS!
            </h1>
            <button
              className="px-10 py-4 rounded-xl font-poppins font-black text-xl text-[#121212] bg-[#00E5FF] hover:opacity-90 transition"
              onClick={() => wsClient.sendAction({ action: 'newGame' })}
            >Play Again</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEndModal && <EndModal onConfirm={() => { setShowEndModal(false); if (presentationConnection) { try { presentationConnection.terminate() } catch {} setPresentationConnection(null) }; wsClient.sendAction({ action: 'resetGame' }) }} onCancel={() => setShowEndModal(false)} />}
      {showCastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowCastModal(false)}>
          <div className="bg-[#27272A] rounded-2xl p-8 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-poppins font-bold text-xl text-white mb-3">📺 Cast to TV</h2>
            <p className="text-[#6B7280] text-sm mb-4">Open on your Smart TV or use Chromecast (right-click → Cast…)</p>
            <code className="block bg-[#121212] rounded-lg px-4 py-3 text-[#00E5FF] text-sm break-all mb-4">{hostUrl}</code>
            <button className="w-full py-3 rounded-lg bg-[#00E5FF] text-[#121212] font-poppins font-bold" onClick={() => setShowCastModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sidebar ── */
function Sidebar({ room, joinUrl, game, onCast, onEnd }: any) {
  return (
    <aside className="w-60 flex flex-col items-center bg-[#1A1A1A] border-r border-white/5 p-5 gap-4 shrink-0">
      <h1 className="font-poppins font-black text-xl" style={{ background: 'linear-gradient(90deg,#00E5FF,#FF007F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Party Hub
      </h1>
      <div className="w-full bg-black rounded-xl p-3 flex flex-col items-center gap-2">
        <div className="bg-white p-2 rounded-lg"><QRCodeSVG value={joinUrl} size={120} /></div>
        <p className="text-[#6B7280] text-xs uppercase tracking-widest text-center">Scan to Join</p>
        <p className="font-poppins font-black text-2xl text-[#00E5FF] tracking-widest">{room}</p>
        {window.location.hostname === 'localhost' && (
          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px] text-yellow-500 text-center leading-tight">
            ⚠️ Playing on mobile? <br/>
            Open this page using your IP: <br/>
            <span className="font-bold select-all">http://192.168.1.3:5173</span>
          </div>
        )}
      </div>
      <div className="w-full space-y-2 mt-auto">
        <button className="w-full py-2 rounded-lg text-sm font-inter border border-white/10 text-[#6B7280] hover:text-white hover:border-white/30 transition" onClick={onCast}>📺 Cast to TV</button>
        {game && <button className="w-full py-2 rounded-lg text-sm font-inter border border-[#FF007F]/30 text-[#FF007F] hover:bg-[#FF007F]/10 transition" onClick={onEnd}>🛑 End Game</button>}
      </div>
    </aside>
  )
}

/* ── End Game Modal ── */
function EndModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div className="bg-[#27272A] rounded-2xl p-8 max-w-xs w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
        <h2 className="font-poppins font-bold text-xl text-white mb-2">🛑 End Game?</h2>
        <p className="text-[#6B7280] text-sm mb-6">Resets the room for all players.</p>
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-xl border border-[#6B7280] text-[#6B7280] font-inter hover:text-white hover:border-white transition" onClick={onCancel}>Cancel</button>
          <button className="flex-1 py-3 rounded-xl font-poppins font-bold bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/50 hover:bg-[#FF007F]/30 transition" onClick={onConfirm}>End Game</button>
        </div>
      </div>
    </div>
  )
}
