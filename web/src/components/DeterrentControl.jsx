import { useState, useEffect, useRef } from 'react'
import { Zap, Volume2, VolumeX, Radio, CheckCircle, AlertCircle, RefreshCw, Sparkles, Monitor } from 'lucide-react'

export default function DeterrentControl() {
  const [esp32Ip, setEsp32Ip] = useState(() => localStorage.getItem('esp32_ip') || '192.168.1.150')
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('esp32_demo_mode') === 'true')
  const [selectedAnimal, setSelectedAnimal] = useState('pig')
  const [durationSec, setDurationSec] = useState(5)
  const [status, setStatus] = useState({ online: false, active: false, checking: false, message: '' })
  const [triggering, setTriggering] = useState(false)
  const [activeAlert, setActiveAlert] = useState(null)

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    localStorage.setItem('esp32_ip', esp32Ip)
  }, [esp32Ip])

  useEffect(() => {
    localStorage.setItem('esp32_demo_mode', demoMode)
  }, [demoMode])

  // Play loud deterrent siren on PC/Browser speaker
  const playBrowserSiren = (animal, durationSeconds) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()

      // Unlock AudioContext for modern Chrome/Edge browser security
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // High frequency pitch siren sound
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.25)
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5)

      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationSeconds)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + durationSeconds)
    } catch (e) {
      console.warn('Audio play warning:', e)
    }
  }

  const checkStatus = async () => {
    if (demoMode || esp32Ip === '10.10.0.2' || esp32Ip.toLowerCase() === 'demo') {
      setStatus({
        online: true,
        active: false,
        checking: false,
        message: 'Connected to ESP32 Hardware Simulator'
      })
      return
    }

    setStatus(prev => ({ ...prev, checking: true }))
    try {
      const res = await fetch(`${backendUrl}/api/esp32/status?ip=${esp32Ip}`, { signal: AbortSignal.timeout(2500) })
      if (res.ok) {
        const json = await res.json()
        const espStatus = json.status || {}
        setStatus({
          online: true,
          active: !!espStatus.active,
          checking: false,
          message: `Connected to ESP32 (${esp32Ip})`
        })
        return
      }
    } catch {
      try {
        const directRes = await fetch(`http://${esp32Ip}/status`, { signal: AbortSignal.timeout(2000) })
        if (directRes.ok) {
          const directJson = await directRes.json()
          setStatus({
            online: true,
            active: !!directJson.active,
            checking: false,
            message: `Connected directly to ESP32 (${esp32Ip})`
          })
          return
        }
      } catch {
        // unreachable
      }
    }

    setStatus({
      online: false,
      active: false,
      checking: false,
      message: `ESP32 unreachable at ${esp32Ip}`
    })
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 6000)
    return () => clearInterval(interval)
  }, [esp32Ip, demoMode])

  const handleTrigger = (animalNameOverride = null) => {
    const animal = animalNameOverride || selectedAnimal
    setTriggering(true)

    // 1. Play loud browser speaker siren & show bright flashing banner
    playBrowserSiren(animal, durationSec)
    setActiveAlert(`⚡ STROBE LIGHT & ${animal.toUpperCase()} DETERRENT SIREN ACTIVATED FOR ${durationSec}s!`)
    setStatus(prev => ({ ...prev, active: true, online: true }))

    const payload = {
      ip: esp32Ip,
      animal: animal,
      duration: durationSec * 1000
    }

    // 2. Send HTTP request to backend / ESP32
    fetch(`${backendUrl}/api/esp32/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      fetch(`http://${esp32Ip}/trigger?animal=${encodeURIComponent(animal)}&duration=${durationSec * 1000}`).catch(() => {})
    })

    setTimeout(() => {
      setTriggering(false)
      setActiveAlert(null)
      checkStatus()
    }, durationSec * 1000)
  }

  const handleStop = () => {
    setActiveAlert('Stopping hardware deterrents...')
    fetch(`http://${esp32Ip}/stop`).catch(() => {})
    setActiveAlert('Hardware Silenced.')
    setStatus(prev => ({ ...prev, active: false }))
    setTimeout(() => setActiveAlert(null), 3000)
  }

  return (
    <div className={`bg-[#fcfbf7] border rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all ${
      status.active ? 'border-red-500 ring-4 ring-red-500/30 bg-red-50/50' : 'border-stone-300/80'
    }`}>
      {/* Background Strobe Flashing animation when active */}
      {status.active && (
        <div className="absolute inset-0 bg-red-600/10 animate-ping pointer-events-none rounded-2xl"></div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="text-amber-600 animate-pulse" size={22} />
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Smart Hardware Deterrent Control (ESP32)
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
              <Sparkles size={10} /> Active Defense
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1 font-medium">
            Manually trigger visual strobe lights, acoustic sirens, and predator MP3 audio on farmland ESP32 nodes.
          </p>
        </div>

        {/* ESP32 IP & Status Badge */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">ESP32 IP:</span>
            <input
              type="text"
              value={esp32Ip}
              onChange={(e) => setEsp32Ip(e.target.value.trim())}
              className="text-xs font-mono font-bold text-stone-900 w-28 outline-none border-b border-dashed border-stone-300 focus:border-amber-600"
              placeholder="192.168.1.150"
            />
          </div>

          <button
            onClick={() => setDemoMode(!demoMode)}
            title="Toggle Demo / Simulation Mode"
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              demoMode
                ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-2xs'
                : 'bg-white text-stone-600 border-stone-300 hover:text-stone-900'
            }`}
          >
            <Monitor size={14} className={demoMode ? 'text-purple-600' : ''} />
            <span>{demoMode ? 'Sim Mode: ON' : 'Sim Mode'}</span>
          </button>

          <button
            onClick={checkStatus}
            title="Refresh ESP32 Connection Status"
            className="p-2 rounded-xl bg-white border border-stone-300 text-stone-600 hover:text-stone-900 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw size={14} className={status.checking ? 'animate-spin text-amber-600' : ''} />
          </button>

          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-bold border ${
              status.online
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-stone-100 text-stone-600 border-stone-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status.online ? 'bg-emerald-500 animate-ping' : 'bg-stone-400'}`} />
            {status.online ? (status.active ? 'TRIGGERED 🚨' : (demoMode || esp32Ip === '10.10.0.2' ? 'ONLINE (SIM)' : 'ONLINE')) : 'OFFLINE'}
          </div>
        </div>
      </div>

      {/* Dynamic Status Alert Banner */}
      {activeAlert && (
        <div className={`mb-5 p-4 rounded-xl border text-xs font-bold flex items-center justify-between transition-all shadow-sm ${
          activeAlert.includes('ACTIVATED')
            ? 'bg-red-600 text-white border-red-700 animate-pulse'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {activeAlert.includes('ACTIVATED') ? <Zap size={20} className="text-yellow-300 animate-bounce" /> : <CheckCircle size={18} />}
            <span className="text-sm">{activeAlert}</span>
          </div>
        </div>
      )}

      {/* Main Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Animal Species Deterrent Selector */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
            Select Species-Specific Deterrent Sound & Light Pattern:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'pig', label: '🐗 Wild Pig / Boar', desc: '12-18kHz Sweep + Strobe' },
              { id: 'cow', label: '🐄 Cow / Cattle', desc: 'Dual Siren + Dog & Tiger Roar' },
              { id: 'goat', label: '🐐 Goat / Dog / Sheep', desc: '18-22kHz Ultrasound + Crackers' },
              { id: 'siren', label: '🚨 General Siren', desc: 'Multi-Tone Alert Siren' }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedAnimal(option.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAnimal === option.id
                    ? 'border-amber-600 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-stone-300/80 bg-white hover:border-stone-400'
                }`}
              >
                <div className="text-xs font-bold text-stone-900">{option.label}</div>
                <div className="text-[10px] text-stone-500 mt-1 font-medium leading-tight">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
            Deterrent Active Duration:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[3, 5, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setDurationSec(sec)}
                className={`py-3 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                  durationSec === sec
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                {sec} Seconds
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={() => handleTrigger()}
          className="flex-1 min-w-[200px] bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
        >
          <Zap size={18} className={triggering ? 'animate-spin' : 'animate-bounce'} />
          <span>DEPLOY DETERRENT NOW (LIGHT & SOUND)</span>
        </button>

        <button
          type="button"
          onClick={handleStop}
          className="bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs px-5 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
        >
          <VolumeX size={16} />
          <span>Emergency Silence</span>
        </button>
      </div>
    </div>
  )
}
