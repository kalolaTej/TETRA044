import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Camera, Clock, ShieldAlert, Volume2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const MOCK_DETAIL_DETECTIONS = {
  det_01: {
    id: 'det_01',
    animal: 'cow',
    confidence: 94,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=800&auto=format&fit=crop&q=80',
    bbox: [120, 85, 450, 380]
  },
  det_02: {
    id: 'det_02',
    animal: 'dog',
    confidence: 88,
    camera_id: 'cam_02',
    camera_name: 'South Perimeter',
    zone: 'South Gate',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
    bbox: [80, 110, 320, 290]
  },
  det_03: {
    id: 'det_03',
    animal: 'bear',
    confidence: 91,
    camera_id: 'cam_01',
    camera_name: 'North Field Cam',
    zone: 'North Field',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop&q=80',
    bbox: [150, 90, 480, 410]
  }
}

export default function DetectionDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const [detection, setDetection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sirenToast, setSirenToast] = useState(null)

  const fetchDetail = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${backendUrl}/api/detections/${id}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setDetection(data.detection || data)
      } else {
        // fallback to mock detail dictionary if endpoint is offline
        const mockItem = MOCK_DETAIL_DETECTIONS[id] || MOCK_DETAIL_DETECTIONS['det_01']
        setDetection(mockItem)
      }
    } catch {
      const mockItem = MOCK_DETAIL_DETECTIONS[id] || MOCK_DETAIL_DETECTIONS['det_01']
      setDetection(mockItem)
    } finally {
      setLoading(false)
    }
  }, [id, session])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const triggerSiren = () => {
    const zoneName = detection?.zone || 'Active Zone'
    setSirenToast(`🚨 Siren activated in ${zoneName}! Dispatching deterrent sound...`)
    setTimeout(() => {
      setSirenToast(null)
    }, 4000)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-6 w-32 bg-stone-200 rounded animate-pulse"></div>
        <div className="h-96 bg-stone-200/60 rounded-xl animate-pulse"></div>
      </div>
    )
  }

  if (notFound || !detection) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 bg-[#faf8f5] border border-stone-200 rounded-xl">
        <ShieldAlert size={36} className="mx-auto text-stone-400 mb-3" />
        <h2 className="text-xl font-bold text-stone-900">Detection Record Not Found</h2>
        <p className="text-xs text-stone-500 mt-1 mb-6">The requested detection ID does not exist or was removed.</p>
        <Link
          to="/detections"
          className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
        >
          Return to Detection History
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* back navigation link */}
      <div>
        <Link
          to="/detections"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Detection History</span>
        </Link>
      </div>

      {/* siren toast notification */}
      {sirenToast && (
        <div className="p-3.5 rounded-lg bg-amber-900 text-amber-50 text-xs font-medium shadow-md flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-amber-400" />
            <span>{sirenToast}</span>
          </div>
          <Check size={14} className="text-amber-300" />
        </div>
      )}

      {/* main detail card */}
      <div className="bg-[#faf8f5] border border-stone-200 rounded-xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* full-size image viewport */}
        <div className="relative bg-stone-950 min-h-[320px] flex items-center justify-center p-2">
          <img
            src={detection.image_url || 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=800&auto=format&fit=crop&q=80'}
            alt={detection.animal}
            className="w-full h-full object-contain rounded-lg max-h-[460px]"
          />
          <div className="absolute bottom-4 left-4 bg-stone-900/80 backdrop-blur-xs px-3 py-1 rounded text-white text-xs font-medium">
            Bounding box logged
          </div>
        </div>

        {/* metadata panel */}
        <div className="p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                  Intrusion Alert
                </span>
                <h1 className="text-2xl font-bold text-stone-900 capitalize mt-2">
                  {detection.animal} Detected
                </h1>
              </div>

              <span className="text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                {detection.confidence}% confidence
              </span>
            </div>

            <div className="pt-4 border-t border-stone-200/80 space-y-3 text-xs text-stone-700">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <MapPin size={14} /> Zone Name:
                </span>
                <span className="font-semibold text-stone-900">{detection.zone || 'North Field'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Camera size={14} /> Camera Source:
                </span>
                <span className="font-semibold text-stone-900">{detection.camera_name || detection.camera_id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Clock size={14} /> Timestamp:
                </span>
                <span className="font-semibold text-stone-900">
                  {new Date(detection.created_at || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* interactive siren trigger demo */}
          <div className="pt-4 border-t border-stone-200/80">
            <button
              onClick={triggerSiren}
              className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Volume2 size={16} />
              <span>Simulate Siren Deterrent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
