import { Outlet, useNavigate } from 'react-router-dom'
import { clearAuth, getAdminLoginEmail, getAdminUserId, getUserRole } from '@/utils/auth'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  const navigate = useNavigate()
  const role = getUserRole()
  const hrUserId = role === 'HR' ? getAdminUserId() : null
  const hrEmail = role === 'HR' ? getAdminLoginEmail() : ''

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell flex min-h-screen w-full min-w-0 bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-header flex shrink-0 items-center gap-4 border-b border-sky-900/40 bg-gradient-to-r from-[#070d18] via-[#0f172b] to-[#0f1c33] px-4 py-3 shadow-lg shadow-slate-900/25 sm:px-6">
          {role !== 'HR' ? (
            <p className="hidden min-w-0 flex-1 text-xs leading-snug text-slate-400 md:block md:max-w-2xl">
              Manage your academy platform, learners, billing, and content — all from one console.
            </p>
          ) : null}
          {role === 'HR' ? (
            <div className="min-w-0 flex-1 px-2 text-center text-xs text-slate-300 sm:text-sm">
              <span className="text-slate-400">Logged in as HR · User ID </span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {hrUserId != null ? hrUserId : '—'}
              </span>
              {hrEmail ? (
                <span className="mt-0.5 block truncate text-slate-400 sm:inline sm:before:mx-2 sm:before:content-['·']">
                  {hrEmail}
                </span>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className={`shrink-0 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-white/15 hover:border-sky-300/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${role !== 'HR' ? 'ml-auto' : ''}`}
          >
            Log out
          </button>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-gradient-to-b from-slate-100 to-slate-200/90 px-3 pb-8 pt-0 sm:px-5 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
