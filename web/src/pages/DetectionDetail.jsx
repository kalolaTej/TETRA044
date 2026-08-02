import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Camera, Clock, ShieldAlert, Volume2, Check, Download, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAnimalImage } from '../lib/animalImages'
import { playSirenSound } from '../lib/soundEffects'

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
        const item = data?.detection || data?.data || data
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
    // Play physical audio siren sound through speakers
    playSirenSound()

    const zoneName = detection?.zone || 'Active Zone'
    setSirenToast(`🚨 High-decibel deterrent siren activated in ${zoneName}! Sound dispatching...`)
    setTimeout(() => {
      setSirenToast(null)
    }, 4000)
  }

  const handleDownload = () => {
    const imgSrc = detection?.image_url || getAnimalImage(detection?.animal)
    const link = document.createElement('a')
    link.href = imgSrc
    link.download = `camera_snapshot_${detection?.animal || 'event'}_${id}.jpg`
    link.click()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="h-6 w-40 bg-stone-200 rounded animate-shimmer"></div>
        <div className="h-[420px] bg-stone-200/70 rounded-2xl animate-shimmer"></div>
      </div>
    )
  }

  if (notFound || !detection) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 card-base space-y-3">
        <ShieldAlert size={44} className="mx-auto text-[#8A8A8A] opacity-60" />
        <h2 className="text-xl font-extrabold text-[#2F2F2F]">Detection Record Not Found</h2>
        <p className="text-xs text-[#666666] font-medium">The requested camera detection ID does not exist or was cleared.</p>
        <Link
          to="/detections"
          className="inline-block px-4 py-2 bg-[#2F2F2F] text-white rounded-lg text-xs font-bold hover:bg-[#8FAF5A] transition-colors"
        >
          Return to Detection Logs
        </Link>
      </div>
    )
  }

  // Directly render the exact snapshot image captured by the camera
  const cameraCapturedImage = detection.image_url || getAnimalImage(detection.animal)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* back navigation link */}
      <div>
        <Link
          to="/detections"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#2F2F2F] hover:text-[#6B8E23] transition-colors bg-white px-3.5 py-2 rounded-lg border border-[#E5E7EB] shadow-2xs"
        >
          <ArrowLeft size={16} />
          <span>Back to Detection History</span>
        </Link>
      </div>

      {/* siren alert toast */}
      {sirenToast && (
        <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-bold shadow-xs flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-[#D97706] animate-pulse" />
            <span>{sirenToast}</span>
          </div>
          <Check size={16} className="text-[#D97706]" />
        </div>
      )}

      {/* main detail card container */}
      <div className="card-base overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* snapshot image viewport showing exact camera capture */}
        <div className="relative bg-stone-900 min-h-[340px] flex items-center justify-center p-3">
          <img
            src={cameraCapturedImage}
            alt={`${detection.animal} captured by camera`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-lg max-h-[460px]"
            onError={(e) => {
              e.currentTarget.src = getAnimalImage(detection.animal)
            }}
          />
          <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-xs px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold">
            Camera Capture Snapshot
          </div>
        </div>

        {/* metadata panel */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#526F1B] bg-[#8FAF5A]/15 px-2.5 py-1 rounded-md">
                  Intrusion Camera Log
                </span>
                <h1 className="text-2xl font-extrabold text-[#2F2F2F] capitalize mt-2.5">
                  {detection.animal} Intrusion
                </h1>
              </div>

              <span className="text-xs font-extrabold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-3 py-1 rounded-lg">
                {detection.confidence}% confidence
              </span>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] space-y-3.5 text-xs text-[#2F2F2F]">
              <div className="flex items-center justify-between">
                <span className="text-[#666666] font-medium flex items-center gap-2">
                  <MapPin size={15} /> Zone Location:
                </span>
                <span className="font-bold text-[#2F2F2F]">{detection.zone || 'North Field'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#666666] font-medium flex items-center gap-2">
                  <Camera size={15} /> Camera Source:
                </span>
                <span className="font-bold text-[#2F2F2F]">{detection.camera_name || detection.camera_id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#666666] font-medium flex items-center gap-2">
                  <Clock size={15} /> Timestamp:
                </span>
                <span className="font-bold text-[#2F2F2F]">
                  {new Date(detection.detected_at || detection.created_at || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* action buttons */}
          <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
            <button
              onClick={triggerSiren}
              className="w-full py-3 px-4 bg-[#8FAF5A] hover:bg-[#6B8E23] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Volume2 size={18} />
              <span>Simulate Siren Deterrent</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={cameraCapturedImage}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] text-[#2F2F2F] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <ExternalLink size={15} />
                <span>Full Frame</span>
              </a>

              <button
                onClick={handleDownload}
                className="py-2.5 px-3 border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] text-[#2F2F2F] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Download size={15} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
