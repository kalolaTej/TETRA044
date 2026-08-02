import LiveDetections from '../components/LiveDetections'

export default function LiveDetectionPage() {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Live Detection Portal</h1>
        <p className="text-xs text-[#666666] mt-1 font-medium">Real-time edge camera feed monitoring and automated intrusion alerts.</p>
      </div>

      <LiveDetections />
    </div>
  )
}
