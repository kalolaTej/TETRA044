import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Camera, Clock, ShieldAlert, Volume2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAnimalImage, ANIMAL_IMAGES } from '../lib/animalImages'

const MOCK_DETAIL_DETECTIONS = {}

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
        const item = data.data || data.detection || data
        if (item && item.id) {
          setDetection(item)
        } else {
          setNotFound(true)
        }
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
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
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="h-7 w-40 bg-stone-200 rounded animate-shimmer"></div>
        <div className="h-[420px] bg-stone-200/70 rounded-2xl animate-shimmer"></div>
      </div>
    )
  }

  if (notFound || !detection) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 bg-[#fcfbf7] border border-stone-300/80 rounded-2xl shadow-xs">
        <ShieldAlert size={44} className="mx-auto text-stone-400 mb-4" />
        <h2 className="text-2xl font-bold text-stone-900">Detection Record Not Found</h2>
        <p className="text-sm text-stone-600 mt-2 mb-8 font-medium">The requested detection ID does not exist or was removed.</p>
        <Link
          to="/detections"
          className="px-5 py-3 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-colors shadow-xs"
        >
          Return to Detection History
        </Link>
      </div>
    )
  }

  const imgSrc = getAnimalImage(detection.animal, detection.image_url)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* back navigation link */}
      <div>
        <Link
          to="/detections"
          className="inline-flex items-center gap-2 text-sm font-bold text-stone-700 hover:text-amber-900 transition-colors bg-white px-4 py-2 rounded-xl border border-stone-300 shadow-2xs"
        >
          <ArrowLeft size={18} />
          <span>Back to Detection History</span>
        </Link>
      </div>

      {/* siren toast notification */}
      {sirenToast && (
        <div className="p-4 rounded-xl bg-amber-900 text-amber-50 text-sm font-bold shadow-md flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2.5">
            <Volume2 size={20} className="text-amber-400" />
            <span>{sirenToast}</span>
          </div>
          <Check size={18} className="text-amber-300" />
        </div>
      )}

      {/* main detail card */}
      <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* full-size image viewport */}
        <div className="relative bg-stone-950 min-h-[340px] flex items-center justify-center p-3">
          <img
            src={imgSrc}
            alt={detection.animal}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-xl max-h-[480px]"
            onError={(e) => {
              e.currentTarget.src = ANIMAL_IMAGES.cow
            }}
          />
          <div className="absolute bottom-4 left-4 bg-stone-900/85 backdrop-blur-xs px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold">
            Bounding Box Annotations Saved
          </div>
        </div>

        {/* metadata panel */}
        <div className="p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-md">
                  Intrusion Alert
                </span>
                <h1 className="text-3xl font-bold text-stone-900 capitalize mt-3">
                  {detection.animal} Detected
                </h1>
              </div>

              <span className="text-base font-bold text-amber-950 bg-amber-100/90 border border-amber-300 px-3.5 py-1.5 rounded-xl">
                {detection.confidence}% confidence
              </span>
            </div>

            <div className="pt-5 border-t border-stone-300/80 space-y-4 text-sm text-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-medium flex items-center gap-2">
                  <MapPin size={16} /> Zone Name:
                </span>
                <span className="font-bold text-stone-900 text-base">{detection.zone || 'North Field'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-medium flex items-center gap-2">
                  <Camera size={16} /> Camera Source:
                </span>
                <span className="font-bold text-stone-900 text-base">{detection.camera_name || detection.camera_id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-medium flex items-center gap-2">
                  <Clock size={16} /> Timestamp:
                </span>
                <span className="font-bold text-stone-900 text-sm">
                  {new Date(detection.detected_at || detection.created_at || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-stone-300/80">
            <button
              onClick={triggerSiren}
              className="w-full py-3 px-5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2.5 shadow-xs"
            >
              <Volume2 size={18} />
              <span>Simulate Siren Deterrent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
