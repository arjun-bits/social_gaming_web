import { useState } from 'react';
import type { Ticket } from '../../../../core/engine/ticket_europe/models';
import { cities } from '../../../../core/engine/ticket_europe/boardData';

interface Props {
  pendingTickets: Ticket[];
  onConfirm: (keepTicketIds: string[]) => void;
}

export function TicketModal({ pendingTickets, onConfirm }: Props) {
  // By default, select all tickets (standard Ticket to Ride player behavior)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    pendingTickets.map(t => t.id)
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      // Must keep at least 1 ticket!
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(x => x !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleConfirm = () => {
    if (selectedIds.length >= 1) {
      onConfirm(selectedIds);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 select-none animate-fade-in">
      <div className="bg-[#0f0f16]/90 border border-white/10 rounded-3xl max-w-lg w-full p-6 text-center shadow-2xl backdrop-blur-xl animate-pop-in flex flex-col gap-6">
        
        {/* Title & Rules */}
        <div>
          <span className="text-amber-500 text-3xl mb-2 block">🎫</span>
          <h2 className="font-poppins font-black text-2xl text-white tracking-wide uppercase">
            Choose Destination Tickets
          </h2>
          <p className="text-[#9CA3AF] text-xs mt-1">
            Choose which tickets to keep. You <strong className="text-amber-400">must keep at least 1 ticket</strong>. Unselected tickets will return to the deck.
          </p>
        </div>

        {/* Tickets Checklist Section */}
        <div className="flex flex-col gap-3">
          {pendingTickets.map((ticket) => {
            const isChecked = selectedIds.includes(ticket.id);
            const cFrom = cities[ticket.from]?.name || ticket.from;
            const cTo = cities[ticket.to]?.name || ticket.to;
            
            return (
              <div 
                key={ticket.id} 
                onClick={() => toggleSelect(ticket.id)}
                className={`group relative rounded-2xl p-4 border flex items-center justify-between gap-4 cursor-pointer transition-all active:scale-[0.98] ${
                  isChecked 
                    ? 'bg-[#fb8500]/10 border-[#fb8500]/40 shadow-[0_0_15px_rgba(251,133,0,0.1)]' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                }`}
              >
                {/* Left: Checkbox Icon */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  isChecked 
                    ? 'border-[#fb8500] bg-[#fb8500] text-black font-extrabold text-[10px]' 
                    : 'border-white/30 group-hover:border-white/50'
                }`}>
                  {isChecked && '✓'}
                </div>

                {/* Center: City Names */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white text-xs font-black uppercase tracking-wider truncate max-w-[140px]">
                      {cFrom}
                    </span>
                    <span className="text-amber-500/80 text-[10px] font-black">➔</span>
                    <span className="text-white text-xs font-black uppercase tracking-wider truncate max-w-[140px]">
                      {cTo}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-[#4B5563] font-bold block mt-0.5">
                    Connection Path
                  </span>
                </div>

                {/* Right: Point Value Badge */}
                <div className="shrink-0 flex flex-col items-end">
                  <span className={`text-lg font-black tracking-tight leading-none ${
                    isChecked ? 'text-[#fb8500] drop-shadow' : 'text-[#9CA3AF]'
                  }`}>
                    {ticket.points}
                  </span>
                  <span className="text-[7px] uppercase tracking-wider text-[#4B5563] font-extrabold mt-0.5">
                    Points
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
            className="flex-1 py-3.5 rounded-2xl font-poppins font-black text-sm text-[#0A0A0F] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            style={{ 
              background: 'linear-gradient(135deg, #ffb703, #fb8500)',
              boxShadow: selectedIds.length > 0 ? '0 0 25px rgba(251,133,0,0.25)' : 'none'
            }}
          >
            ✓ Confirm Selection ({selectedIds.length} Kept)
          </button>
        </div>

      </div>
    </div>
  );
}
