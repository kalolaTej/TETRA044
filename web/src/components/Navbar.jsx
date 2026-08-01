import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 p-4 flex gap-6 text-sm font-medium">
      <Link to="/dashboard" className="text-emerald-400 hover:underline">Dashboard</Link>
      <Link to="/detections" className="text-emerald-400 hover:underline">Detections</Link>
      <Link to="/login" className="text-slate-400 hover:underline ml-auto">Login</Link>
      <Link to="/register" className="text-slate-400 hover:underline">Register</Link>
    </nav>
  )
}
