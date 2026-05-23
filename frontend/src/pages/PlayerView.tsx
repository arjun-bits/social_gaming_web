import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { wsClient } from '../lib/wsClient'
import { p2pClient } from '../lib/p2pClient'
import { getClientGameMeta } from '../games/gameRegistry'
import { PlayerView as TTREPlayerView } from '../games/ticket_europe/PlayerView'

const countLabel = (n: number) => n === -1 ? '∞' : String(n)

export function PlayerView() {
  const [searchParams] = useSearchParams()
  const room = searchParams.get('room') || ''
  // PIN can be embedded in URL (?pin=XXXX) so players joining via QR skip the PIN screen
  const urlPin = searchParams.get('pin') || ''

  const [nickname, setNickname] = useState(
    searchParams.get('name') || localStorage.getItem('nickname') || ''
  )
  const [hasRegistered, setHasRegistered] = useState(
    !!(searchParams.get('name') || localStorage.getItem('nickname'))
  )
  const [tvPin, setTvPin] = useState(urlPin)
  const [hasPin, setHasPin] = useState(false) // will be set true once registered + pin ready
  const [p2pConnected, setP2pConnected] = useState(false)
  const [gameState, setGameState] = useState<any>(null)

  const playerId = useRef(
    localStorage.getItem('playerId') || Math.random().toString(36).slice(2, 10)
  )

  useEffect(() => {
    localStorage.setItem('playerId', playerId.current)
    if (nickname) localStorage.setItem('nickname', nickname)

    if (hasRegistered) {
      wsClient.connect(playerId.current, nickname, room)
      // If PIN came from URL, auto-connect without showing PIN screen
      if (urlPin && !hasPin) {
        setHasPin(true)
      }
    }
  }, [hasRegistered, nickname, room])

  useEffect(() => {
    if (hasPin) {
      p2pClient.startPlayer(
        tvPin, 
        () => {
          setP2pConnected(true)
          p2pClient.send('action', { action: 'join', nickname }, 'HOST')
        },
        (err) => {
          alert('Connection Error: ' + err)
          setHasPin(false)
          setTvPin('')
        }
      )
      
      const unsub = p2pClient.onMessage((id, msg) => {
        if (msg.type === 'stateUpdate') {
          setGameState(msg.payload)
        }
      })
      
      return () => unsub()
    }
  }, [hasPin])

  const leaveRoom = () => {
    localStorage.removeItem('nickname')
    window.location.href = '/'
  }

  /* ── Nickname entry ── */
  if (!hasRegistered) {
    return (
      <div className="h-screen bg-[#0A0A0F] flex items-center justify-center px-6"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 50%), #0A0A0F' }}
      >
        <div className="w-full max-w-sm glass-panel space-y-6 animate-slide-up">
          <div className="text-center">
            <div className="text-5xl mb-3">🕹️</div>
            <h1 className="font-poppins font-black text-3xl text-white mb-1">Join Room</h1>
            <p className="text-[#6B7280] text-xs uppercase tracking-[0.3em]">Code: {room}</p>
          </div>
          <div className="space-y-3">
            <input
              id="input-player-nickname"
              type="text"
              placeholder="Your nickname..."
              className="w-full bg-[#1C1C24] text-white font-poppins font-bold text-xl tracking-widest rounded-xl px-4 py-4 border-2 border-transparent focus:border-[#00E5FF] outline-none transition-colors placeholder:text-[#4B5563]"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nickname.trim() && setHasRegistered(true)}
              maxLength={14}
              autoFocus
            />
            <button
              id="btn-player-enter"
              className="w-full py-4 rounded-xl font-poppins font-black text-lg text-[#0A0A0F] transition active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #00E5FF, #0077FF)' }}
              onClick={() => setHasRegistered(true)}
              disabled={!nickname.trim()}
            >
              Enter Game →
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── TV PIN entry ── */
  if (hasRegistered && !hasPin) {
    return (
      <div className="h-screen bg-[#0A0A0F] flex items-center justify-center px-6"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,0,127,0.06) 0%, transparent 50%), #0A0A0F' }}
      >
        <div className="w-full max-w-sm glass-panel space-y-6 animate-slide-up">
          <div className="text-center">
            <div className="text-5xl mb-3">📺</div>
            <h1 className="font-poppins font-black text-3xl text-white mb-1">Look at the TV</h1>
            <p className="text-[#6B7280] text-xs uppercase tracking-[0.3em]">Enter the 4-digit PIN</p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="0000"
              maxLength={4}
              className="w-full bg-[#1C1C24] text-center text-[#FF007F] font-poppins font-black text-4xl tracking-[0.5em] rounded-xl px-4 py-4 border-2 border-transparent focus:border-[#FF007F] outline-none transition-colors placeholder:text-[#4B5563]"
              value={tvPin}
              onChange={e => setTvPin(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && tvPin.length === 4 && setHasPin(true)}
              autoFocus
            />
            <button
              className="w-full py-4 rounded-xl font-poppins font-black text-lg text-white transition active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #FF007F, #A855F7)' }}
              onClick={() => setHasPin(true)}
              disabled={tvPin.length !== 4}
            >
              Connect to TV
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Connecting ── */
  if (!p2pConnected || !gameState) {
    return (
      <div className="h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FF007F] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#FF007F]" />
        <p className="text-[#6B7280] font-inter text-sm animate-pulse">Establishing Secure P2P Connection...</p>
      </div>
    )
  }

  const gameId = gameState.gameId || 'secret_signals'
  const game = gameState.game
  const gameMeta = getClientGameMeta(gameId)
  const myTeam: string | undefined = game?.playerTeams?.[playerId.current]
  const isLeader: boolean = !!game?.playerIsLeader?.[playerId.current]

  /* ── Waiting for Host Setup ── */
  if (!game) {
    return (
      <div className="h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-12 h-12 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00E5FF]" />
        <h2 className="text-white font-poppins font-black tracking-widest text-lg">WAITING FOR HOST</h2>
        <p className="text-[#6B7280] text-sm">The host is currently configuring the next game.</p>
      </div>
    )
  }

  /* ── Game Specific Routing ── */
  if (gameId === 'ticket_europe') {
    if (game?.data?.phase === 'lobby') {
      return (
        <div className="h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-4xl">🚂</div>
          <h2 className="text-white font-poppins font-black tracking-widest text-lg">WAITING TO START</h2>
          <p className="text-[#6B7280] text-sm">You are in the game. Look at the TV and wait for the host.</p>
        </div>
      )
    }
    return <TTREPlayerView gameState={game?.data} playerId={playerId.current} />
  }

  /* ── Lobby / Team Setup (Secret Signals) ── */
  if (game.phase === 'teamSetup' || game.phase === 'lobby') {
    return (
      <RoleSelection
        myTeam={myTeam}
        isLeader={isLeader}
        gameExists={true}
        roomData={gameState.room}
        gameData={game}
        gameMeta={gameMeta}
        onLeave={leaveRoom}
        playerId={playerId.current}
      />
    )
  }

  /* ── Game Over ── */
  if (game.phase === 'gameOver') {
    const isWinner = game.winner === myTeam
    const winColor = game.winner === 'teamA' ? '#00E5FF' : '#FF007F'
    const winLabel = game.winner === 'teamA' ? 'BLUE' : 'PINK'
    return (
      <div
        className="h-screen flex flex-col items-center justify-center gap-6 px-6"
        style={{ background: `radial-gradient(ellipse at 50% 30%, ${winColor}12 0%, transparent 60%), #0A0A0F` }}
      >
        <div className="text-center animate-pop-in">
          <div className="text-7xl mb-4">{isWinner ? '🏆' : '😔'}</div>
          <h1 className="font-poppins font-black text-5xl" style={{ color: winColor }}>
            {winLabel} WINS!
          </h1>
          <p className="text-[#6B7280] text-base mt-3">
            {isWinner ? 'Well played, Agent!' : 'Better luck next time.'}
          </p>
          <p className="text-[#4B5563] text-sm mt-6">Wait for the host to start a new game.</p>
        </div>
      </div>
    )
  }

  /* ── No team picked yet ── */
  if (!myTeam) {
    return (
      <RoleSelection
        myTeam={undefined}
        isLeader={false}
        gameExists={true}
        roomData={gameState.room}
        gameData={game}
        gameMeta={gameMeta}
        onLeave={leaveRoom}
        playerId={playerId.current}
      />
    )
  }

  /* ── In-game views ── */
  return (
    <>
      {isLeader
        ? <SpymasterView game={game} myTeam={myTeam} />
        : <OperativeView game={game} myTeam={myTeam} playerId={playerId.current} />
      }
    </>
  )
}

/* ──────────────────────────────────────────── */
/* ROLE SELECTION (Lobby)                       */
/* ──────────────────────────────────────────── */
function RoleSelection({ myTeam, isLeader, gameExists, roomData, gameData, gameMeta, onLeave, playerId }: {
  myTeam?: string; isLeader: boolean; gameExists: boolean; roomData: any; gameData: any;
  gameMeta?: any; onLeave?: () => void; playerId?: string;
}) {
  const roles = [
    { label: 'Spymaster', team: 'teamA', leader: true, color: '#00E5FF', emoji: '🔵' },
    { label: 'Spymaster', team: 'teamB', leader: true, color: '#FF007F', emoji: '🩷' },
    { label: 'Operative', team: 'teamA', leader: false, color: '#00E5FF', emoji: '🔵' },
    { label: 'Operative', team: 'teamB', leader: false, color: '#FF007F', emoji: '🩷' },
  ]
  const pick = (team: string, leader: boolean) => {
    p2pClient.send('action', { action: 'joinRole', team, isLeader: leader }, 'HOST')
  }

  const players = roomData?.players || []
  const teamAPlayers = players.filter((p: any) => gameData?.playerTeams?.[p.uuid] === 'teamA')
  const teamBPlayers = players.filter((p: any) => gameData?.playerTeams?.[p.uuid] === 'teamB')
  const unassigned = players.filter((p: any) => !gameData?.playerTeams?.[p.uuid] && p.uuid !== 'HOST')

  const getLeaderIds = (team: string) =>
    Object.keys(gameData?.playerIsLeader || {}).filter(
      id => gameData.playerIsLeader[id] && gameData.playerTeams[id] === team
    )

  const renderMini = (list: any[], team: string) => {
    const leaderIds = getLeaderIds(team)
    const leaders = list.filter(p => leaderIds.includes(p.uuid))
    const ops = list.filter(p => !leaderIds.includes(p.uuid))
    const color = team === 'teamA' ? '#00E5FF' : '#FF007F'
    return (
      <div className="space-y-1">
        {leaders.length > 0 ? (
          leaders.map(leader => (
            <div key={leader.uuid} className="text-xs px-3 py-1.5 rounded-lg border-l-2 font-bold" style={{ borderColor: color, color, background: `${color}11` }}>
              👑 {leader.nickname}
            </div>
          ))
        ) : (
          <div className="text-[10px] px-3 py-1.5 rounded-lg border border-dashed border-white/10 text-[#4B5563] italic">Spymaster empty</div>
        )}
        {ops.map((p: any) => (
          <div key={p.uuid} className="text-[11px] px-3 py-1 rounded-lg bg-white/4 text-[#9CA3AF]">{p.nickname}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0A0A0F] flex flex-col overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(0,229,255,0.05) 0%, transparent 50%), #0A0A0F' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div>
          {gameMeta && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">{gameMeta.icon}</span>
              <span className="text-[#6B7280] text-xs font-bold uppercase tracking-widest">{gameMeta.displayName}</span>
            </div>
          )}
          <h1 className="font-poppins font-black text-2xl text-white">Pick Your Role</h1>
          <p className="text-[#6B7280] text-[10px] uppercase tracking-widest">Room: {roomData?.roomId}</p>
        </div>
        {onLeave && (
          <button
            onClick={onLeave}
            className="px-3 py-1.5 rounded-lg border border-[#FF007F]/20 text-[#FF007F] text-[10px] uppercase font-bold hover:bg-[#FF007F]/8 transition"
          >
            Leave
          </button>
        )}
      </div>

      {/* Role buttons */}
      <div className="px-5 pb-4 shrink-0">
        <div className="grid grid-cols-2 gap-3">
          {roles.map(r => {
            const isMe = myTeam === r.team && isLeader === r.leader
            return (
              <button
                key={`${r.team}${r.leader}`}
                id={`role-${r.team}-${r.leader ? 'spy' : 'op'}`}
                className="py-4 rounded-2xl font-poppins font-bold text-sm border-2 transition active:scale-95"
                style={{
                  borderColor: r.color,
                  color: isMe ? '#0A0A0F' : r.color,
                  background: isMe ? r.color : `${r.color}11`,
                }}
                onClick={() => pick(r.team, r.leader)}
              >
                <div className="text-xl mb-1">{r.emoji}</div>
                <div>{r.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{r.leader ? 'Gives clues' : 'Makes guesses'}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Team display */}
      <div className="px-5 flex gap-3 min-h-0 flex-1">
        <div className="flex-1 bg-[#111118] rounded-2xl border border-[#00E5FF]/15 p-4">
          <p className="text-[#00E5FF] text-[10px] font-bold uppercase tracking-widest mb-3">🔵 Blue</p>
          {renderMini(teamAPlayers, 'teamA')}
        </div>
        <div className="flex-1 bg-[#111118] rounded-2xl border border-[#FF007F]/15 p-4">
          <p className="text-[#FF007F] text-[10px] font-bold uppercase tracking-widest mb-3">🩷 Pink</p>
          {renderMini(teamBPlayers, 'teamB')}
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="px-5 py-3 shrink-0">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#4B5563] mb-2">Unassigned</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p: any) => (
              <div key={p.uuid} className="player-chip text-[#6B7280] text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? 'bg-green-400' : 'bg-red-500'}`} />
                {p.nickname}
              </div>
            ))}
          </div>
        </div>
      )}

      {!gameExists && (
        <div className="mx-5 mb-5 p-4 bg-[#00E5FF]/8 border border-[#00E5FF]/20 rounded-2xl text-center shrink-0">
          <p className="text-[#00E5FF] text-sm font-medium animate-pulse">⏳ Waiting for host to start the game...</p>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────── */
/* SPYMASTER VIEW                               */
/* ──────────────────────────────────────────── */
function SpymasterView({ game, myTeam }: { game: any; myTeam: string }) {
  const [revealing, setRevealing] = useState(false)
  const [clueWord, setClueWord] = useState('')
  const [clueCount, setClueCount] = useState(1)
  const isMyTurn = game.currentTurn === myTeam
  const accentColor = myTeam === 'teamA' ? '#00E5FF' : '#FF007F'
  const teamLabel = myTeam === 'teamA' ? 'Blue' : 'Pink'

  const decrement = () => setClueCount(c => c === 0 ? -1 : c === -1 ? 9 : c - 1)
  const increment = () => setClueCount(c => c === 9 ? -1 : c === -1 ? 0 : c + 1)

  const transmit = () => {
    if (!clueWord.trim() || !isMyTurn || game.turnPhase !== 'givingClue') return
    p2pClient.send('action', { action: 'submitClue', word: clueWord.trim(), count: clueCount }, 'HOST')
    setClueWord('')
    setClueCount(1)
  }

  const turnStatus = isMyTurn
    ? game.turnPhase === 'givingClue' ? '🎯 Your turn — give a clue' : `⏳ Waiting for ${game.guessesRemaining} guess${game.guessesRemaining !== 1 ? 'es' : ''}...`
    : `⏸️ ${myTeam === 'teamA' ? 'Pink' : 'Blue'}'s turn — stand by`

  return (
    <div className="h-screen bg-[#0A0A0F] flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between shrink-0 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
            <h2 className="font-poppins font-black text-lg" style={{ color: accentColor }}>{teamLabel} Spymaster</h2>
          </div>
          <p className="text-[#6B7280] text-xs">{turnStatus}</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="font-poppins font-black text-xl text-[#00E5FF]">{game.teamARemaining}</p>
            <p className="text-[#4B5563] text-[9px] uppercase">Blue</p>
          </div>
          <div className="text-center">
            <p className="font-poppins font-black text-xl text-[#FF007F]">{game.teamBRemaining}</p>
            <p className="text-[#4B5563] text-[9px] uppercase">Pink</p>
          </div>
        </div>
      </div>

      {/* Secret Map */}
      <div className="px-4 pt-3 flex-[2] min-h-0 flex flex-col gap-3">
        <div className="grid grid-cols-5 grid-rows-5 gap-1.5 h-full flex-1">
          {game.grid.map((card: any, i: number) => {
            const revealed = card.isRevealed
            const bg = revealing
              ? card.team === 'assassin' ? 'bg-black border border-red-600'
                : card.team === 'teamA' ? 'bg-[#00E5FF]'
                  : card.team === 'teamB' ? 'bg-[#FF007F]'
                    : 'bg-[#6B7280]'
              : 'bg-[#1C1C24] border border-white/5'
            return (
              <div key={i} className={`rounded-md flex items-center justify-center transition-all duration-200 ${bg} ${revealed ? 'opacity-35' : ''}`}>
                {revealing && (
                  <span className="font-roboto font-bold text-[7px] text-white/90 uppercase text-center px-0.5 leading-tight select-none">
                    {card.word}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Hold to reveal */}
        <button
          className="w-full py-3 rounded-xl font-poppins font-bold text-xs border-2 transition select-none shrink-0"
          style={{ borderColor: accentColor, color: accentColor, background: revealing ? `${accentColor}18` : 'transparent' }}
          onMouseDown={() => setRevealing(true)}
          onMouseUp={() => setRevealing(false)}
          onMouseLeave={() => setRevealing(false)}
          onTouchStart={e => { e.preventDefault(); setRevealing(true) }}
          onTouchEnd={() => setRevealing(false)}
        >
          {revealing ? '🔍 Revealing Map...' : '👁 Hold to Reveal Map'}
        </button>
      </div>

      {/* Clue section */}
      <div className="px-4 pt-3 pb-5 shrink-0 border-t border-white/5">
        {isMyTurn && game.turnPhase === 'givingClue' ? (
          <div className="space-y-3">
            <input
              id="input-spy-clue"
              type="text"
              placeholder="ONE WORD CLUE"
              className="w-full bg-[#1C1C24] text-white font-roboto font-bold uppercase text-lg tracking-widest rounded-xl px-4 py-3 border-2 border-transparent outline-none transition-colors placeholder:text-[#4B5563]"
              style={{ caretColor: accentColor }}
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = 'transparent')}
              value={clueWord}
              onChange={e => setClueWord(e.target.value.replace(/\s/g, '').toUpperCase())}
              maxLength={20}
            />
            <div className="flex items-center gap-3">
              <span className="text-[#6B7280] text-sm shrink-0">Count:</span>
              <button className="w-10 h-10 rounded-xl bg-[#1C1C24] text-white font-poppins font-bold text-lg flex items-center justify-center active:scale-90" onClick={decrement}>−</button>
              <div className="flex-1 text-center font-poppins font-black text-3xl" style={{ color: accentColor }}>
                {countLabel(clueCount)}
              </div>
              <button className="w-10 h-10 rounded-xl bg-[#1C1C24] text-white font-poppins font-bold text-lg flex items-center justify-center active:scale-90" onClick={increment}>+</button>
            </div>
            <button
              id="btn-transmit-clue"
              className="w-full py-4 rounded-xl font-poppins font-black text-base text-[#0A0A0F] transition active:scale-95 disabled:opacity-40"
              style={{ background: accentColor }}
              disabled={!clueWord.trim()}
              onClick={transmit}
            >
              TRANSMIT SIGNAL →
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            {game.currentClue ? (
              <div className="bg-[#1C1C24] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[#6B7280] text-[9px] uppercase tracking-widest mb-1">Active Signal</p>
                  <p className="font-roboto font-black text-2xl text-white tracking-widest">{game.currentClue.word}</p>
                </div>
                <p className="font-poppins font-black text-4xl" style={{ color: accentColor }}>{countLabel(game.currentClue.count)}</p>
              </div>
            ) : (
              <p className="text-[#4B5563] text-sm italic">Waiting for signal...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────── */
/* OPERATIVE VIEW                               */
/* ──────────────────────────────────────────── */
function OperativeView({ game, myTeam, playerId }: { game: any; myTeam: string; playerId: string }) {
  const [pendingCard, setPendingCard] = useState<{ index: number; word: string } | null>(null)
  const [showEndTurnConfirm, setShowEndTurnConfirm] = useState(false)
  const isMyTurn = game.currentTurn === myTeam
  const accentColor = myTeam === 'teamA' ? '#00E5FF' : '#FF007F'
  const teamLabel = myTeam === 'teamA' ? 'Blue' : 'Pink'

  const tapCard = (idx: number, word: string, isRevealed: boolean) => {
    if (isRevealed || !isMyTurn || game.turnPhase !== 'guessing') return
    p2pClient.send('action', { action: 'hoverCard', cardIndex: idx }, 'HOST')
    setPendingCard({ index: idx, word })
  }

  const confirmGuess = () => {
    if (!pendingCard) return
    p2pClient.send('action', { action: 'guess', cardIndex: pendingCard.index }, 'HOST')
    p2pClient.send('action', { action: 'clearHover' }, 'HOST')
    setPendingCard(null)
  }

  const cancelGuess = () => {
    p2pClient.send('action', { action: 'clearHover' }, 'HOST')
    setPendingCard(null)
  }

  const endTurn = () => {
    p2pClient.send('action', { action: 'passTurn' }, 'HOST')
    setShowEndTurnConfirm(false)
  }

  const statusText = isMyTurn
    ? game.turnPhase === 'guessing'
      ? `Guessing — ${game.guessesRemaining} left`
      : '⏳ Waiting for spymaster clue...'
    : `${myTeam === 'teamA' ? 'Pink' : 'Blue'}'s turn — stand by`

  return (
    <div className="h-screen bg-[#0A0A0F] flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
            <h2 className="font-poppins font-black text-lg" style={{ color: accentColor }}>{teamLabel} Operative</h2>
          </div>
          <p className="text-[#6B7280] text-xs">{statusText}</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="font-poppins font-black text-xl text-[#00E5FF]">{game.teamARemaining}</p>
            <p className="text-[#4B5563] text-[9px] uppercase">Blue</p>
          </div>
          <div className="text-center">
            <p className="font-poppins font-black text-xl text-[#FF007F]">{game.teamBRemaining}</p>
            <p className="text-[#4B5563] text-[9px] uppercase">Pink</p>
          </div>
        </div>
      </div>

      {/* Active clue bar */}
      {game.currentClue && (
        <div className="mx-4 my-2 px-4 py-2.5 rounded-2xl flex items-center justify-between shrink-0 border border-white/8"
          style={{ background: `${accentColor}10` }}
        >
          <div>
            <p className="text-[9px] text-[#6B7280] uppercase tracking-widest">Signal</p>
            <span className="font-roboto font-bold uppercase text-white tracking-widest">{game.currentClue.word}</span>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-[#6B7280] uppercase tracking-widest">Count</p>
            <span className="font-poppins font-black text-2xl" style={{ color: accentColor }}>{countLabel(game.currentClue.count)}</span>
          </div>
        </div>
      )}

      {/* 5×5 Grid */}
      <div className="flex-1 min-h-0 px-3 pb-[72px]">
        <div className="grid grid-cols-5 grid-rows-5 gap-1.5 h-full">
          {game.grid.map((card: any, idx: number) => {
            const isPending = pendingCard?.index === idx
            const canTap = !card.isRevealed && isMyTurn && game.turnPhase === 'guessing'

            // Color tint for every card (user wants everyone to see colors)
            const cardTeamColor = !card.isRevealed
              ? card.team === 'teamA'   ? '#00E5FF'
              : card.team === 'teamB'   ? '#FF007F'
              : card.team === 'assassin'? '#ff0000'
              : '#6B7280'
              : null

            let bg = 'bg-[#1C1C24] border border-white/5'
            let extraStyle: React.CSSProperties = {}

            if (card.isRevealed) {
              bg = card.team === 'teamA' ? 'bg-[#00E5FF]'
                : card.team === 'teamB' ? 'bg-[#FF007F]'
                  : card.team === 'assassin' ? 'bg-black border border-red-700'
                    : 'bg-[#6B7280]'
            } else if (isPending) {
              bg = myTeam === 'teamA'
                ? 'bg-[#00E5FF]/15 border-2 border-[#00E5FF] neon-blue'
                : 'bg-[#FF007F]/15 border-2 border-[#FF007F] neon-pink'
            } else if (cardTeamColor) {
              // Show color as subtle background tint so all players know card teams
              bg = `rounded-xl border`
              extraStyle = {
                backgroundColor: `${cardTeamColor}15`,
                borderColor: `${cardTeamColor}40`,
                boxShadow: `inset 0 0 8px ${cardTeamColor}10`,
              }
            }
            return (
              <button
                key={idx}
                className={`rounded-xl flex items-center justify-center transition-all duration-100 ${bg}
                  ${card.isRevealed ? 'opacity-60 cursor-default' : canTap ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                style={extraStyle}
                onClick={() => tapCard(idx, card.word, card.isRevealed)}
                disabled={card.isRevealed || !canTap}
              >
                {!card.isRevealed && (
                  <span className="font-roboto font-bold uppercase text-white text-[10px] leading-tight text-center px-0.5 select-none">
                    {card.word}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 inset-x-0 px-4 pb-5 pt-2 bg-[#0A0A0F]/95 backdrop-blur-sm border-t border-white/5 z-10">
        {showEndTurnConfirm ? (
          <div className="flex gap-2">
            <button className="flex-1 py-3 rounded-xl border border-white/10 text-[#6B7280] font-inter text-sm" onClick={() => setShowEndTurnConfirm(false)}>Cancel</button>
            <button
              className="flex-1 py-3 rounded-xl font-poppins font-bold text-[#0A0A0F] text-sm"
              style={{ background: accentColor }}
              onClick={endTurn}
            >
              Confirm End Turn
            </button>
          </div>
        ) : (
          <button
            id="btn-end-turn"
            className="w-full py-3 rounded-xl font-poppins font-bold text-sm border-2 transition disabled:opacity-30"
            style={{ borderColor: accentColor, color: accentColor }}
            disabled={!isMyTurn || game.turnPhase !== 'guessing'}
            onClick={() => setShowEndTurnConfirm(true)}
          >
            End Turn
          </button>
        )}
      </div>

      {/* Card confirmation sheet */}
      {pendingCard && (
        <div className="fixed inset-0 z-40" onClick={cancelGuess}>
          <div
            className="fixed inset-x-0 bottom-0 z-50 bg-[#1C1C24] rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <p className="font-inter text-[#6B7280] text-xs uppercase tracking-widest text-center mb-2">Lock in guess?</p>
            <p className="font-poppins font-black text-3xl text-white text-center tracking-wider mb-6">{pendingCard.word}</p>
            <div className="flex gap-3">
              <button className="flex-1 py-4 rounded-2xl border border-white/10 text-[#6B7280] font-inter font-medium" onClick={cancelGuess}>Cancel</button>
              <button
                id="btn-confirm-guess"
                className="flex-1 py-4 rounded-2xl font-poppins font-black text-[#0A0A0F] text-lg"
                style={{ background: accentColor }}
                onClick={confirmGuess}
              >
                Confirm!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
