import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ShieldAlert, ChevronRight, Clock, MapPin } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const MOCK_INITIAL_DETECTIONS = [
  {
    id: 'det_01',
    animal: 'cow',
    confidence: 94,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'det_02',
    animal: 'dog',
    confidence: 88,
    camera_id: 'cam_02',
    camera_name: 'South Perimeter',
    zone: 'South Gate',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'det_03',
    animal: 'bear',
    confidence: 91,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=400&auto=format&fit=crop&q=80'
  }
]

export default function LiveDetections() {
  const { session } = useAuth()
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [newestId, setNewestId] = useState(null)

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

    // subscribe to live postgres inserts
    const channel = supabase
      .channel('public:detections')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'detections' }, (payload) => {
        const newItem = payload.new
        setDetections((prev) => [newItem, ...prev])
        setNewestId(newItem.id)

        // remove highlight after 3 seconds
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
      <div className="bg-[#faf8f5] border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="h-5 w-48 bg-stone-200 rounded animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-stone-200/60 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#faf8f5] border border-stone-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-amber-600 animate-pulse" />
          <h2 className="text-base font-semibold text-stone-900">Live Detections Feed</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
            Realtime
          </span>
        </div>

        <Link
          to="/detections"
          className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {detections.length === 0 ? (
        <div className="text-center py-8 text-stone-500 text-xs">
          <ShieldAlert size={24} className="mx-auto mb-2 opacity-40 text-stone-400" />
          <span>No recent animal intrusion events recorded.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {detections.map((item) => {
            const isHighlighted = item.id === newestId
            return (
              <Link
                key={item.id}
                to={`/detections/${item.id}`}
                className={`block bg-white border border-stone-200 rounded-lg p-3.5 hover:border-stone-300 transition-all ${
                  isHighlighted ? 'ring-2 ring-amber-500 bg-amber-50/60' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* thumbnail */}
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-stone-100 shrink-0 border border-stone-200 relative">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=200&auto=format&fit=crop&q=80'}
                      alt={item.animal}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* event details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize text-stone-900">
                        {item.animal}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100/80 text-amber-900">
                        {item.confidence}% confidence
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-stone-400" />
                        {item.zone || item.camera_name || 'North Zone'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-stone-400" />
                        {new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-stone-400 shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
