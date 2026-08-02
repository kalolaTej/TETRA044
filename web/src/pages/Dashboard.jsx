import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, AlertTriangle, Camera, CheckCircle2, ArrowUpRight } from 'lucide-react'
import LiveDetections from '../components/LiveDetections'
import CameraStatus from '../components/CameraStatus'
import AnalyticsCharts from '../components/AnalyticsCharts'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, session } = useAuth()
  const [detections, setDetections] = useState([])
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLiveMetrics = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const [detRes, camRes] = await Promise.all([
        fetch(`${backendUrl}/api/detections?limit=100`, { headers }).catch(() => null),
        fetch(`${backendUrl}/api/cameras`, { headers }).catch(() => null)
      ])

      if (detRes && detRes.ok) {
        const data = await detRes.json()
        const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.detections) ? data.detections : []
        setDetections(items)
      } else {
        setDetections([])
      }

      if (camRes && camRes.ok) {
        const cData = await camRes.json()
        const cItems = Array.isArray(cData) ? cData : Array.isArray(cData?.data) ? cData.data : Array.isArray(cData?.cameras) ? cData.cameras : []
        setCameras(cItems)
      } else {
        setCameras([])
      }
    } catch {
      setDetections([])
      setCameras([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchLiveMetrics()
    const interval = setInterval(() => {
      fetchLiveMetrics()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchLiveMetrics])

  // Dynamic metrics calculation from live backend API data
  const todayStr = new Date().toDateString()
  const todayDetections = detections.filter((d) => {
    const dDate = new Date(d.detected_at || d.created_at || Date.now()).toDateString()
    return dDate === todayStr
  })

  const countToday = todayDetections.length
  const activeCamsCount = cameras.filter((c) => c.status === 'online').length
  const totalCams = cameras.length
  const alertsCount = detections.filter((d) => (d.confidence || 0) >= 85).length

  const avgConfidence = detections.length > 0
    ? (detections.reduce((acc, curr) => acc + (parseFloat(curr.confidence) || 0), 0) / detections.length).toFixed(1)
    : '0'

  const stats = [
    {
      title: 'Animals Detected Today',
      value: String(countToday),
      description: 'Intrusion logs in 24h',
      trend: `${countToday} events`,
      trendUp: countToday > 0,
      icon: ShieldCheck,
      color: 'bg-[#8FAF5A]/15 text-[#526F1B]'
    },
    {
      title: 'Active Cameras',
      value: `${activeCamsCount} / ${totalCams}`,
      description: 'Edge camera nodes online',
      trend: `${totalCams > 0 ? Math.round((activeCamsCount / totalCams) * 100) : 0}% Active`,
      trendUp: activeCamsCount > 0,
      icon: Camera,
      color: 'bg-[#B7C99A]/20 text-[#6B8E23]'
    },
    {
      title: 'Alerts Triggered',
      value: String(alertsCount),
      description: 'Deterrent alarms dispatched',
      trend: `${alertsCount} Alarms`,
      trendUp: false,
      icon: AlertTriangle,
      color: 'bg-[#FEF3C7] text-[#D97706]'
    },
    {
      title: 'Detection Accuracy',
      value: `${avgConfidence}%`,
      description: 'YOLO model inference rate',
      trend: detections.length > 0 ? 'Live Avg' : 'No Data',
      trendUp: detections.length > 0,
      icon: CheckCircle2,
      color: 'bg-[#ECFDF5] text-[#059669]'
    }
  ]

  return (
    <div className="space-y-8">
      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">
            Wildlife Surveillance Overview
          </h1>
          <p className="text-xs text-[#666666] mt-1 font-medium">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}. Edge monitoring nodes operating synchronously.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#666666] bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB] shadow-2xs">
            Zone: <strong className="text-[#2F2F2F]">North Perimeter</strong>
          </span>
        </div>
      </div>

      {/* top dynamic statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="card-base card-interactive p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#666666]">{stat.title}</span>
                  <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">{stat.value}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
                <span className="text-[#8A8A8A] font-medium truncate">{stat.description}</span>
                <span className={`font-bold flex items-center gap-0.5 shrink-0 ${stat.trendUp ? 'text-[#059669]' : 'text-[#666666]'}`}>
                  {stat.trend}
                  <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* live camera preview & detection log */}
      <LiveDetections />

      {/* dynamic analytics trend charts */}
      <AnalyticsCharts detections={detections} />

      {/* active camera status widget */}
      <CameraStatus />
    </div>
  )
}
