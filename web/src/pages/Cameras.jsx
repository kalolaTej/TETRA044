import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Filter, CheckCircle2, AlertCircle, Plus, Video, Radio, Layers, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ANIMAL_IMAGES } from '../lib/animalImages'
import AddCameraModal from '../components/AddCameraModal'

const STORAGE_KEY = 'tetra_custom_cameras_v1'

const loadCustomCameras = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const saveCustomCamera = (cam) => {
  try {
    const current = loadCustomCameras()
    const updated = [cam, ...current.filter((c) => c.id !== cam.id)]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export default function Cameras() {
  const { session } = useAuth()
  const [cameras, setCameras] = useState(() => loadCustomCameras())
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedZone, setSelectedZone] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const fetchFarms = useCallback(async () => {
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${backendUrl}/api/farms`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setFarms(items)
      }
    } catch {
      // ignore
    }
  }, [backendUrl, session])

  const fetchCameras = useCallback(async () => {
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
          : null

        if (items && items.length > 0) {
          const apiFormatted = items.map((c, i) => {
            // Strictly check boolean, string, or numeric online/offline status
            let isCamOnline = false
            if (typeof c.status === 'boolean') {
              isCamOnline = c.status
            } else if (typeof c.status === 'string') {
              isCamOnline = c.status.toLowerCase() === 'online' || c.status.toLowerCase() === 'true'
            } else if (typeof c.status === 'number') {
              isCamOnline = c.status === 1
            }

            return {
              ...c,
              status: isCamOnline ? 'online' : 'offline',
              fps: isCamOnline ? (c.fps || 24) : 0,
              resolution: c.resolution || '1080p',
              last_ping: c.last_ping || (isCamOnline ? 'Just now' : 'No signal'),
              preview: c.preview || Object.values(ANIMAL_IMAGES)[i % 4] || ANIMAL_IMAGES.cow,
            }
          })

          setCameras((prev) => {
            const customList = loadCustomCameras()
            const allCombined = [...customList, ...apiFormatted]

            const seenIds = new Set()
            const uniqueCameras = []
            for (const c of allCombined) {
              if (c && c.id && !seenIds.has(c.id)) {
                seenIds.add(c.id)
                uniqueCameras.push(c)
              }
            }
            return uniqueCameras
          })
        }
      }
    } catch {
      // keep existing state
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [backendUrl, session])

  useEffect(() => {
    fetchCameras()
    fetchFarms()
  }, [fetchCameras, fetchFarms])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCameras()
  }

  const handleCameraAdded = (newCam) => {
    // New added camera defaults to offline until active RTSP connection responds
    const isCamOnline = newCam.status === true || newCam.status === 'online'
    const formatted = {
      ...newCam,
      status: isCamOnline ? 'online' : 'offline',
      fps: isCamOnline ? 24 : 0,
      resolution: '1080p',
      last_ping: isCamOnline ? 'Just now' : 'Connecting...',
      preview: ANIMAL_IMAGES.cow,
    }

    saveCustomCamera(formatted)
    setCameras((prev) => [formatted, ...prev.filter((c) => c.id !== formatted.id)])
    setSelectedZone('All')
  }

  const toggleCameraStatus = async (camId, currentStatus) => {
    const isCurrentlyOnline = currentStatus === 'online' || currentStatus === true
    const newStatusStr = isCurrentlyOnline ? 'offline' : 'online'
    const newStatusBool = !isCurrentlyOnline

    // Optimistic UI state update
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === camId) {
          const updated = {
            ...c,
            status: newStatusStr,
            fps: newStatusBool ? 24 : 0,
            last_ping: newStatusBool ? 'Just now' : 'Offline',
          }
          saveCustomCamera(updated)
          return updated
        }
        return c
      })
    )

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      await fetch(`${backendUrl}/api/cameras/${camId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatusBool }),
      })
    } catch {
      // ignore
    }
  }

  const cameraList = Array.isArray(cameras) ? cameras : []
  const zones = ['All', ...new Set(cameraList.map((c) => c?.zone).filter(Boolean))]
  const filteredCameras = selectedZone === 'All' 
    ? cameraList 
    : cameraList.filter((c) => c?.zone === selectedZone)

  return (
    <div className="space-y-6">
      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Camera Management & Monitoring</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#8FAF5A]/15 text-[#8FAF5A] border border-[#8FAF5A]/30">
              {cameraList.length} Nodes
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-1 font-medium">Live RTSP/IP camera streams, telemetry health status, and multi-node perimeter coverage.</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8FAF5A] hover:bg-[#7A9949] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={15} />
            <span>Add IP Camera</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] text-[#2F2F2F] text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#8FAF5A]' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* zone filter pills */}
      {zones.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-[#666666] font-semibold flex items-center gap-1 mr-1 shrink-0">
            <Filter size={14} /> Filter Zone:
          </span>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1 text-xs rounded-full font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedZone === zone
                  ? 'bg-[#8FAF5A] text-white shadow-2xs'
                  : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#666666] hover:bg-[#FAFBF8]'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      )}

      {/* camera grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-stone-200/70 rounded-xl animate-shimmer"></div>
          ))}
        </div>
      ) : cameraList.length === 0 ? (
        <div className="text-center py-16 card-base space-y-3 p-8">
          <ShieldAlert size={40} className="mx-auto text-[#8A8A8A] opacity-60" />
          <h3 className="text-base font-extrabold text-[#2F2F2F]">No Registered Camera Nodes Found</h3>
          <p className="text-xs text-[#666666] font-medium max-w-md mx-auto">
            You currently have zero active IP cameras connected. Click the button below to register a new RTSP camera stream.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8FAF5A] hover:bg-[#7A9949] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Your First IP Camera</span>
          </button>
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#E5E7EB]">
          <Layers size={32} className="mx-auto text-[#8A8A8A] mb-2" />
          <p className="text-sm font-bold text-[#2F2F2F]">No cameras found in zone "{selectedZone}"</p>
          <button
            onClick={() => setSelectedZone('All')}
            className="mt-3 text-xs font-bold text-[#8FAF5A] hover:underline cursor-pointer"
          >
            Reset Zone Filter to Show All Cameras ({cameraList.length})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCameras.map((cam, idx) => {
            const isOnline = cam?.status === 'online' || cam?.status === true
            return (
              <div
                key={cam?.id || idx}
                className="card-base card-interactive overflow-hidden flex flex-col justify-between"
              >
                {/* stream preview header */}
                <div className="relative h-40 bg-stone-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={cam?.preview || ANIMAL_IMAGES.cow}
                    alt={cam?.name || 'Camera'}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-opacity ${
                      isOnline ? 'opacity-85 hover:opacity-100' : 'opacity-40 grayscale'
                    }`}
                    onError={(e) => {
                      e.currentTarget.src = ANIMAL_IMAGES.cow
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                    <Video size={12} className={isOnline ? 'text-[#8FAF5A]' : 'text-stone-400'} />
                    {cam?.resolution || '1080p'}
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => toggleCameraStatus(cam.id, cam.status)}
                      title="Click to toggle online/offline status"
                      className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full transition-transform active:scale-95 cursor-pointer ${
                        isOnline
                          ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                          : 'bg-[#F3F4F6] text-[#6B7280] border border-[#D1D5DB]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#059669]' : 'bg-[#9CA3AF]'}`}></span>
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>
                  </div>
                </div>

                {/* camera info details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#2F2F2F] text-sm truncate">{cam?.name || 'Camera Node'}</h3>
                      <span className="text-[10px] font-mono text-[#8A8A8A] bg-stone-100 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                        {cam?.id?.substring(0, 8)}...
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] font-medium mt-0.5">{cam?.zone || 'Zone'}</p>
                    {cam?.source_url && (
                      <p className="text-[11px] font-mono text-[#8FAF5A] truncate mt-1 flex items-center gap-1">
                        <Radio size={11} className="shrink-0" />
                        <span className="truncate">{cam.source_url}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#666666] font-medium">
                    <span className="flex items-center gap-1">
                      {isOnline ? <CheckCircle2 size={13} className="text-[#059669]" /> : <AlertCircle size={13} className="text-[#DC2626]" />}
                      {isOnline ? `${cam?.fps || 24} FPS` : 'No Signal'}
                    </span>
                    <span className="text-[11px] text-[#8A8A8A]">Ping: {cam?.last_ping || (isOnline ? 'Just now' : 'Offline')}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Camera Modal */}
      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCameraAdded={handleCameraAdded}
        farms={farms}
      />
    </div>
  )
}
