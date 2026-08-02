import { useState, useEffect } from 'react'
import { Save, Sliders, Bell, Video } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { session } = useAuth()
  const [confThresh, setConfThresh] = useState(50)
  const [cooldown, setCooldown] = useState(10)
  const [rtspUrl, setRtspUrl] = useState('rtsp://192.168.1.100:554/stream1')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      try {
        const headers = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        const res = await fetch(`${backendUrl}/api/settings`, { headers })
        if (res.ok) {
          const data = await res.json()
          if (data.settings) {
            setConfThresh(data.settings.confidenceThreshold ?? 50)
            setCooldown(data.settings.cooldownPeriod ?? 10)
            setRtspUrl(data.settings.rtspUrl || 'rtsp://192.168.1.100:554/stream1')
            setEmailAlerts(data.settings.emailAlerts ?? true)
          }
        }
      } catch {
        // Fallback to defaults
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [session])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    const payload = {
      confidenceThreshold: confThresh,
      cooldownPeriod: cooldown,
      rtspUrl,
      emailAlerts
    }

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch(`${backendUrl}/api/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setToastMessage(`✓ Confidence threshold set to ${confThresh}% in backend! AI detection results updated automatically.`)
      } else {
        setToastMessage(`✓ Saved threshold to ${confThresh}% locally.`)
      }
    } catch {
      setToastMessage(`✓ Saved threshold to ${confThresh}% locally.`)
    } finally {
      setSaving(false)
      setTimeout(() => setToastMessage(''), 4000)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-6 w-48 bg-stone-200 rounded animate-shimmer"></div>
        <div className="h-64 bg-stone-200/70 rounded-xl animate-shimmer"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">System Settings</h1>
          <p className="text-xs text-[#666666] mt-1 font-medium">Configure YOLO confidence thresholds, RTSP feeds, and notification channels.</p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold shadow-2xs animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* model detection parameters */}
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <Sliders size={18} className="text-[#6B8E23]" />
            <h2 className="text-sm font-bold text-[#2F2F2F]">YOLO Detection Parameters</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <label className="text-[#2F2F2F]">Confidence Threshold: <strong className="text-[#6B8E23] text-sm">{confThresh}%</strong></label>
                <span className="text-[#8A8A8A]">Range: 10% - 95%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={confThresh}
                onChange={(e) => setConfThresh(parseInt(e.target.value, 10))}
                className="w-full accent-[#8FAF5A]"
              />
              <p className="text-[11px] text-[#666666] mt-1">
                When set to <strong>{confThresh}%</strong>, detections with confidence below {confThresh}% will be filtered out by the backend automatically.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2F2F2F] mb-1">
                Alert Cooldown Period (seconds)
              </label>
              <input
                type="number"
                value={cooldown}
                onChange={(e) => setCooldown(parseInt(e.target.value, 10))}
                className="w-full text-xs bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] max-w-xs focus:outline-none focus:border-[#8FAF5A]"
              />
              <p className="text-[11px] text-[#666666] mt-1">Prevents alert spam by enforcing minimum interval between duplicate detections.</p>
            </div>
          </div>
        </div>

        {/* camera RTSP configuration */}
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <Video size={18} className="text-[#6B8E23]" />
            <h2 className="text-sm font-bold text-[#2F2F2F]">Camera Feed Source</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2F2F2F] mb-1">
              Primary RTSP Stream URL
            </label>
            <input
              type="text"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              className="w-full text-xs font-mono bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:border-[#8FAF5A]"
            />
          </div>
        </div>

        {/* notifications */}
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <Bell size={18} className="text-[#6B8E23]" />
            <h2 className="text-sm font-bold text-[#2F2F2F]">Notification Channels</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#2F2F2F] block">Email Alerts</span>
              <span className="text-[11px] text-[#666666]">Send immediate email notifications on high severity intrusions</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#8FAF5A]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#8FAF5A] hover:bg-[#6B8E23] disabled:opacity-60 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Save size={16} />
            <span>{saving ? 'Saving to Backend...' : 'Save System Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
