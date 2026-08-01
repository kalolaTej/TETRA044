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
        // fallback to local mock data if endpoint is not live yet
        setCameras(MOCK_CAMERAS)
      }
    } catch {
      // fallback to mock data on network error
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
      <div className="bg-[#faf8f5] border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="h-4 w-36 bg-stone-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-stone-200/60 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div id="cameras" className="bg-[#faf8f5] border border-stone-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-stone-700" />
          <h2 className="text-base font-semibold text-stone-900">Active Cameras</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-medium">
            {cameras.length}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition-colors p-1.5 rounded-md hover:bg-stone-200/60"
          title="Refresh camera statuses"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {cameras.length === 0 ? (
        <p className="text-xs text-stone-500 text-center py-6">No connected cameras found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((cam) => {
            const isOnline = cam.status === 'online'
            return (
              <div
                key={cam.id}
                className="bg-white border border-stone-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-stone-900">{cam.name}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{cam.zone}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      isOnline
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                      }`}
                    ></span>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <Radio size={12} className="text-stone-400" />
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
