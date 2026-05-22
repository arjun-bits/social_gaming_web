import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { HostView } from './pages/HostView'
import { PlayerView } from './pages/PlayerView'
import { LobbyPage } from './pages/LobbyPage'
import { TVPage } from './pages/TVPage'
import { CLIENT_GAME_REGISTRY } from './games/gameRegistry'

/* ── Landing / Home Page ── */
function Landing() {
  const [joinRoom, setJoinRoom] = useState('')
  const [nickname, setNickname] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'join' | 'host'>('join')
  const [hostRoom, setHostRoom] = useState('')
  const [hostNickname, setHostNickname] = useState('TV Host')
  const navigate = useNavigate()

  const createRoom = async () => {
    setCreating(true)
    const code = hostRoom.trim() ? hostRoom.trim().toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase()
    const nameParam = hostNickname.trim() ? `?name=${encodeURIComponent(hostNickname.trim())}` : ''
    navigate(`/lobby/${code}${nameParam}`)
    setCreating(false)
  }

  const joinGame = () => {
    if (!joinRoom.trim() || !nickname.trim()) return
    navigate(`/play?room=${joinRoom.trim().toUpperCase()}&name=${encodeURIComponent(nickname.trim())}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 60% 0%, rgba(0,229,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 100%, rgba(255,0,127,0.07) 0%, transparent 50%), #0A0A0F',
      }}
    >
      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#FF007F]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="flex flex-col items-center gap-4 mb-12 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00E5FF] to-[#0077FF] flex items-center justify-center text-black font-poppins font-black text-xl shadow-blue">P</div>
          <div>
            <h1 className="font-poppins font-black text-4xl text-white leading-none">
              Party<span className="text-[#FF007F]">Hub</span>
            </h1>
            <p className="text-[#6B7280] text-xs uppercase tracking-[0.3em]">Social Gaming Platform</p>
          </div>
        </div>
      </div>

      {/* Game Cards preview */}
      <div className="w-full max-w-2xl mb-10 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <p className="text-[9px] uppercase tracking-[0.35em] text-[#6B7280] text-center mb-4">Available Games</p>
        <div className="grid grid-cols-3 gap-3">
          {CLIENT_GAME_REGISTRY.map(meta => (
            <div
              key={meta.gameId}
              className={`rounded-2xl border p-4 text-center transition-all ${meta.comingSoon ? 'opacity-35 border-white/5' : 'border-white/10 hover:border-white/20 hover:-translate-y-0.5'}`}
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="text-3xl mb-2">{meta.icon}</div>
              <p className="font-poppins font-bold text-sm text-white leading-tight">{meta.displayName}</p>
              {meta.comingSoon && <p className="text-[9px] text-[#4B5563] uppercase tracking-wider mt-1">Coming Soon</p>}
              {!meta.comingSoon && <p className="text-[9px] text-[#6B7280] mt-1">{meta.tags[2]}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '120ms' }}>
        <div className="glass-panel">
          {/* Tab switcher */}
          <div className="flex bg-black/30 rounded-xl p-1 mb-6">
            <button
              id="tab-join"
              className="flex-1 py-2 rounded-lg text-sm font-poppins font-bold transition-all"
              style={{
                background: activeTab === 'join' ? 'rgba(0,229,255,0.15)' : 'transparent',
                color: activeTab === 'join' ? '#00E5FF' : '#6B7280',
              }}
              onClick={() => setActiveTab('join')}
            >
              Join Game
            </button>
            <button
              id="tab-host"
              className="flex-1 py-2 rounded-lg text-sm font-poppins font-bold transition-all"
              style={{
                background: activeTab === 'host' ? 'rgba(255,0,127,0.15)' : 'transparent',
                color: activeTab === 'host' ? '#FF007F' : '#6B7280',
              }}
              onClick={() => setActiveTab('host')}
            >
              Host a Game
            </button>
          </div>

          {activeTab === 'join' ? (
            <div className="space-y-4">
              <div className="input-group">
                <input
                  id="input-room-code"
                  type="text"
                  placeholder="Room Code (6 letters)"
                  value={joinRoom}
                  onChange={e => setJoinRoom(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinGame()}
                  maxLength={6}
                  autoComplete="off"
                />
                <input
                  id="input-nickname"
                  type="text"
                  placeholder="Your Nickname"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinGame()}
                  maxLength={14}
                  autoComplete="off"
                />
              </div>
              <button
                id="btn-join-game"
                className="primary-btn w-full text-lg"
                onClick={joinGame}
                disabled={!joinRoom.trim() || !nickname.trim()}
              >
                Join → Play
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="input-group">
                <input
                  id="input-host-room"
                  type="text"
                  placeholder="Custom Room Code (Optional)"
                  value={hostRoom}
                  onChange={e => setHostRoom(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && createRoom()}
                  maxLength={12}
                  autoComplete="off"
                />
                <input
                  id="input-host-nickname"
                  type="text"
                  placeholder="Your Nickname"
                  value={hostNickname}
                  onChange={e => setHostNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createRoom()}
                  maxLength={14}
                  autoComplete="off"
                />
              </div>
              <button
                id="btn-create-room"
                className="w-full py-4 rounded-xl font-poppins font-black text-lg text-white transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #FF007F 0%, #C0006B 100%)',
                  boxShadow: creating ? 'none' : '0 0 30px rgba(255,0,127,0.3)',
                }}
                onClick={createRoom}
                disabled={creating}
              >
                {creating ? 'Creating Room...' : '🎮 Create Room'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-[#4B5563] text-[10px] uppercase tracking-[0.3em]">
        Midnight Arcade · Best played on a local network
      </p>
    </div>
  )
}

/* ── App with Routes ── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/lobby/:room" element={<LobbyPage />} />
        <Route path="/host/:room" element={<HostView />} />
        <Route path="/tv/:room" element={<TVPage />} />
        <Route path="/play" element={<PlayerView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
