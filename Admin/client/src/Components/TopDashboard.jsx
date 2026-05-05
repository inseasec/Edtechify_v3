import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Users } from 'lucide-react'

export default function TopDashboard() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/getAllUsers')
        const raw = res.data?.data ?? res.data
        setUsers(Array.isArray(raw) ? raw : [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchUsers()
  }, [])

  const totalUsers = users.length

  return (
    <div className="-mx-4 mb-[-1.25rem] rounded-b-2xl bg-transparent py-4 px-4 sm:-mx-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Quick snapshot of your platform. Invite teams and learners from Clients and tune the experience under
            Settings.
          </p>
        </div>

        <div className="grid max-w-xl grid-cols-1 gap-6 md:grid-cols-2">
          <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md ring-1 ring-slate-900/[0.04] transition hover:border-sky-200/90 hover:shadow-lg hover:shadow-sky-900/10">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/90 via-transparent to-cyan-50/50 opacity-0 transition group-hover:opacity-100"
              aria-hidden
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total users</p>
              <h2 className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-slate-900">{totalUsers}</h2>
            </div>
            <div className="relative rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-4 shadow-inner">
              <Users className="text-emerald-700" size={28} strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
