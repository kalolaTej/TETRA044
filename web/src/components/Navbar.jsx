import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="bg-[#fcfbf7] border-b border-stone-300/80 sticky top-0 z-50 shadow-xs">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3 text-stone-900 font-bold text-xl tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm">
            <ShieldAlert size={20} />
          </div>
          <span>Intrusion Monitor</span>
        </Link>
        <nav className="flex items-center gap-6 text-base font-semibold text-stone-700">
          <Link to="/dashboard" className="hover:text-amber-800 transition-colors">Dashboard</Link>
          <Link to="/detections" className="hover:text-amber-800 transition-colors">Detections</Link>
          <Link to="/cameras" className="hover:text-amber-800 transition-colors">Cameras</Link>
        </nav>
      </div>
    </header>
  )
}
