import React from 'react'
import { ExternalLink, Link as LinkIcon, Tv } from 'lucide-react'

interface CastModalProps {
  roomCode: string
  onClose: () => void
}

export function CastModal({ roomCode, onClose }: CastModalProps) {
  const url = `${window.location.protocol}//${window.location.host}/tv/${roomCode}`

  const handleNewWindow = () => {
    window.open(url, 'TV_VIEW', 'noopener,width=1920,height=1080')
    onClose()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url)
    alert("TV view link copied! You can send this to yourself and open it on your TV's browser.")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Tv className="w-6 h-6 text-[#00E5FF]" />
          <h3 className="text-xl font-poppins font-bold text-white">TV Display Setup</h3>
        </div>
        <p className="text-[#9CA3AF] text-sm mb-6 leading-relaxed">
          To show the game on your Smart TV, you can use one of these methods:
          <br /><br />
          1. <b>HDMI Cable:</b> Connect this device directly to your TV and click "Open in New Window".
          <br />
          2. <b>TV Browser:</b> Copy the link and open it using your Smart TV's built-in web browser.
          <br />
          3. <b>Screen Mirroring:</b> Use Apple AirPlay or Google Cast to mirror your entire screen to the TV.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleNewWindow}
            className="w-full py-3 bg-[#00E5FF] hover:bg-[#00B3CC] text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Open in New Window
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-[#D1D5DB] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-5 h-5" />
            Copy TV Link
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 mt-2 text-[#6B7280] hover:text-white font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
