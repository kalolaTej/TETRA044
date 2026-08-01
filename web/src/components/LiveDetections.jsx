import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ShieldAlert, ChevronRight, Clock, MapPin } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { getAnimalImage, ANIMAL_IMAGES } from '../lib/animalImages'

const MOCK_INITIAL_DETECTIONS = [
  {
    id: 'det_01',
    animal: 'cow',
    confidence: 94,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    image_url: ANIMAL_IMAGES.cow
  },
  {
    id: 'det_02',
    animal: 'dog',
    confidence: 88,
    camera_id: 'cam_02',
    camera_name: 'South Perimeter',
    zone: 'South Gate',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    image_url: ANIMAL_IMAGES.dog
  },
  {
    id: 'det_03',
    animal: 'bear',
    confidence: 91,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    image_url: ANIMAL_IMAGES.bear
  }
]

export default function LiveDetections() {
  const { session } = useAuth()
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [newestId, setNewestId] = useState(null)

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
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
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
        setDetections(data.detections || data)
      } else {
        setDetections(MOCK_INITIAL_DETECTIONS)
      }
    } catch {
      setDetections(MOCK_INITIAL_DETECTIONS)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchInitialDetections()

    if (!isSupabaseConfigured) return

    const channel = supabase
      .channel('public:detections')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'detections' }, (payload) => {
        const newItem = payload.new
        setDetections((prev) => [newItem, ...prev])
        setNewestId(newItem.id)
        playAlertChime()

        setTimeout(() => {
          setNewestId(null)
        }, 3000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchInitialDetections])

  if (loading) {
    return (
      <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="h-6 w-52 bg-stone-200 rounded animate-shimmer"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-stone-200/70 rounded-xl animate-shimmer"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Activity size={22} className="text-amber-600 animate-pulse" />
          <h2 className="text-lg font-bold text-stone-900">Live Detections Feed</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
            Realtime
          </span>
        </div>

        <Link
          to="/detections"
          className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
        >
          <span>View all</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {detections.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-stone-300 rounded-xl">
          <ShieldAlert size={32} className="mx-auto mb-2 text-stone-400 opacity-60" />
          <p className="text-sm font-semibold text-stone-800">No live intrusion events detected yet.</p>
          <p className="text-xs text-stone-600 mt-1">Monitoring active perimeter camera streams...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {detections.map((item) => {
            const isHighlighted = item.id === newestId
            const imgSrc = getAnimalImage(item.animal, item.image_url)

            return (
              <Link
                key={item.id}
                to={`/detections/${item.id}`}
                className={`block bg-white border border-stone-300/80 rounded-xl p-4 hover:border-stone-400 transition-all shadow-2xs ${
                  isHighlighted ? 'ring-2 ring-amber-500 bg-amber-50/80' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* real photo thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 shrink-0 border border-stone-300 relative shadow-2xs">
                    <img
                      src={imgSrc}
                      alt={item.animal}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = ANIMAL_IMAGES.cow
                      }}
                    />
                  </div>

                  {/* event details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold capitalize text-stone-900">
                        {item.animal}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950">
                        {item.confidence}% confidence
                      </span>
                    </div>

                    <div className="flex items-center gap-5 text-xs text-stone-600 font-medium mt-1.5">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-stone-500" />
                        {item.zone || item.camera_name || 'North Zone'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-stone-500" />
                        {new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-stone-400 shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
