/**
 * TicketModal.tsx — Glassmorphism modal for selecting destination tickets.
 * Shows when player has pendingTickets (at game start or after drawing).
 * Must keep at least 1 ticket.
 */
import { useState } from 'react';
import type { Ticket } from '../../../../core/engine/ticket_europe/models';
import { cities } from '../../../../core/engine/ticket_europe/boardData';

interface Props {
  pendingTickets: Ticket[];
  onKeepTickets: (ticketIds: string[]) => void;
}

export function TicketModal({ pendingTickets, onKeepTickets }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(pendingTickets.map(t => t.id)));

  const toggleTicket = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size < 1) return;
    onKeepTickets(Array.from(selected));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(17,17,24,0.95)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: 32, maxWidth: 520, width: '90%',
        boxShadow: '0 0 60px rgba(0,229,255,0.1)',
      }}>
        <h2 style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 900,
          fontSize: 22, color: '#fff', marginBottom: 4, textAlign: 'center',
          letterSpacing: '0.05em',
        }}>
          🎫 DESTINATION TICKETS
        </h2>
        <p style={{
          fontSize: 11, color: '#6B7280', textAlign: 'center',
          textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24,
        }}>
          Keep at least 1 · Click to select/deselect
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
          {pendingTickets.map(ticket => {
            const isSelected = selected.has(ticket.id);
            const fromCity = cities[ticket.from];
            const toCity = cities[ticket.to];
            return (
              <button
                key={ticket.id}
                onClick={() => toggleTicket(ticket.id)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(0,119,255,0.12))'
                    : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${isSelected ? '#00E5FF' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                  transition: 'all 0.2s', minWidth: 140,
                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                <p style={{
                  fontFamily: 'Poppins, sans-serif', fontWeight: 900,
                  fontSize: 13, color: '#fff', marginBottom: 4,
                }}>
                  {(fromCity?.name || ticket.from).toUpperCase()}
                </p>
                <p style={{
                  fontSize: 18, color: '#00E5FF', lineHeight: 1, margin: '4px 0',
                }}>
                  ➔
                </p>
                <p style={{
                  fontFamily: 'Poppins, sans-serif', fontWeight: 900,
                  fontSize: 13, color: '#fff', marginBottom: 8,
                }}>
                  {(toCity?.name || ticket.to).toUpperCase()}
                </p>
                <div style={{
                  background: isSelected ? '#00E5FF' : 'rgba(255,255,255,0.08)',
                  color: isSelected ? '#0A0A0F' : '#6B7280',
                  borderRadius: 8, padding: '4px 10px',
                  fontFamily: 'Poppins, sans-serif', fontWeight: 900,
                  fontSize: 16, display: 'inline-block',
                }}>
                  {ticket.points} pts
                </div>
                {isSelected && (
                  <p style={{ fontSize: 10, color: '#00E5FF', marginTop: 6, fontWeight: 700 }}>
                    ✓ KEEPING
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleConfirm}
            disabled={selected.size < 1}
            style={{
              background: selected.size >= 1
                ? 'linear-gradient(135deg, #00E5FF, #0077FF)'
                : 'rgba(255,255,255,0.05)',
              color: selected.size >= 1 ? '#0A0A0F' : '#4B5563',
              border: 'none', borderRadius: 14,
              padding: '12px 40px',
              fontFamily: 'Poppins, sans-serif', fontWeight: 900,
              fontSize: 14, cursor: selected.size >= 1 ? 'pointer' : 'not-allowed',
              letterSpacing: '0.1em',
              boxShadow: selected.size >= 1 ? '0 0 30px rgba(0,229,255,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            CONFIRM ({selected.size} selected)
          </button>
        </div>
      </div>
    </div>
  );
}
