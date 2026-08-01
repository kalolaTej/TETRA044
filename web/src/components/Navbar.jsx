import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-[#faf8f5] border-b border-stone-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-stone-800 font-semibold text-lg tracking-tight">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <span>Intrusion Monitor</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link to="/dashboard" className="hover:text-stone-900 transition-colors">Dashboard</Link>
          <Link to="/detections" className="hover:text-stone-900 transition-colors">Detections</Link>
          {user ? (
            <button
              onClick={() => logout()}
              className="text-stone-500 hover:text-stone-900 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-stone-900 transition-colors">Login</Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-md bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors text-xs font-semibold"
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
