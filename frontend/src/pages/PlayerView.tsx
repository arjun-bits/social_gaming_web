import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { wsClient } from '../lib/wsClient'

const TEAM_COLOR: Record<string, string> = {
  teamA: '#00E5FF', teamB: '#FF007F', neutral: '#6B7280', assassin: '#000'
}
const countLabel = (n: number) => n === -1 ? '∞' : String(n)

export function PlayerView() {
  const [searchParams] = useSearchParams()
  const room = searchParams.get('room') || ''
  const nameParam = searchParams.get('name') || 'Player'

  const [gameState, setGameState] = useState<any>(null)
  const playerId = useRef(Math.random().toString(36).slice(2, 10))

  useEffect(() => {
    wsClient.connect(playerId.current, nameParam, room)
    const unsub = wsClient.subscribe(setGameState)
    return () => unsub()
  }, [])

  if (!gameState) {
    return (
      <div className="h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-[#6B7280] font-inter animate-pulse">Connecting…</p>
      </div>
    )
  }

  const game = gameState.game
  const myTeam: string | undefined = game?.playerTeams?.[playerId.current]
  const isLeader: boolean = !!game?.playerIsLeader?.[playerId.current]

  /* No game or lobby → Role selection */
  if (!game || game.phase === 'teamSetup' || game.phase === 'lobby') {
    return <RoleSelection myTeam={myTeam} isLeader={isLeader} gameExists={!!game} />
  }

  /* Game over */
  if (game.phase === 'gameOver') {
    return (
      <div className="h-screen bg-[#121212] flex flex-col items-center justify-center gap-6 px-6">
        <h1 className="font-poppins font-black text-5xl text-white text-center">
          {game.winner === 'teamA' ? '🔵 BLUE' : '🩷 PINK'} WINS!
        </h1>
        <p className="text-[#6B7280] font-inter text-center">Wait for the host to start a new game.</p>
      </div>
    )
  }

  /* No team picked yet → picker */
  if (!myTeam) {
    return <RoleSelection myTeam={undefined} isLeader={false} gameExists={true} />
  }

  return isLeader
    ? <SpymasterView game={game} myTeam={myTeam} />
    : <OperativeView game={game} myTeam={myTeam} playerId={playerId.current} />
}

