import { useState, useEffect, useCallback } from 'react'
import { Camera, RefreshCw, Radio, Filter, Video } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const INITIAL_CAMERAS = []

export default function Cameras() {
  const { session } = useAuth()
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedZone, setSelectedZone] = useState('All')

  const fetchCameras = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${backendUrl}/api/cameras`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = data.data || data.cameras || (Array.isArray(data) ? data : [])
        setCameras(items)
      } else {
        setCameras([])
      }
    } catch {
      setCameras([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  useEffect(() => {
    fetchCameras()
  }, [fetchCameras])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCameras()
  }

  const zones = ['All', ...new Set(cameras.map((c) => c.zone))]
  const filteredCameras = selectedZone === 'All' 
    ? cameras 
    : cameras.filter((c) => c.zone === selectedZone)

  return (
    <div className="space-y-6">
      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Camera Management</h1>
          <p className="text-sm text-stone-500 mt-1">Live camera streams, telemetry status, and perimeter coverage.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : ''} />
            <span>Refresh feeds</span>
          </button>
        </div>
      </div>

      {/* zone filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-stone-500 font-medium flex items-center gap-1 mr-1">
          <Filter size={14} /> Zone:
        </span>
        {zones.map((zone) => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              selectedZone === zone
                ? 'bg-stone-900 text-white'
                : 'bg-stone-200/60 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* camera grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 bg-stone-200/60 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCameras.map((cam) => {
            const isOnline = cam.status === 'online'
            return (
              <div
                key={cam.id}
                className="bg-[#faf8f5] border border-stone-200 rounded-xl overflow-hidden shadow-xs hover:border-stone-300 transition-all flex flex-col"
              >
                {/* camera stream preview header */}
                <div className="relative h-36 bg-stone-900 flex items-center justify-center text-stone-400">
                  <Video size={32} className="opacity-40" />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded">
                    {cam.resolution || '1080p'}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                        isOnline
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-stone-700 text-stone-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-white animate-pulse' : 'bg-stone-400'
                        }`}
                      ></span>
                      {isOnline ? 'LIVE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                {/* camera info details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-semibold text-stone-900 text-sm">{cam.name}</h3>
                    <p className="text-xs text-stone-500">{cam.zone} • ID: {cam.id}</p>
                  </div>

                  <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-600">
                    <span className="flex items-center gap-1">
                      <Radio size={13} className="text-stone-400" />
                      {isOnline ? `${cam.fps} FPS` : 'No Signal'}
                    </span>
                    <span className="text-[11px] text-stone-400">Last ping: {cam.last_ping}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
