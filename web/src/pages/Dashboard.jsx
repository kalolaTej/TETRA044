import CameraStatus from '../components/CameraStatus'
import LiveDetections from '../components/LiveDetections'
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* header section */}
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-base text-stone-600 mt-1.5 font-medium">Real-time edge camera status and live intrusion telemetry overview.</p>
      </div>

      {/* stat cards overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-stone-600 font-medium">System Health</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">Operational</p>
          </div>
        </div>

        <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-stone-600 font-medium">Intrusions (24h)</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">3 Reported</p>
          </div>
        </div>

        <div className="bg-[#fcfbf7] border border-stone-300/80 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-200 text-stone-800 flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-sm text-stone-600 font-medium">Active Zone</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">North Field</p>
          </div>
        </div>
      </div>

      {/* camera status section */}
      <CameraStatus />

      {/* live detections feed section */}
      <LiveDetections />
    </div>
  )
}