/* ──────────────────────────────────────────────── */
/* ROLE SELECTION                                   */
/* ──────────────────────────────────────────────── */
function RoleSelection({ myTeam, isLeader, gameExists }: { myTeam?: string; isLeader: boolean; gameExists: boolean }) {
  const roles = [
    { label: '🔵 Blue Spymaster', team: 'teamA', leader: true, color: '#00E5FF' },
    { label: '🔵 Blue Operative', team: 'teamA', leader: false, color: '#00E5FF' },
    { label: '🩷 Pink Spymaster', team: 'teamB', leader: true, color: '#FF007F' },
    { label: '🩷 Pink Operative', team: 'teamB', leader: false, color: '#FF007F' },
  ]
  const pick = (team: string, leader: boolean) => {
    wsClient.sendAction({ action: 'joinTeam', team })
    if (leader) wsClient.sendAction({ action: 'becomeSpymaster' })
  }
  return (
    <div className="h-screen bg-[#121212] flex flex-col items-center justify-center px-6 gap-6">
      <div className="text-center mb-2">
        <h1 className="font-poppins font-black text-3xl text-white">Pick Your Role</h1>
        {!gameExists && <p className="text-[#6B7280] text-sm mt-1">Waiting for host to start a game…</p>}
        {myTeam && <p className="text-sm mt-2" style={{ color: TEAM_COLOR[myTeam] }}>
          Currently: {myTeam === 'teamA' ? 'Blue' : 'Pink'} {isLeader ? 'Spymaster' : 'Operative'}
        </p>}
      </div>
      <div className="w-full max-w-sm space-y-3">
        {roles.map(r => (
          <button key={`${r.team}${r.leader}`}
            className="w-full py-4 rounded-xl font-poppins font-bold text-lg border-2 transition active:scale-95"
            style={{ borderColor: r.color, color: r.color, background: myTeam === r.team && isLeader === r.leader ? `${r.color}22` : 'transparent' }}
            onClick={() => pick(r.team, r.leader)}
          >{r.label}</button>
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────── */
/* SPYMASTER VIEW                                   */
/* ──────────────────────────────────────────────── */
function SpymasterView({ game, myTeam }: { game: any; myTeam: string }) {
  const [revealing, setRevealing] = useState(false)
  const [clueWord, setClueWord] = useState('')
  const [clueCount, setClueCount] = useState(1)
  const isMyTurn = game.currentTurn === myTeam
  const accentColor = myTeam === 'teamA' ? '#00E5FF' : '#FF007F'

  const decrement = () => setClueCount(c => c === 0 ? -1 : c === -1 ? 9 : c - 1)
  const increment = () => setClueCount(c => c === 9 ? -1 : c === -1 ? 0 : c + 1)

  const transmit = () => {
    if (!clueWord.trim() || !isMyTurn || game.turnPhase !== 'givingClue') return
    wsClient.sendAction({ action: 'submitClue', word: clueWord.trim(), count: clueCount })
    setClueWord('')
    setClueCount(1)
  }

  return (
    <div className="h-screen bg-[#121212] flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-poppins font-black text-xl" style={{ color: accentColor }}>
            {myTeam === 'teamA' ? 'Blue' : 'Pink'} Spymaster
          </h2>
          <p className="text-[#6B7280] text-xs font-inter">
            {isMyTurn ? (game.turnPhase === 'givingClue' ? 'Your turn — give a clue' : 'Operatives are guessing') : 'Opponent\'s turn'}
          </p>
        </div>
        <div className="flex gap-4 text-center">
          <div><p className="font-poppins font-black text-2xl text-[#FF007F]">{game.teamBRemaining}</p><p className="text-[#6B7280] text-xs">Pink</p></div>
          <div><p className="font-poppins font-black text-2xl text-[#00E5FF]">{game.teamARemaining}</p><p className="text-[#6B7280] text-xs">Blue</p></div>
        </div>
      </div>

      {/* Secret Map */}
      <div className="px-4 flex-[2] flex flex-col gap-3 min-h-0">
        <div className="grid grid-cols-5 grid-rows-5 gap-1.5 h-full">
          {game.grid.map((card: any, i: number) => {
            const bg = revealing
              ? card.team === 'assassin' ? 'bg-black border border-red-600'
                : card.team === 'teamA' ? 'bg-[#00E5FF]'
                  : card.team === 'teamB' ? 'bg-[#FF007F]'
                    : 'bg-[#6B7280]'
              : 'bg-[#27272A]'
            return (
              <div key={i} className={`rounded-md flex items-center justify-center transition-all duration-200 ${bg} ${card.isRevealed ? 'opacity-40' : ''}`}>
                {revealing && (
                  <span className="font-roboto font-bold text-[8px] text-white/80 uppercase text-center px-0.5 leading-tight select-none">
                    {card.word}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Hold to reveal */}
        <button
          className="w-full py-3 rounded-xl font-poppins font-bold text-sm border-2 transition select-none"
          style={{ borderColor: accentColor, color: accentColor, background: revealing ? `${accentColor}22` : 'transparent' }}
          onMouseDown={() => setRevealing(true)}
          onMouseUp={() => setRevealing(false)}
          onMouseLeave={() => setRevealing(false)}
          onTouchStart={e => { e.preventDefault(); setRevealing(true) }}
          onTouchEnd={() => setRevealing(false)}
        >
          {revealing ? '🔍 Revealing…' : '👁 Press & Hold to Reveal Map'}
        </button>

        {/* Clue input — only show when it's your turn to give clue */}
        {isMyTurn && game.turnPhase === 'givingClue' ? (
          <div className="space-y-3 pb-4">
            <input
              type="text"
              placeholder="ONE WORD CLUE"
              className="w-full bg-[#27272A] text-white font-roboto font-bold uppercase text-xl tracking-widest rounded-xl px-4 py-3 border-2 border-[#27272A] focus:outline-none placeholder:text-[#6B7280]"
              style={{ caretColor: accentColor }}
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = '#27272A')}
              value={clueWord}
              onChange={e => setClueWord(e.target.value.replace(/\s/g, '').toUpperCase())}
              maxLength={20}
            />
            <div className="flex items-center gap-3">
              <span className="text-[#6B7280] font-inter text-sm shrink-0">Number:</span>
              <button className="w-10 h-10 rounded-lg bg-[#27272A] text-white font-poppins font-bold text-lg flex items-center justify-center active:opacity-60" onClick={decrement}>−</button>
              <div className="flex-1 text-center font-poppins font-black text-3xl" style={{ color: accentColor }}>
                {countLabel(clueCount)}
              </div>
              <button className="w-10 h-10 rounded-lg bg-[#27272A] text-white font-poppins font-bold text-lg flex items-center justify-center active:opacity-60" onClick={increment}>+</button>
            </div>
            <button
              className="w-full py-4 rounded-xl font-poppins font-black text-lg text-[#121212] transition active:opacity-70 disabled:opacity-40"
              style={{ background: accentColor }}
              disabled={!clueWord.trim()}
              onClick={transmit}
            >TRANSMIT CLUE →</button>
          </div>
        ) : (
          <div className="pb-4 text-center">
            {game.currentClue && (
              <div className="bg-[#27272A] rounded-xl p-4">
                <p className="text-[#6B7280] text-xs uppercase tracking-widest mb-1">Active Clue</p>
                <p className="font-roboto font-bold text-2xl text-white tracking-widest">{game.currentClue.word}</p>
                <p style={{ color: accentColor }} className="font-poppins font-bold text-lg">{countLabel(game.currentClue.count)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────── */
/* OPERATIVE VIEW                                   */
/* ──────────────────────────────────────────────── */
function OperativeView({ game, myTeam, playerId }: { game: any; myTeam: string; playerId: string }) {
  const [pendingCard, setPendingCard] = useState<{ index: number; word: string } | null>(null)
  const [showEndTurnConfirm, setShowEndTurnConfirm] = useState(false)
  const isMyTurn = game.currentTurn === myTeam
  const accentColor = myTeam === 'teamA' ? '#00E5FF' : '#FF007F'

  const tapCard = (idx: number, word: string, isRevealed: boolean) => {
    if (isRevealed || !isMyTurn || game.turnPhase !== 'guessing') return
    wsClient.sendAction({ action: 'hoverCard', cardIndex: idx })
    setPendingCard({ index: idx, word })
  }

  const confirmGuess = () => {
    if (!pendingCard) return
    wsClient.sendAction({ action: 'guess', cardIndex: pendingCard.index })
    wsClient.sendAction({ action: 'clearHover' })
    setPendingCard(null)
  }

  const cancelGuess = () => {
    wsClient.sendAction({ action: 'clearHover' })
    setPendingCard(null)
  }

  const endTurn = () => {
    wsClient.sendAction({ action: 'passTurn' })
    setShowEndTurnConfirm(false)
  }

  return (
    <div className="h-screen bg-[#121212] flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-poppins font-black text-lg" style={{ color: accentColor }}>
            {myTeam === 'teamA' ? 'Blue' : 'Pink'} Operative
          </h2>
          <p className="text-[#6B7280] text-xs font-inter">
            {isMyTurn
              ? game.turnPhase === 'guessing' ? `Guessing — ${game.guessesRemaining} left` : 'Waiting for clue…'
              : 'Opponent\'s turn — wait'}
          </p>
        </div>
        <div className="flex gap-3 text-center">
          <div><p className="font-poppins font-black text-xl text-[#FF007F]">{game.teamBRemaining}</p><p className="text-[#6B7280] text-[10px]">Pink</p></div>
          <div><p className="font-poppins font-black text-xl text-[#00E5FF]">{game.teamARemaining}</p><p className="text-[#6B7280] text-[10px]">Blue</p></div>
        </div>
      </div>

      {/* Active clue bar */}
      {game.currentClue && (
        <div className="mx-4 mb-2 px-4 py-2 rounded-xl bg-[#27272A] flex items-center justify-between shrink-0">
          <span className="font-roboto font-bold uppercase text-white tracking-widest text-sm">{game.currentClue.word}</span>
          <span className="font-poppins font-black text-lg" style={{ color: accentColor }}>{countLabel(game.currentClue.count)}</span>
        </div>
      )}

      {/* 5×5 Grid */}
      <div className="flex-1 min-h-0 px-3 pb-20">
        <div className="grid grid-cols-5 grid-rows-5 gap-1.5 h-full">
          {game.grid.map((card: any, idx: number) => {
            const isPending = pendingCard?.index === idx
            const canTap = !card.isRevealed && isMyTurn && game.turnPhase === 'guessing'
            let bg = 'bg-[#27272A]'
            let extra = ''
            if (card.isRevealed) {
              bg = card.team === 'teamA' ? 'bg-[#00E5FF]' : card.team === 'teamB' ? 'bg-[#FF007F]' : card.team === 'assassin' ? 'bg-black border border-red-600' : 'bg-[#6B7280]'
            } else if (isPending) {
              extra = myTeam === 'teamA' ? 'border-2 border-[#00E5FF] neon-blue' : 'border-2 border-[#FF007F] neon-pink'
            } else if (canTap) {
              extra = 'active:scale-95 hover:border hover:border-white/20'
            }
            return (
              <button key={idx}
                className={`rounded-lg flex items-center justify-center transition-all duration-150 ${bg} ${extra} ${card.isRevealed ? 'opacity-70 cursor-default' : canTap ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
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

      {/* Sticky End Turn bar */}
      <div className="fixed bottom-0 inset-x-0 px-4 pb-4 pt-2 bg-[#121212]/95 backdrop-blur-sm">
        {showEndTurnConfirm ? (
          <div className="flex gap-2">
            <button className="flex-1 py-3 rounded-xl border border-[#6B7280] text-[#6B7280] font-inter text-sm" onClick={() => setShowEndTurnConfirm(false)}>Cancel</button>
            <button className="flex-1 py-3 rounded-xl font-poppins font-bold text-[#121212] text-sm" style={{ background: accentColor }} onClick={endTurn}>Confirm End Turn</button>
          </div>
        ) : (
          <button
            className="w-full py-3 rounded-xl font-poppins font-bold text-sm border-2 transition disabled:opacity-30"
            style={{ borderColor: accentColor, color: accentColor }}
            disabled={!isMyTurn || game.turnPhase !== 'guessing'}
            onClick={() => setShowEndTurnConfirm(true)}
          >End Turn</button>
        )}
      </div>

      {/* Bottom sheet — lock-in confirmation */}
      {pendingCard && (
        <div className="fixed inset-0 z-40" onClick={cancelGuess}>
          <div className="fixed inset-x-0 bottom-0 z-50 bg-[#27272A] rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-[#6B7280] rounded-full mx-auto mb-6" />
            <p className="font-inter text-[#6B7280] text-sm uppercase tracking-widest text-center mb-2">Lock in your guess?</p>
            <p className="font-poppins font-black text-3xl text-white text-center tracking-wider mb-6">{pendingCard.word}</p>
            <div className="flex gap-3">
              <button className="flex-1 py-4 rounded-xl border border-[#6B7280] text-[#6B7280] font-inter font-medium" onClick={cancelGuess}>Cancel</button>
              <button className="flex-1 py-4 rounded-xl font-poppins font-black text-[#121212] text-lg" style={{ background: accentColor }} onClick={confirmGuess}>Confirm!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
