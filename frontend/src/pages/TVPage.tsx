import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { wsClient } from '../lib/wsClient'
import { p2pClient } from '../lib/p2pClient'
import { TVView as TTRETVView } from '../games/ticket_europe/TVView'

export function TVPage() {
  const { room } = useParams<{ room: string }>()
  const [gameState, setGameState] = useState<any>(null)
  const hasConnected = useRef(false)
  const prevClueKey = useRef('')

  useEffect(() => {
    if (!hasConnected.current) {
      hasConnected.current = true
      
      // Connect to signaling server with a unique TV ID
      const tvId = 'TV_' + Math.random().toString(36).substring(2, 8)
      wsClient.connect(tvId, 'TV Display', room, () => {
        // Once connected to signaling server, establish WebRTC to Host
        p2pClient.startPlayer('', () => {
           console.log('[TV] Connected to Host via WebRTC!')
        }, (err) => {
           console.error('[TV] WebRTC Error:', err)
        }, true)
      })
    }

    const unsubP2P = p2pClient.onMessage((id, msg) => {
      if (msg.type === 'stateUpdate') {
         setGameState(msg.payload)
      }
    })

    return () => unsubP2P()
  }, [room])

  if (!gameState) {
    return (
      <div className="h-screen tv-bg flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-blue" />
        <p className="text-white font-poppins font-black text-xl tracking-widest animate-pulse">CONNECTING TO ARCADE...</p>
      </div>
    )
  }

  const roomInfo = gameState?.room
  const game = gameState?.game
  const host = window.location.hostname
  const effectiveHost = (roomInfo?.localIp && host === 'localhost')
    ? `${roomInfo.localIp}:5173`
    : window.location.host
  const joinUrl = `${window.location.protocol}//${effectiveHost}/play?room=${room}`

  const isLobby = !game || game.phase === 'lobby' || game.phase === 'teamSetup'
  const isGameOver = game?.phase === 'gameOver'
  const isPlaying = game?.phase === 'playing'

  const clueKey = game?.currentClue ? `${game.currentClue.word}-${game.currentClue.count}` : ''
  const clueIsNew = clueKey && clueKey !== prevClueKey.current
  if (clueIsNew) prevClueKey.current = clueKey

  return (
    <div className="h-screen tv-bg flex flex-col overflow-hidden relative">

      {/* ── Corner: Room Code + QR ── */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4 glass-panel-dark p-3 rounded-2xl">
        <div className="bg-white p-1.5 rounded-lg">
          <QRCodeSVG value={joinUrl} size={60} />
        </div>
        <div>
          <p className="text-[9px] text-[#6B7280] uppercase tracking-[0.25em]">Join Game</p>
          <div className="flex gap-2 items-center">
            <span className="font-poppins font-black text-2xl text-[#00E5FF] tracking-widest leading-none">{room}</span>
            {roomInfo?.tvPin && (
              <div className="bg-[#FF007F] text-white px-2 py-0.5 rounded text-sm font-black tracking-widest flex items-center">
                PIN: {roomInfo.tvPin}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── LOBBY STATE ── */}
      {isLobby && <TVLobbyView roomInfo={roomInfo} game={game} joinUrl={joinUrl} room={room!} />}

      {/* ── PLAYING STATE ── */}
      {isPlaying && game.gameId !== 'ticket_europe' && <TVGameView game={game} clueIsNew={!!clueIsNew} />}
      {isPlaying && game.gameId === 'ticket_europe' && <TTRETVView gameState={game.state.data} />}

      {/* ── GAME OVER STATE ── */}
      {isGameOver && <TVGameOverView game={game} roomInfo={roomInfo} />}
    </div>
  )
}

/* ──────────────────────────────────────────── */
/* TV LOBBY VIEW                                */
/* ──────────────────────────────────────────── */
function TVLobbyView({ roomInfo, game, joinUrl, room }: any) {
  const players = roomInfo?.players?.filter((p: any) => p.uuid !== 'HOST') || []
  const teamAPlayers = players.filter((p: any) => game?.playerTeams?.[p.uuid] === 'teamA')
  const teamBPlayers = players.filter((p: any) => game?.playerTeams?.[p.uuid] === 'teamB')
  const unassigned = players.filter((p: any) => !game?.playerTeams?.[p.uuid])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 px-16 py-16">
      {/* Title */}
      <div className="text-center animate-fade-in">
        <p className="text-[#6B7280] text-sm uppercase tracking-[0.4em] mb-3 font-inter">Midnight Arcade Presents</p>
        <h1 className="font-poppins font-black text-7xl text-white tracking-tight">
          Secret <span className="text-[#00E5FF]">Signals</span>
        </h1>
        <p className="text-[#6B7280] text-lg mt-3">Scan the code to join · Pick your role · Wait for the host</p>
      </div>

      {/* Team display or generic waiting */}
      {roomInfo?.isConfiguring && game ? (
        <div className="w-full max-w-5xl flex gap-8 animate-slide-up">
          {/* Blue Team */}
          <div className="flex-1 bg-black/40 rounded-3xl border border-[#00E5FF]/20 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#00E5FF]/20">
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF] flex items-center justify-center text-black font-poppins font-black text-xl">B</div>
              <h2 className="font-poppins font-black text-2xl text-[#00E5FF]">Blue Squad</h2>
            </div>
            <TeamRoster players={teamAPlayers} team="teamA" game={game} />
          </div>

          {/* Center: unassigned */}
          <div className="w-48 flex flex-col items-center justify-start gap-3 pt-4">
            <p className="text-[10px] uppercase tracking-widest text-[#6B7280]">Unassigned</p>
            {unassigned.map((p: any) => (
              <div key={p.uuid} className="player-chip w-full justify-center text-[#6B7280]">
                <span className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? 'bg-green-400' : 'bg-red-500'}`} />
                {p.nickname}
              </div>
            ))}
            {unassigned.length === 0 && players.length > 0 && (
              <p className="text-green-400 text-xs italic">All assigned!</p>
            )}
          </div>

          {/* Pink Team */}
          <div className="flex-1 bg-black/40 rounded-3xl border border-[#FF007F]/20 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#FF007F]/20 justify-end">
              <h2 className="font-poppins font-black text-2xl text-[#FF007F]">Pink Squad</h2>
              <div className="w-10 h-10 rounded-xl bg-[#FF007F] flex items-center justify-center text-white font-poppins font-black text-xl">P</div>
            </div>
            <TeamRoster players={teamBPlayers} team="teamB" game={game} reverse />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
            <p className="text-[#6B7280] text-xl italic font-poppins">Waiting for Host to select and configure a game...</p>
        </div>
      )}

      {/* Player count pill */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
        <span className="text-white font-poppins font-bold text-lg">{players.length}</span>
        <span className="text-[#6B7280] text-sm">player{players.length !== 1 ? 's' : ''} in lobby</span>
      </div>
    </div>
  )
}

function TeamRoster({ players, team, game, reverse }: any) {
  const leaderId = Object.keys(game?.playerIsLeader || {}).find(
    (id: string) => game.playerIsLeader[id] && game.playerTeams[id] === team
  )
  const leader = players.find((p: any) => p.uuid === leaderId)
  const operatives = players.filter((p: any) => p.uuid !== leaderId)
  const color = team === 'teamA' ? '#00E5FF' : '#FF007F'

  return (
    <div className={`flex flex-col gap-4 ${reverse ? 'items-end text-right' : ''}`}>
      <div className="w-full">
        <p className="text-[9px] uppercase tracking-widest text-[#6B7280] mb-2">Spymaster</p>
        {leader ? (
          <div className="bg-[#27272A] px-4 py-3 rounded-xl border-l-4" style={{ borderColor: color, ...(reverse ? { borderLeft: 'none', borderRight: `4px solid ${color}` } : {}) }}>
            <span className="text-white font-poppins font-bold text-lg">👑 {leader.nickname}</span>
          </div>
        ) : (
          <div className="border border-dashed border-white/10 px-4 py-3 rounded-xl text-[#6B7280] text-sm italic">Awaiting agent...</div>
        )}
      </div>
      <div className="w-full space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-[#6B7280] mb-2">Operatives</p>
        {operatives.length > 0 ? operatives.map((p: any) => (
          <div key={p.uuid} className="bg-white/5 px-4 py-2 rounded-lg border border-white/5">
            <span className="text-white/80 text-sm">{p.nickname}</span>
          </div>
        )) : <p className="text-[#6B7280] text-xs italic">No agents yet.</p>}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────── */
/* TV GAME VIEW                                 */
/* ──────────────────────────────────────────── */
function TVGameView({ game, clueIsNew }: { game: any; clueIsNew: boolean }) {
  return (
    <div className="flex-1 flex flex-col p-6 gap-4 min-h-0">
      {/* Score Bar */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#00E5FF] text-[#121212] font-poppins font-black text-3xl w-14 h-14 rounded-2xl flex items-center justify-center shadow-blue">
            {game.teamARemaining}
          </div>
          <div>
            <p className="font-poppins font-black text-lg text-[#00E5FF]">BLUE</p>
            <p className="text-[#6B7280] text-[10px] uppercase tracking-widest">remaining</p>
          </div>
        </div>

        <div className="text-center">
          <div className={`px-8 py-2 rounded-full border-2 ${game.currentTurn === 'teamA' ? 'border-[#00E5FF] bg-[#00E5FF]/10' : 'border-[#FF007F] bg-[#FF007F]/10'}`}>
            <p className="font-poppins font-black text-xl text-white tracking-widest">
              {game.currentTurn === 'teamA' ? '🔵 BLUE' : '🩷 PINK'} TURN
            </p>
            {game.turnPhase === 'givingClue' && <p className="text-[#6B7280] text-[10px] uppercase tracking-widest mt-0.5">Spymaster is thinking...</p>}
            {game.turnPhase === 'guessing' && <p className="text-[#6B7280] text-[10px] uppercase tracking-widest mt-0.5">{game.guessesRemaining} guess{game.guessesRemaining !== 1 ? 'es' : ''} left</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="font-poppins font-black text-lg text-[#FF007F] text-right">PINK</p>
            <p className="text-[#6B7280] text-[10px] uppercase tracking-widest">remaining</p>
          </div>
          <div className="bg-[#FF007F] text-white font-poppins font-black text-3xl w-14 h-14 rounded-2xl flex items-center justify-center shadow-pink">
            {game.teamBRemaining}
          </div>
        </div>
      </div>

      {/* 5×5 Grid */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-5 grid-rows-5 gap-3 h-full max-w-5xl mx-auto">
          {(game.grid || []).map((card: any, idx: number) => {
            const isHovered = game.hoverCardIndex === idx
            const hoverTeam = game.hoverTeam
            const hoverBorder = isHovered
              ? hoverTeam === 'teamA'
                ? 'border-2 border-[#00E5FF] shadow-blue hover-pulse'
                : 'border-2 border-[#FF007F] shadow-pink hover-pulse'
              : ''
            return (
              <div key={idx} className={`card-wrap ${hoverBorder}`}>
                <div className={`card-inner ${card.isRevealed ? 'flipped' : ''}`}>
                  <div className="card-face bg-[#1C1C24] border border-white/5 flex flex-col p-2 text-center gap-1">
                    <p className="font-roboto font-bold text-lg text-white uppercase tracking-widest leading-tight">{card.word}</p>
                  </div>
                  <div className={`card-face card-back ${card.team === 'teamA' ? 'team-teamA' : card.team === 'teamB' ? 'team-teamB' : card.team === 'assassin' ? 'team-assassin' : 'team-neutral'}`}>
                    <p className="font-roboto font-black text-base uppercase tracking-wider">{card.word}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Clue Banner */}
      {game?.currentClue && (
        <div className={`shrink-0 flex justify-center ${clueIsNew ? 'animate-clue-in' : ''}`}>
          <div className="bg-[#0A0A0F]/95 backdrop-blur-md border-2 border-white/20 px-12 py-5 rounded-2xl shadow-2xl flex items-center gap-10">
            <div>
              <p className="text-[9px] text-[#6B7280] uppercase tracking-widest mb-1">Signal Received</p>
              <p className="font-roboto font-black text-5xl text-white tracking-[0.2em]">{game.currentClue.word}</p>
            </div>
            <div className="h-14 w-px bg-white/10" />
            <div className="text-center">
              <p className="font-poppins font-black text-6xl text-white">
                {game.currentClue.count === -1 ? '∞' : game.currentClue.count}
              </p>
              <p className="text-[9px] text-[#6B7280] uppercase tracking-widest">Strength</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────── */
/* TV GAME OVER VIEW                            */
/* ──────────────────────────────────────────── */
function TVGameOverView({ game, roomInfo }: any) {
  const winnerTeam = game.winner
  const isBlue = winnerTeam === 'teamA'
  const color = isBlue ? '#00E5FF' : '#FF007F'
  const label = isBlue ? 'BLUE' : 'PINK'
  const emoji = isBlue ? '🔵' : '🩷'

  const players = roomInfo?.players?.filter((p: any) => p.uuid !== 'HOST') || []
  const winners = players.filter((p: any) => game.playerTeams?.[p.uuid] === winnerTeam)

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 px-16" style={{
      background: `radial-gradient(ellipse at 50% 40%, ${color}18 0%, transparent 60%), #0A0A0F`
    }}>
      <div className="text-center animate-pop-in">
        <p className="text-[#6B7280] text-sm uppercase tracking-[0.5em] mb-6">Mission Complete</p>
        <div className="text-9xl mb-6">{emoji}</div>
        <h1 className="font-poppins font-black text-8xl tracking-tight" style={{ color }}>
          {label} WINS
        </h1>
        <p className="text-[#6B7280] text-xl mt-4 font-inter">Wait for the host to start a new game</p>
      </div>

      {winners.length > 0 && (
        <div className="flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#6B7280]">Winning Team</p>
          <div className="flex gap-3 flex-wrap justify-center">
            {winners.map((p: any) => (
              <div key={p.uuid} className="px-5 py-2.5 rounded-full font-poppins font-bold text-sm border-2" style={{ borderColor: color, color }}>
                {p.nickname}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
