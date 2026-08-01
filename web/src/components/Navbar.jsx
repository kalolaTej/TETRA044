import { Link } from 'react-router-dom'
import { ShieldAlert, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

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
          {user ? (
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm transition-colors shadow-2xs"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-amber-800 transition-colors">Login</Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors text-sm font-semibold shadow-2xs"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
