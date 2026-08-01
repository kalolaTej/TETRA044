import CameraStatus from '../components/CameraStatus'
import LiveDetections from '../components/LiveDetections'
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* header section */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-sm text-stone-500 mt-1">Real-time edge camera status and live intrusion telemetry overview.</p>
      </div>

      {/* stat cards overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#faf8f5] border border-stone-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">System Health</p>
            <p className="text-lg font-semibold text-stone-900">Operational</p>
          </div>
        </div>

        <div className="bg-[#faf8f5] border border-stone-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Intrusions (24h)</p>
            <p className="text-lg font-semibold text-stone-900">3 Reported</p>
          </div>
        </div>

        <div className="bg-[#faf8f5] border border-stone-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Active Zone</p>
            <p className="text-lg font-semibold text-stone-900">North Field</p>
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
