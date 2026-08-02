import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, CheckCircle2, Volume2, Filter, ShieldCheck, VolumeX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { playSirenSound } from '../lib/soundEffects'

const DEFAULT_ALERTS = [
  { id: 'alert_01', animal: 'Wild Boar / Pig', camera: 'North Field Cam', zone: 'North Field', severity: 'High', time: '2 mins ago', status: 'Active' },
  { id: 'alert_02', animal: 'Stray Cattle / Cow', camera: 'East Barn Cam', zone: 'East Barn', severity: 'Medium', time: '14 mins ago', status: 'Active' },
  { id: 'alert_03', animal: 'Feral Dog', camera: 'South Gate Cam', zone: 'South Gate', severity: 'Low', time: '1 hour ago', status: 'Active' },
]

export default function Alerts() {
  const { session } = useAuth()
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS)
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState('All')
  const [sirenActiveToast, setSirenActiveToast] = useState(null)

  const fetchAlerts = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${backendUrl}/api/notifications`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        if (items.length > 0) {
          setAlerts(items)
        } else {
          setAlerts(DEFAULT_ALERTS)
        }
      } else {
        setAlerts(DEFAULT_ALERTS)
      }
    } catch {
      setAlerts(DEFAULT_ALERTS)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleResolve = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Resolved' } : a)))
  }

  const handleSirenClick = (animalName) => {
    // 1. Play loud 3.5s high-decibel siren on computer/browser speakers
    playSirenSound(3.5)

    // 2. Show active alert banner
    setSirenActiveToast(`🚨 High-Decibel Alert Siren Activated for ${animalName || 'Wild Animal'}! Dispatching sound...`)
    setTimeout(() => {
      setSirenActiveToast(null)
    }, 3500)

    // 3. Trigger backend ESP32 hardware controller if available
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    fetch(`${backendUrl}/api/detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animal: animalName || 'unknown', duration: 5000 }),
    }).catch(() => {})
  }

  const alertList = Array.isArray(alerts) ? alerts : DEFAULT_ALERTS
  const filteredAlerts = alertList.filter(
    (a) => filterSeverity === 'All' || a.severity === filterSeverity
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-stone-200/70 rounded-xl animate-shimmer"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {sirenActiveToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-red-600 text-white font-extrabold text-xs shadow-2xl flex items-center gap-3 border border-red-400 animate-bounce">
          <Volume2 size={20} className="animate-spin text-yellow-300" />
          <span>{sirenActiveToast}</span>
          <button onClick={() => setSirenActiveToast(null)} className="ml-2 hover:opacity-80">
            <VolumeX size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Active Intrusion Alerts</h1>
          <p className="text-xs text-[#666666] mt-1 font-medium">Real-time alert log dynamically dispatched from edge camera detection events.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#666666] font-medium flex items-center gap-1">
            <Filter size={14} /> Filter Severity:
          </span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs font-semibold bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[#2F2F2F] focus:outline-none focus:border-[#8FAF5A]"
          >
            <option value="All">All Severities</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-16 card-base space-y-2">
          <ShieldCheck size={36} className="mx-auto text-[#8A8A8A] opacity-60" />
          <p className="text-base font-bold text-[#2F2F2F]">No active intrusion alerts.</p>
          <p className="text-xs text-[#666666] font-medium">Monitoring edge nodes for new detection events.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert, idx) => {
            const isHigh = alert.severity === 'High'
            const isMedium = alert.severity === 'Medium'
            const isResolved = alert.status === 'Resolved'

            return (
              <div key={alert.id || idx} className="card-base p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isHigh
                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : isMedium
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : 'bg-[#EFF6FF] text-[#2563EB]'
                    }`}
                  >
                    <AlertTriangle size={20} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-[#2F2F2F]">{alert.animal || 'Wild Animal'} Intrusion</h3>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          isHigh
                            ? 'bg-[#FEE2E2] text-[#991B1B]'
                            : isMedium
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#EFF6FF] text-[#1E40AF]'
                        }`}
                      >
                        {alert.severity || 'Medium'} Severity
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] font-medium mt-1">
                      {alert.camera || 'cam_01'} • Zone: {alert.zone || 'North Field'} • {alert.time || 'Live'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isResolved ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-lg">
                      <CheckCircle2 size={14} /> Resolved
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#FAFBF8] text-[#2F2F2F] text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => handleSirenClick(alert.animal)}
                        title="Click to trigger high-volume alarm siren"
                        className="px-3.5 py-1.5 bg-[#8FAF5A] hover:bg-[#7A9949] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Volume2 size={14} /> Siren
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
