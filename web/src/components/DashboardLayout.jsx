import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, History, Camera, ShieldAlert, Activity } from 'lucide-react'

export default function DashboardLayout() {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Detection History', path: '/detections', icon: History },
    { label: 'Cameras', path: '/cameras', icon: Camera },
  ]

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-stone-900 flex flex-col font-sans">
      {/* top bar */}
      <header className="bg-[#fcfbf7] border-b border-stone-300/80 sticky top-0 z-40 h-20 shadow-xs">
        <div className="px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="font-bold text-stone-900 text-lg leading-tight tracking-tight">Intrusion Monitor</h1>
              <p className="text-xs text-stone-600 font-medium">Edge AI Animal Intrusion System</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100/90 text-emerald-950 border border-emerald-300">
            <Activity size={14} className="text-emerald-600 animate-pulse" />
            <span>Active Protection • Live System</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* sidebar nav */}
        <aside className="w-72 bg-[#fcfbf7] border-r border-stone-300/80 hidden md:block p-6 flex-col justify-between shadow-2xs">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? 'bg-amber-100/90 text-amber-950 font-semibold border-l-4 border-amber-600 pl-3 shadow-2xs'
                        : 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-950'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        {/* main page content */}
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
