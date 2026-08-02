import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Radio, ShieldAlert, ChevronRight, Clock, MapPin, Video, Eye } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { getAnimalImage, ANIMAL_IMAGES } from '../lib/animalImages'

export default function LiveDetections() {
  const { session } = useAuth()
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStream, setSelectedStream] = useState(null)

  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } catch {
      // ignore
    }
  }

  const fetchInitialDetections = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${backendUrl}/api/detections?limit=10`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.detections)
          ? data.detections
          : []
        
        setDetections(items)
        if (items.length > 0) setSelectedStream(items[0])
      }
    } catch {
      // Keep empty if API unready
      setDetections([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchInitialDetections()

    if (!isSupabaseConfigured) return

    let channel = null
    try {
      channel = supabase
        .channel('public:detections')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'detections' }, (payload) => {
          if (payload?.new) {
            const newItem = payload.new
            setDetections((prev) => [newItem, ...prev])
            setSelectedStream(newItem)
            playAlertChime()
          }
        })
        .subscribe()
    } catch (err) {
      console.warn('Realtime channel error skipped:', err)
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [fetchInitialDetections])

  if (loading) {
    return (
      <div className="card-base p-6 space-y-4">
        <div className="h-6 w-48 bg-stone-200 rounded animate-shimmer"></div>
        <div className="h-72 bg-stone-200/70 rounded-xl animate-shimmer"></div>
      </div>
    )
  }

  const activeDetection = selectedStream || (detections.length > 0 ? detections[0] : null)
  const activeImage = activeDetection ? getAnimalImage(activeDetection?.animal, activeDetection?.image_url) : ANIMAL_IMAGES.cow

  return (
    <div id="live" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#2F2F2F] tracking-tight font-extrabold text-xl">Realtime Detections & Video Feed</h2>
          <p className="text-xs text-[#666666] mt-0.5 font-medium">Edge camera stream with automated AI detection telemetry.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
          Edge Channel Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* main large live camera preview */}
        <div className="lg:col-span-2 card-base overflow-hidden flex flex-col justify-between">
          <div className="relative bg-stone-900 aspect-video flex items-center justify-center overflow-hidden">
            <img
              src={activeImage}
              alt={activeDetection?.animal || 'Camera Stream'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = ANIMAL_IMAGES.cow
              }}
            />
            {/* camera stream header overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="bg-black/65 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <Video size={15} className="text-[#8FAF5A]" />
                <span>{activeDetection?.camera_name || 'North Field Stream'} ({activeDetection?.camera_id || 'cam_01'})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#059669] text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                  {activeDetection?.fps || 30} FPS
                </span>
                <span className="bg-[#8FAF5A] text-[#2D3D12] px-2.5 py-1 rounded-lg text-xs font-extrabold">
                  {activeDetection?.confidence || 94}% CONFIDENCE
                </span>
              </div>
            </div>

            {/* detection target badge overlay */}
            <div className="absolute bottom-4 left-4 bg-white/95 text-[#2F2F2F] px-4 py-2 rounded-xl text-xs font-extrabold shadow-md border border-[#E5E7EB] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
              <span className="capitalize">{activeDetection?.animal || 'Monitoring'} Detected</span>
              <span className="text-[#666666] font-medium text-xs">
                ({activeDetection?.zone || 'North Field'})
              </span>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#666666] font-medium">
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#8A8A8A]" />
              Last event logged: {new Date(activeDetection?.created_at || Date.now()).toLocaleTimeString()}
            </span>
            {activeDetection?.id && (
              <Link
                to={`/detections/${activeDetection.id}`}
                className="text-[#6B8E23] font-bold hover:underline flex items-center gap-1"
              >
                <span>Inspect Event Metadata</span>
                <ChevronRight size={15} />
              </Link>
            )}
          </div>
        </div>

        {/* recent detections sidebar feed */}
        <div className="card-base p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-[#6B8E23]" />
                <h3 className="text-sm font-extrabold text-[#2F2F2F]">Live Feed Log</h3>
              </div>
              <Link to="/detections" className="text-xs font-bold text-[#6B8E23] hover:underline">
                View all
              </Link>
            </div>

            {detections.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#8A8A8A] font-medium">
                <ShieldAlert size={32} className="mx-auto mb-2 opacity-50 text-[#8FAF5A]" />
                <p className="font-bold text-[#2F2F2F] text-sm">No live intrusion events recorded.</p>
                <p className="mt-1 text-xs">Listening for incoming camera signals...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {detections.map((item, idx) => {
                  const isSelected = item?.id === activeDetection?.id
                  const thumb = getAnimalImage(item?.animal, item?.image_url)

                  return (
                    <div
                      key={item?.id || idx}
                      onClick={() => setSelectedStream(item)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-[#8FAF5A]/15 border-[#8FAF5A] shadow-2xs font-bold'
                          : 'bg-[#FAFBF8] border-[#E5E7EB] hover:border-[#A3B18A]'
                      }`}
                    >
                      <img
                        src={thumb}
                        alt={item?.animal || 'animal'}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-[#E5E7EB] shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = ANIMAL_IMAGES.cow
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#2F2F2F] capitalize truncate">{item?.animal}</span>
                          <span className="text-[10px] font-extrabold bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded">
                            {item?.confidence}%
                          </span>
                        </div>
                        <p className="text-xs text-[#666666] truncate mt-0.5 font-medium">{item?.zone || item?.camera_name}</p>
                      </div>
                      <Eye size={16} className="text-[#8A8A8A] shrink-0" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-[#E5E7EB] text-xs text-[#8A8A8A] text-center font-medium">
            Click any event to switch live camera stream preview
          </div>
        </div>
      </div>
    </div>
  )
}
