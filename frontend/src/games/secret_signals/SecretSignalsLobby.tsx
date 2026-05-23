export function SecretSignalsLobby({ players, playerTeams, playerIsLeader }: {
    players: any[],
    playerTeams: Record<string, string>,
    playerIsLeader: Record<string, boolean>
}) {
    // Categorize players
    const unassigned = players.filter(p => !playerTeams[p.id])
    const teamA = players.filter(p => playerTeams[p.id] === 'teamA')
    const teamB = players.filter(p => playerTeams[p.id] === 'teamB')

    return (
        <div className="flex flex-col gap-6 animate-slide-up">
            
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-white font-poppins font-black text-2xl tracking-tight">Configure Teams</h2>
                    <p className="text-[#6B7280] text-sm mt-1">Review team compositions and roles before launching.</p>
                </div>
            </div>

            {/* Unassigned Pool */}
            <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#6B7280] mb-3">Unassigned Players ({unassigned.length})</h3>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {unassigned.length === 0 ? (
                        <p className="text-[#4B5563] text-sm italic w-full text-center">All players are assigned</p>
                    ) : (
                        unassigned.map(p => (
                            <div key={p.uuid} className="px-3 py-1.5 rounded-lg bg-white/5 text-[#9CA3AF] text-sm">
                                {p.nickname}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Team Blue */}
                <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="text-[#00E5FF] font-poppins font-black text-lg tracking-wide flex items-center justify-between">
                        TEAM BLUE
                        <span className="text-xs bg-[#00E5FF]/20 px-2 py-1 rounded-md">{teamA.length} Players</span>
                    </h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60">Spymaster</span>
                            <div className="flex flex-wrap gap-2">
                                {teamA.filter(p => playerIsLeader[p.id]).map(p => (
                                    <div key={p.id} className="px-3 py-1.5 rounded-lg bg-[#00E5FF] text-black font-bold text-sm shadow-[0_0_10px_#00E5FF88]">
                                        {p.nickname}
                                    </div>
                                ))}
                                {teamA.filter(p => playerIsLeader[p.id]).length === 0 && (
                                    <div className="px-3 py-1.5 rounded-lg border border-dashed border-[#00E5FF]/30 text-[#00E5FF]/50 text-xs italic">Needs Spymaster</div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60">Operatives</span>
                            <div className="flex flex-wrap gap-2">
                                {teamA.filter(p => !playerIsLeader[p.id]).map(p => (
                                    <div key={p.id} className="px-3 py-1.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 text-sm">
                                        {p.nickname}
                                    </div>
                                ))}
                                {teamA.filter(p => !playerIsLeader[p.id]).length === 0 && (
                                    <div className="px-3 py-1.5 rounded-lg border border-dashed border-[#00E5FF]/30 text-[#00E5FF]/50 text-xs italic">Needs Operatives</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Pink */}
                <div className="bg-[#FF007F]/5 border border-[#FF007F]/20 rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="text-[#FF007F] font-poppins font-black text-lg tracking-wide flex items-center justify-between">
                        TEAM PINK
                        <span className="text-xs bg-[#FF007F]/20 px-2 py-1 rounded-md">{teamB.length} Players</span>
                    </h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#FF007F]/60">Spymaster</span>
                            <div className="flex flex-wrap gap-2">
                                {teamB.filter(p => playerIsLeader[p.id]).map(p => (
                                    <div key={p.id} className="px-3 py-1.5 rounded-lg bg-[#FF007F] text-white font-bold text-sm shadow-[0_0_10px_#FF007F88]">
                                        {p.nickname}
                                    </div>
                                ))}
                                {teamB.filter(p => playerIsLeader[p.id]).length === 0 && (
                                    <div className="px-3 py-1.5 rounded-lg border border-dashed border-[#FF007F]/30 text-[#FF007F]/50 text-xs italic">Needs Spymaster</div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#FF007F]/60">Operatives</span>
                            <div className="flex flex-wrap gap-2">
                                {teamB.filter(p => !playerIsLeader[p.id]).map(p => (
                                    <div key={p.id} className="px-3 py-1.5 rounded-lg bg-[#FF007F]/10 text-[#FF007F] border border-[#FF007F]/20 text-sm">
                                        {p.nickname}
                                    </div>
                                ))}
                                {teamB.filter(p => !playerIsLeader[p.id]).length === 0 && (
                                    <div className="px-3 py-1.5 rounded-lg border border-dashed border-[#FF007F]/30 text-[#FF007F]/50 text-xs italic">Needs Operatives</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
