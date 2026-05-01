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
    <div className="flex min-h-screen w-full min-w-0 bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-[#0f172b] px-6 py-3">
          <h3 className="shrink-0 text-sm font-semibold text-white">Rankwell Admin</h3>
          {role === 'HR' && (
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
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${role !== 'HR' ? 'ml-auto' : ''}`}
          >
            Log out
          </button>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-auto px-3 pb-6 pt-0 sm:px-5 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
