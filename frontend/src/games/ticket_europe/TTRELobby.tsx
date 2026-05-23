/**
 * TTRELobby — Configure screen for Ticket to Ride Europe
 * Players are assigned train colors; host can auto-assign or manually pick.
 */

import { useState, useEffect } from 'react'

const TRAIN_COLORS = [
  { id: 'red',    label: 'Red',    hex: '#E53E3E', emoji: '🔴' },
  { id: 'blue',   label: 'Blue',   hex: '#3182CE', emoji: '🔵' },
  { id: 'green',  label: 'Green',  hex: '#38A169', emoji: '🟢' },
  { id: 'yellow', label: 'Yellow', hex: '#D69E2E', emoji: '🟡' },
  { id: 'black',  label: 'Black',  hex: '#718096', emoji: '⚫' },
]

interface TTRELobbyProps {
  players: { uuid: string; nickname: string; isConnected?: boolean }[]
  onStartReady?: (colorMap: Record<string, string>) => void
}

export function TTRELobby({ players, onStartReady }: TTRELobbyProps) {
  const [colorMap, setColorMap] = useState<Record<string, string>>({})

  // Auto-assign colors when players list changes
  useEffect(() => {
    const newMap: Record<string, string> = {}
    players.forEach((p, idx) => {
      newMap[p.uuid] = colorMap[p.uuid] || TRAIN_COLORS[idx % TRAIN_COLORS.length].id
    })
    setColorMap(newMap)
  }, [players.length])

  const assignColor = (playerId: string, colorId: string) => {
    // Swap: if color already taken, swap with the player who had it
    const existing = Object.entries(colorMap).find(([, c]) => c === colorId && playerId !== Object.keys(colorMap).find(k => colorMap[k] === colorId))
    const newMap = { ...colorMap }
    if (existing) {
      // Swap colors
      const otherPlayerId = existing[0]
      newMap[otherPlayerId] = colorMap[playerId] || TRAIN_COLORS[0].id
    }
    newMap[playerId] = colorId
    setColorMap(newMap)
    if (onStartReady) onStartReady(newMap)
  }

  const autoAssign = () => {
    const newMap: Record<string, string> = {}
    players.forEach((p, idx) => {
      newMap[p.uuid] = TRAIN_COLORS[idx % TRAIN_COLORS.length].id
    })
    setColorMap(newMap)
    if (onStartReady) onStartReady(newMap)
  }

  const allAssigned = players.every(p => colorMap[p.uuid])

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-poppins font-black text-2xl text-white">Assign Train Colors</h2>
          <p className="text-[#6B7280] text-sm mt-1">Each player picks their train color for the board.</p>
        </div>
        <button
          onClick={autoAssign}
          className="px-4 py-2 rounded-xl font-bold text-sm border border-[#FF5733]/40 text-[#FF5733] hover:bg-[#FF5733]/10 transition"
        >
          🎲 Auto-Assign
        </button>
      </div>

      {/* Player Color Grid */}
      <div className="grid gap-4">
        {players.map((player) => {
          const assignedColorId = colorMap[player.uuid]
          const assignedColor = TRAIN_COLORS.find(c => c.id === assignedColorId)
          return (
            <div
              key={player.uuid}
              className="bg-[#111118] rounded-2xl border border-white/5 p-4 flex items-center gap-4"
            >
              {/* Player info */}
              <div className="flex items-center gap-3 w-28 shrink-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: player.isConnected ? '#4ade80' : '#6B7280' }}
                />
                <span className="font-poppins font-bold text-white text-sm truncate">{player.nickname}</span>
              </div>

              {/* Color picker */}
              <div className="flex gap-2 flex-wrap">
                {TRAIN_COLORS.map(color => {
                  const takenBy = Object.entries(colorMap).find(([pid, c]) => c === color.id && pid !== player.uuid)
                  const isSelected = assignedColorId === color.id
                  return (
                    <button
                      key={color.id}
                      onClick={() => assignColor(player.uuid, color.id)}
                      title={takenBy ? `Swap with ${players.find(p => p.uuid === takenBy[0])?.nickname}` : color.label}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected
                          ? 'scale-110 shadow-lg border-white'
                          : takenBy
                            ? 'border-transparent opacity-50 hover:opacity-80'
                            : 'border-transparent hover:scale-105 hover:border-white/30'
                        }`}
                      style={{ background: color.hex }}
                    >
                      {isSelected && (
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                          <path d="M1 5.5L5 9.5L13 1.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {!isSelected && takenBy && (
                        <span className="text-white text-[8px] font-black">⇄</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Assigned color badge */}
              {assignedColor && (
                <div
                  className="ml-auto px-3 py-1 rounded-full text-xs font-bold text-white shrink-0"
                  style={{ background: assignedColor.hex + 'CC' }}
                >
                  {assignedColor.emoji} {assignedColor.label}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Status */}
      {players.length === 0 && (
        <div className="text-center text-[#6B7280] italic py-8">
          Add players to configure colors...
        </div>
      )}

      {players.length > 0 && !allAssigned && (
        <p className="text-yellow-500 text-sm text-center">⚠️ All players must have a color assigned</p>
      )}

      {allAssigned && (
        <p className="text-green-400 text-sm text-center font-bold">✓ All colors assigned — ready to launch!</p>
      )}
    </div>
  )
}
