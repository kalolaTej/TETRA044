import { useEffect, useState, useCallback } from 'react'
import { Camera, RefreshCw, Radio } from 'lucide-react'

export default function CameraStatus() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchCameras = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const res = await fetch(`${backendUrl}/api/cameras`)
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
  }, [])

  useEffect(() => {
    fetchCameras()
    const timer = setInterval(fetchCameras, 3000)
    return () => clearInterval(timer)
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
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300">
            {cameras.filter((c) => c.status === 'online').length} Online
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 shadow-2xs"
          title="Refresh camera status"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {cameras.length === 0 ? (
        <div className="p-8 text-center bg-white border border-stone-200 rounded-xl">
          <p className="text-sm font-medium text-stone-600">No registered cameras found in database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cameras.map((cam) => {
            const isOnline = cam.status === 'online' || cam.status === true
            return (
              <div
                key={cam.id || cam.name}
                className="bg-white border border-stone-300/80 rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-stone-400 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{cam.name || 'Edge Camera'}</h3>
                    <p className="text-xs text-stone-600 mt-1 font-medium">{cam.zone || 'Field Zone'}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isOnline
                        ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300'
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
                    <Radio size={14} className={isOnline ? 'text-emerald-600' : 'text-stone-400'} />
                    {isOnline ? `${cam.fps || 30} FPS` : 'No signal'}
                  </span>
                  <span>{cam.last_ping || 'No recent signal'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
