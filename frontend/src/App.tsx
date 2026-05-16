import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { HostView } from './pages/HostView'
import { PlayerView } from './pages/PlayerView'
import { wsClient } from './lib/wsClient'

function Landing() {
  const [room, setRoom] = useState('')
  const [nickname, setNickname] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const createRoom = async () => {
    setCreating(true)
    try {
      const host = window.location.hostname;
      const res = await fetch(`http://${host}:8080/api/rooms/create`)
      const data = await res.json()
      navigate(`/host/${data.roomCode}`)
    } catch (e) {
      // Fallback to random room code if backend not reachable
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      navigate(`/host/${code}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="landing-container">
      <div className="glass-panel">
        <h1>Social Gaming Hub</h1>
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Room Code" 
            value={room} 
            onChange={e => setRoom(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <input 
            type="text" 
            placeholder="Nickname" 
            value={nickname} 
            onChange={e => setNickname(e.target.value)}
            maxLength={12}
          />
          <button 
            className="primary-btn"
            onClick={() => navigate(`/play?room=${room}&name=${nickname}`)}
            disabled={!room || !nickname}
          >
            Join Game
          </button>
        </div>
        <div className="divider">or</div>
        <button 
          className="secondary-btn"
          onClick={createRoom}
          disabled={creating}
        >
          {creating ? 'Creating Room...' : 'Create Room (Host TV)'}
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host/:room" element={<HostView />} />
        <Route path="/play" element={<PlayerView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
