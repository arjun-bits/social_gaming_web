import type { PlayerState, TTREStateData } from '../../../../core/engine/ticket_europe/models';
import { cities } from '../../../../core/engine/ticket_europe/boardData';

interface Props {
  player: PlayerState;
  gameState: TTREStateData;
  isTurn: boolean;
  onDrawCard: (color: string) => void;
  onDrawTickets: () => void;
}

const CARD_BG: Record<string, string> = {
  red: '#dc2626',
  blue: '#1d4ed8',
  green: '#15803d',
  yellow: '#ca8a04',
  black: '#3a3a55', // Updated matching high-contrast black route hex
  white: '#cbd5e1',
  pink: '#be185d',
  orange: '#c2410c',
  locomotive: '#6b7280',
  any: '#44403c',
};

const CARD_LABEL: Record<string, string> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow',
  black: 'Black',
  white: 'White',
  pink: 'Pink',
  orange: 'Orange',
  locomotive: '★ Loco',
};

export function PlayerHUD({ player, gameState, isTurn, onDrawCard, onDrawTickets }: Props) {
  return (
    <div className="shrink-0 bg-[#0c0c14] border-t border-white/5 w-full select-none">
      {/* 1. Header Row: Active Player Meta Info */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-white/[0.03]">
        <div className="w-4 h-4 rounded-full ring-2 ring-white/15 shrink-0" style={{ background: player.color }} />
        <span className="text-white text-sm font-black">{player.name}</span>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-[#00E5FF] text-sm font-black">⭐ {player.score} PTS</span>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-[#9CA3AF] text-xs font-bold">🚂 {player.trainsLeft} TRAINS</span>
        <span className="text-[#9CA3AF] text-xs font-bold">🏠 {player.stationsLeft} STATIONS</span>
        <div className="flex-1" />
        <span className={`text-[8px] uppercase tracking-[0.2em] font-black rounded px-2 py-0.5 border ${
          isTurn 
            ? 'bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]' 
            : 'bg-white/5 border-white/10 text-[#4B5563]'
        }`}>
          {isTurn ? '⚡ Your Turn' : '⏳ Waiting'}
        </span>
      </div>

      {/* 2. Content Row: Card Hand | Active Tickets | Action Buttons */}
      <div className="flex items-stretch gap-0 px-5 py-3 h-28">
        
        {/* Left Section: Cards Hand Inventory */}
        <div className="flex-[3] min-w-0 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-[0.2em] text-[#4B5563] mb-2 font-black">Your Hand</p>
          <div className="flex gap-1.5 flex-wrap overflow-y-auto max-h-20 pr-2">
            {Object.entries(player.trainCards || {}).map(([color, count]: [string, any]) => count > 0 && (
              <div key={color}
                className="relative rounded-md px-2.5 py-1.5 flex items-center gap-1.5 border border-white/10 shadow-sm transition-all hover:brightness-110"
                style={{ background: CARD_BG[color] || '#334' }}>
                <span className="text-sm font-black text-white drop-shadow leading-none">{count}</span>
                <span className="text-[7px] uppercase tracking-wider font-extrabold opacity-80 text-white">
                  {CARD_LABEL[color] || color}
                </span>
              </div>
            ))}
            {Object.values(player.trainCards || {}).every((c: any) => !c || c === 0) && (
              <span className="text-[#4B5563] text-xs italic font-medium">No cards in hand</span>
            )}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-white/5 mx-4 shrink-0" />

        {/* Center Section: Destination Tickets Inventory */}
        <div className="flex-[4] min-w-0 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-[0.2em] text-[#4B5563] mb-2 font-black">Destination Tickets</p>
          <div className="flex gap-2 overflow-x-auto py-1 pr-2 scrollbar-thin">
            {player.tickets && player.tickets.length > 0 ? (
              player.tickets.map((ticket, idx) => {
                const cFrom = cities[ticket.from]?.name || ticket.from;
                const cTo = cities[ticket.to]?.name || ticket.to;
                return (
                  <div key={idx} 
                    className={`rounded-lg px-3 py-1.5 shrink-0 border flex flex-col justify-center gap-0.5 min-w-[150px] ${
                      ticket.completed 
                        ? 'bg-[#1b4332]/35 border-[#2d6a4f]/40 text-[#52b788]' 
                        : 'bg-[#1c1917]/50 border-white/5 text-[#9ca3af]'
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black truncate max-w-[110px] uppercase tracking-wide">
                        {cFrom} ➔ {cTo}
                      </span>
                      <span className="text-[9px] font-black">{ticket.points} PTS</span>
                    </div>
                    <span className={`text-[6px] uppercase tracking-[0.15em] font-black self-start ${
                      ticket.completed ? 'text-[#52b788]' : 'text-amber-500/80'
                    }`}>
                      {ticket.completed ? '✓ Completed' : '○ Incomplete'}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-[#4B5563] text-xs italic font-medium self-center mt-2">No active tickets</span>
            )}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-white/5 mx-4 shrink-0" />

        {/* Right Section: Draw Card / Ticket Actions */}
        <div className="shrink-0 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-[0.2em] text-[#4B5563] mb-2 font-black">Turn Actions</p>
          <div className="flex items-center gap-2">
            
            {/* Face-up Train Cards */}
            <div className="flex items-center gap-1">
              {(gameState.openCards || []).map((color, idx) => (
                <button 
                  key={idx} 
                  onClick={() => onDrawCard(color)}
                  className="rounded-md px-2 py-2 text-[7px] uppercase font-black text-white border border-white/10 hover:brightness-125 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                  style={{ background: CARD_BG[color] || '#334' }}
                  disabled={!isTurn}
                >
                  {CARD_LABEL[color] ? CARD_LABEL[color].replace('★ ', '') : color}
                </button>
              ))}
            </div>

            {/* Deck & Ticket Draw Buttons */}
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => onDrawCard('deck')}
                className="rounded-md px-3 py-1.5 text-[7px] uppercase font-black text-white border border-[#00E5FF]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shrink-0"
                style={{ background: 'linear-gradient(135deg, #00b4d8, #0077b6)' }}
                disabled={!isTurn}
              >
                🂠 Draw Card ({gameState.deckCount || 0})
              </button>
              <button 
                onClick={onDrawTickets}
                className="rounded-md px-3 py-1.5 text-[7px] uppercase font-black text-[#0A0A0F] border border-[#ffb703]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shrink-0"
                style={{ background: 'linear-gradient(135deg, #ffb703, #fb8500)' }}
                disabled={!isTurn || (gameState.ticketDeckCount || 0) === 0}
              >
                🎫 Draw Tickets ({gameState.ticketDeckCount || 0})
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
