import { useEffect, useState, useCallback } from 'react'
import { Camera, RefreshCw, Radio } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const MOCK_CAMERAS = [
  { id: 'cam_01', name: 'North Field Cam', zone: 'North Field', status: 'online', fps: 24, last_ping: 'Just now' },
  { id: 'cam_02', name: 'South Perimeter', zone: 'South Gate', status: 'online', fps: 30, last_ping: '1m ago' },
  { id: 'cam_03', name: 'East Livestock Barn', zone: 'East Barn', status: 'offline', fps: 0, last_ping: '18m ago' },
]

export default function CameraStatus() {
  const { session } = useAuth()
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
        setCameras(data.cameras || data)
      } else {
        setCameras(MOCK_CAMERAS)
      }
    } catch {
      setCameras(MOCK_CAMERAS)
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

  if (loading) {
    return (
      <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-6 shadow-xs">
        <div className="h-6 w-44 bg-stone-200 rounded animate-shimmer mb-5"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-stone-200/70 rounded-xl animate-shimmer"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div id="cameras" className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Camera size={22} className="text-stone-800" />
          <h2 className="text-lg font-bold text-stone-900">Active Cameras</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-800 font-semibold">
            {cameras.length}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50"
          title="Refresh camera statuses"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {cameras.length === 0 ? (
        <p className="text-sm text-stone-600 text-center py-8">No connected cameras found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cameras.map((cam) => {
            const isOnline = cam.status === 'online'
            return (
              <div
                key={cam.id}
                className="bg-white border border-stone-300/80 rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-stone-400 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{cam.name}</h3>
                    <p className="text-xs text-stone-600 mt-1 font-medium">{cam.zone}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isOnline
                        ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/80'
                        : 'bg-stone-100 text-stone-700 border border-stone-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-stone-500'
                      }`}
                    ></span>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Radio size={14} className="text-stone-500" />
                    {isOnline ? `${cam.fps} FPS` : 'No signal'}
                  </span>
                  <span>{cam.last_ping}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
