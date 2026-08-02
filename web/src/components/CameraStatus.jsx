import { useEffect, useState, useCallback } from 'react'
import { Camera, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ANIMAL_IMAGES } from '../lib/animalImages'

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
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.cameras)
          ? data.cameras
          : []

        const formatted = items.map((cam, idx) => {
          const isOnline = cam.status === 'online' || cam.status === true
          return {
            ...cam,
            status: isOnline ? 'online' : 'offline',
            fps: isOnline ? (cam.fps || 24) : 0,
            last_ping: isOnline ? (cam.last_ping || 'Just now') : 'Offline',
            preview: cam.preview || Object.values(ANIMAL_IMAGES)[idx % 4] || ANIMAL_IMAGES.cow
          }
        })

        setCameras(formatted)
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

  const cameraList = Array.isArray(cameras) ? cameras : []

  if (loading) {
    return (
      <div className="card-base p-6 space-y-4">
        <div className="h-6 w-44 bg-stone-200 rounded animate-shimmer"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-stone-200/70 rounded-xl animate-shimmer"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div id="cameras" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Camera size={20} className="text-[#6B8E23]" />
          <h2 className="text-lg font-extrabold text-[#2F2F2F] tracking-tight">Active Edge Cameras</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8FAF5A]/15 text-[#2D3D12] font-extrabold">
            {cameraList.length} Nodes
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-[#666666] hover:text-[#2F2F2F] transition-colors px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] shadow-2xs cursor-pointer"
          title="Refresh camera status telemetry"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#8FAF5A]' : ''} />
          <span>Refresh Status</span>
        </button>
      </div>

      {cameraList.length === 0 ? (
        <div className="text-center py-10 card-base space-y-1">
          <ShieldAlert size={32} className="mx-auto text-[#8A8A8A] opacity-60" />
          <p className="text-sm font-bold text-[#2F2F2F]">No active camera nodes connected.</p>
          <p className="text-xs text-[#666666] font-medium">Verify camera RTSP stream configuration in Settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cameraList.map((cam, idx) => {
            const isOnline = cam?.status === 'online' || cam?.status === true
            return (
              <div
                key={cam?.id || idx}
                className="card-base card-interactive overflow-hidden flex flex-col justify-between"
              >
                {/* camera stream preview header */}
                <div className="relative h-28 bg-stone-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={cam?.preview || ANIMAL_IMAGES.cow}
                    alt={cam?.name || 'Camera'}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-opacity ${
                      isOnline ? 'opacity-80 hover:opacity-95' : 'opacity-35 grayscale'
                    }`}
                    onError={(e) => {
                      e.currentTarget.src = ANIMAL_IMAGES.cow
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {cam?.resolution || '1080p'}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isOnline
                          ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                          : 'bg-[#F3F4F6] text-[#6B7280] border border-[#D1D5DB]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#059669]' : 'bg-[#9CA3AF]'}`}></span>
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                {/* camera card body details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#2F2F2F]">{cam?.name || 'Camera Node'}</h3>
                    <p className="text-xs text-[#666666] font-medium">{cam?.zone || 'Zone'} • {cam?.id || 'cam_01'}</p>
                  </div>

                  <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#666666] font-medium">
                    <span className="flex items-center gap-1">
                      {isOnline ? <CheckCircle2 size={13} className="text-[#059669]" /> : <AlertCircle size={13} className="text-[#DC2626]" />}
                      {isOnline ? `${cam?.fps || 24} FPS` : 'No Signal'}
                    </span>
                    <span className="text-[11px] text-[#8A8A8A]">{isOnline ? (cam?.last_ping || 'Just now') : 'Offline'}</span>
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
