/**
 * PlayerHUD.tsx — Bottom HUD for the host player.
 * 3-section layout: [Cards | Tickets | Actions]
 * Extracted from HostView.tsx and enhanced with ticket display.
 */
import type { PlayerState, TrainColor } from '../../../../core/engine/ticket_europe/models';

const CARD_BG: Record<string, string> = {
  red: '#dc2626', blue: '#1d4ed8', green: '#15803d',
  yellow: '#ca8a04', black: '#1e293b', white: '#cbd5e1',
  pink: '#be185d', orange: '#c2410c', locomotive: '#6b7280', any: '#44403c',
};

interface Props {
  player: PlayerState;
  isMyTurn: boolean;
  openCards: TrainColor[];
  deckCount: number;
  ticketDeckCount: number;
  onDrawCard: (color: string) => void;
  onDrawTickets: () => void;
}

export function PlayerHUD({ player, isMyTurn, openCards, deckCount, ticketDeckCount, onDrawCard, onDrawTickets }: Props) {
  return (
    <div style={{
      flexShrink: 0, background: '#0c0c14',
      borderTop: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Header row: player info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: player.color, boxShadow: `0 0 6px ${player.color}40`,
          flexShrink: 0,
        }} />
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>{player.name}</span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ color: '#00E5FF', fontSize: 14, fontWeight: 900 }}>⭐ {player.score}</span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700 }}>🚂 {player.trainsLeft}</span>
        <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700 }}>🏠 {player.stationsLeft}</span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 8, textTransform: 'uppercase' as const,
          letterSpacing: '0.2em', color: '#4B5563',
        }}>
          {isMyTurn ? '⚡ Active' : '⏳ Waiting'}
        </span>
      </div>

      {/* Content row: Cards | Tickets | Draw Actions */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 0,
        padding: '12px 20px',
      }}>
        {/* Cards section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 8, textTransform: 'uppercase' as const,
            letterSpacing: '0.2em', color: '#4B5563', marginBottom: 6,
          }}>Your Hand</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {Object.entries(player.trainCards || {}).map(([color, count]) => count > 0 && (
              <div key={color} style={{
                borderRadius: 6, padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                background: CARD_BG[color] || '#334',
              }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{count}</span>
                <span style={{ fontSize: 7, textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontWeight: 700, opacity: 0.7, color: '#fff' }}>{color}</span>
              </div>
            ))}
            {Object.values(player.trainCards || {}).every(c => !c || c === 0) && (
              <span style={{ color: '#4B5563', fontSize: 12, fontStyle: 'italic' }}>No cards</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.05)', margin: '0 16px', flexShrink: 0, alignSelf: 'center' }} />

        {/* Tickets section */}
        <div style={{ minWidth: 0, maxWidth: 300 }}>
          <p style={{
            fontSize: 8, textTransform: 'uppercase' as const,
            letterSpacing: '0.2em', color: '#4B5563', marginBottom: 6,
          }}>Tickets</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, overflowX: 'auto' as const }}>
            {(player.tickets || []).map(ticket => (
              <div key={ticket.id} style={{
                borderRadius: 8, padding: '4px 10px',
                border: `1px solid ${ticket.completed ? '#38A169' : '#E53E3E'}`,
                background: ticket.completed ? 'rgba(56,161,105,0.1)' : 'rgba(229,62,62,0.05)',
                display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap' as const,
              }}>
                <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>
                  {ticket.from.slice(0, 3).toUpperCase()} → {ticket.to.slice(0, 3).toUpperCase()}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 900,
                  color: ticket.completed ? '#38A169' : '#E53E3E',
                }}>
                  {ticket.completed ? '✅' : '❌'} {ticket.points}
                </span>
              </div>
            ))}
            {(!player.tickets || player.tickets.length === 0) && (
              <span style={{ color: '#4B5563', fontSize: 11, fontStyle: 'italic' }}>No tickets</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.05)', margin: '0 16px', flexShrink: 0, alignSelf: 'center' }} />

        {/* Draw Actions */}
        <div style={{ flexShrink: 0 }}>
          <p style={{
            fontSize: 8, textTransform: 'uppercase' as const,
            letterSpacing: '0.2em', color: '#4B5563', marginBottom: 6,
          }}>Actions</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {openCards.map((color, idx) => (
              <button key={idx} onClick={() => onDrawCard(color)}
                disabled={!isMyTurn}
                style={{
                  borderRadius: 6, padding: '6px 10px',
                  fontSize: 8, textTransform: 'uppercase' as const, fontWeight: 700,
                  color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                  background: CARD_BG[color] || '#334',
                  cursor: isMyTurn ? 'pointer' : 'not-allowed',
                  opacity: isMyTurn ? 1 : 0.4,
                  transition: 'transform 0.15s',
                }}>
                {color}
              </button>
            ))}
            <button onClick={() => onDrawCard('deck')}
              disabled={!isMyTurn}
              style={{
                borderRadius: 6, padding: '6px 10px',
                fontSize: 8, textTransform: 'uppercase' as const, fontWeight: 700,
                color: '#fff', border: '1px solid rgba(0,229,255,0.3)',
                background: 'linear-gradient(135deg, #00E5FF, #0077FF)',
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
                opacity: isMyTurn ? 1 : 0.4,
              }}>
              🂠 Deck ({deckCount})
            </button>
            <button onClick={onDrawTickets}
              disabled={!isMyTurn || ticketDeckCount <= 0}
              style={{
                borderRadius: 6, padding: '6px 10px',
                fontSize: 8, textTransform: 'uppercase' as const, fontWeight: 700,
                color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)',
                background: 'rgba(255,215,0,0.08)',
                cursor: isMyTurn && ticketDeckCount > 0 ? 'pointer' : 'not-allowed',
                opacity: isMyTurn && ticketDeckCount > 0 ? 1 : 0.4,
              }}>
              🎫 Tickets ({ticketDeckCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
