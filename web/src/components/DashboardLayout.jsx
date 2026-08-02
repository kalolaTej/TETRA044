import { useState, useEffect } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  Camera,
  Bell,
  Search,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  FileBarChart,
  User,
  ChevronDown,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout() {
  const { user, logout, session } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([])

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Detection History', path: '/detections', icon: History },
    { label: 'Cameras', path: '/cameras', icon: Camera },
    { label: 'Alerts', path: '/alerts', icon: AlertTriangle, badge: notifications.length > 0 ? String(notifications.length) : null },
    { label: 'Reports', path: '/reports', icon: FileBarChart },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  useEffect(() => {
    const fetchNotifs = async () => {
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
          setNotifications(items)
        }
      } catch {
        // Safe fallback
      }
    }

    fetchNotifs()
  }, [session])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/detections?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBF8] text-[#2F2F2F] flex flex-col font-sans">
      {/* fixed top navbar */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40 h-18 shadow-2xs">
        <div className="px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          
          {/* left section: logo & mobile toggle */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-[#666666] hover:text-[#2F2F2F] hover:bg-[#FAFBF8] md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#8FAF5A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#6B8E23] transition-colors">
                <ShieldCheck size={22} />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-[#2F2F2F] text-lg tracking-tight leading-tight block">WildGuard AI</span>
                <span className="text-xs text-[#666666] font-semibold block">Intrusion Surveillance System</span>
              </div>
            </Link>
          </div>

          {/* center section: search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search camera ID, animal class, or zone..."
                className="w-full pl-10 pr-12 py-2 text-sm bg-[#FAFBF8] border border-[#E5E7EB] rounded-xl text-[#2F2F2F] placeholder:text-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A] focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A8A8A] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                ⌘K
              </span>
            </form>
          </div>

          {/* right section: notifications & profile */}
          <div className="flex items-center gap-3">
            
            {/* notifications dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifMenuOpen(!notifMenuOpen)
                  setProfileMenuOpen(false)
                }}
                className="p-2.5 rounded-xl text-[#666666] hover:text-[#2F2F2F] hover:bg-[#FAFBF8] relative transition-colors"
                title="Alert notifications"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-2 w-84 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-4 z-50 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E5E7EB]">
                    <span className="text-sm font-bold text-[#2F2F2F]">System Notifications</span>
                    <span className="text-xs font-bold bg-[#FEF3C7] text-[#D97706] px-2.5 py-0.5 rounded-full">
                      {notifications.length} Alerts
                    </span>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#8A8A8A] text-center py-4">No active notification alerts.</p>
                  ) : (
                    <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                      {notifications.slice(0, 5).map((n, i) => (
                        <div key={n.id || i} className="p-2.5 rounded-lg bg-[#FAFBF8] border border-[#E5E7EB] hover:border-[#8FAF5A] transition-colors">
                          <div className="flex items-center justify-between font-bold text-[#2F2F2F]">
                            <span>{n.title || `${n.animal || 'Intrusion'} Alert`}</span>
                            <span className="text-xs text-[#8A8A8A] font-medium">{n.time || 'Live'}</span>
                          </div>
                          <p className="text-xs text-[#666666] mt-1 font-medium">{n.body || `${n.camera || 'cam_01'} • ${n.severity || 'Medium'} Severity`}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link
                    to="/alerts"
                    onClick={() => setNotifMenuOpen(false)}
                    className="block text-center text-xs font-bold text-[#6B8E23] hover:underline mt-3 pt-2 border-t border-[#E5E7EB]"
                  >
                    View all alert history →
                  </Link>
                </div>
              )}
            </div>

            {/* user profile dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileMenuOpen(!profileMenuOpen)
                  setNotifMenuOpen(false)
                }}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#FAFBF8] transition-colors border border-transparent hover:border-[#E5E7EB]"
              >
                <div className="w-9 h-9 rounded-xl bg-[#A3B18A]/25 text-[#526F1B] flex items-center justify-center font-bold text-sm">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-sm font-bold text-[#2F2F2F] hidden lg:inline max-w-[130px] truncate">
                  {user?.email ? user.email.split('@')[0] : 'Operator'}
                </span>
                <ChevronDown size={16} className="text-[#8A8A8A]" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-2.5 z-50 animate-in fade-in duration-200">
                  <div className="px-3 py-2 border-b border-[#E5E7EB]">
                    <p className="text-sm font-bold text-[#2F2F2F] truncate">{user?.email || 'operator@wildguard.ai'}</p>
                    <p className="text-xs text-[#666666] font-medium">System Operator</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-[#2F2F2F] hover:bg-[#FAFBF8] rounded-lg transition-colors"
                    >
                      <User size={16} className="text-[#666666]" />
                      <span>Profile & Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2]/40 rounded-lg transition-colors text-left"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* sidebar nav */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-68 bg-white border-r border-[#E5E7EB] pt-18 md:pt-0 md:static transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 flex flex-col justify-between h-full">
            <nav className="space-y-1.5">
              <div className="px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-[#8A8A8A]">
                Navigation Menu
              </div>

              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-[#8FAF5A]/15 text-[#2D3D12] font-black border-l-4 border-[#8FAF5A] pl-3.5'
                          : 'text-[#666666] hover:bg-[#FAFBF8] hover:text-[#2F2F2F]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-xs font-extrabold bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>

            {/* sidebar footer status */}
            <div className="mt-8 pt-4 border-t border-[#E5E7EB] px-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#666666]">Edge AI Node</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#059669]">
                  <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
                  Active
                </span>
              </div>
              <p className="text-xs text-[#8A8A8A] font-medium">v1.4.0 • Supabase Sync</p>
            </div>
          </div>
        </aside>

        {/* mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-20 md:hidden"
          ></div>
        )}

        {/* main page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
