import { Link, NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, History, Camera, LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Detection History', path: '/detections', icon: History },
    { label: 'Cameras', path: '/cameras', icon: Camera },
  ]

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-stone-900 flex flex-col">
      {/* top bar */}
      <header className="bg-[#faf8f5] border-b border-stone-200 sticky top-0 z-40 h-16">
        <div className="px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-xs">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h1 className="font-semibold text-stone-900 text-base leading-tight">Intrusion Monitor</h1>
              <p className="text-[11px] text-stone-500">Edge AI Animal Detection</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-stone-600 hidden sm:inline">{user?.email}</span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 transition-colors"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* sidebar nav */}
        <aside className="w-64 bg-[#faf8f5] border-r border-stone-200 hidden md:block p-4 flex-col justify-between">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 font-semibold border-l-4 border-amber-600 pl-2.5'
                        : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        {/* main page content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
