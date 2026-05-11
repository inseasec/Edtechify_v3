import { useState, useEffect, useCallback, useMemo } from 'react'
import { Trash2, Lock, Unlock } from 'lucide-react'
import api from '@/lib/api'
import { showSuccessToast, showErrorToast, getApiErrorMessage } from '@/utils/toastUtils'

const PAGE_SIZE = 12

function dash(v) {
  if (v == null || String(v).trim() === '') return '—'
  return String(v)
}

export default function UnusedAccounts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyUserId, setBusyUserId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true)
      // Same endpoint as Clients (`/clients/portal-rows`) so reverse proxies / gateways that allowlist
      // paths continue to work; we only show rows where the portal was never launched.
      const res = await api.get('/clients/portal-rows')
      const raw = res.data?.data ?? res.data ?? []
      const list = Array.isArray(raw) ? raw : []
      setRows(list.filter((r) => r && r.portalLaunched === false))
    } catch (e) {
      console.error(e)
      showErrorToast(getApiErrorMessage(e, 'Could not load unused accounts'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  useEffect(() => {
    if (!pendingDelete) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setPendingDelete(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingDelete])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const blob = [
        r.email,
        r.mobileNo,
        r.companyName,
        r.contactPersonName,
        r.userName,
      ]
        .map((x) => String(x ?? '').toLowerCase())
        .join(' ')
      return blob.includes(q)
    })
  }, [rows, search])

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1)
    setPage((p) => Math.min(Math.max(1, p), tp))
  }, [filtered.length])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const toggleFreeze = async (row) => {
    const uid = row.userId
    if (uid == null) return
    try {
      setBusyUserId(uid)
      await api.put(`/admin/unused-accounts/${uid}/toggle-freeze`)
      setRows((prev) =>
        prev.map((r) => (r.userId === uid ? { ...r, frozen: !r.frozen } : r)),
      )
      showSuccessToast(row.frozen ? 'Account enabled.' : 'Account disabled.')
    } catch (e) {
      showErrorToast(getApiErrorMessage(e, 'Could not update account status'))
    } finally {
      setBusyUserId(null)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const uid = pendingDelete.userId
    if (uid == null) {
      setPendingDelete(null)
      return
    }
    try {
      setBusyUserId(uid)
      await api.delete(`/admin/unused-accounts/${uid}`)
      setRows((prev) => prev.filter((r) => r.userId !== uid))
      showSuccessToast('Account permanently removed from the database and storage.')
      setPendingDelete(null)
    } catch (e) {
      showErrorToast(getApiErrorMessage(e, 'Could not delete account'))
    } finally {
      setBusyUserId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1)

  return (
    <div className="mx-auto max-w-6xl px-1 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Unused accounts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Only learners who <strong className="font-medium text-slate-800">never launched a portal</strong> appear
          here. Anyone already on the Clients list (has a live portal) is excluded and cannot be removed from this page
          — the server rejects delete if a portal record exists. Company and contact columns are usually empty until
          launch; the contact column falls back to signup name. Delete removes the row from the database, related
          billing data, and their <code className="rounded bg-slate-200/80 px-1">accounts/</code> uploads (and stored
          profile path) so they can sign up again.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="block text-sm text-slate-600">
          <span className="sr-only">Search</span>
          <input
            type="search"
            placeholder="Search email, mobile, name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 sm:max-w-md"
          />
        </label>
        <button
          type="button"
          onClick={() => fetchRows()}
          disabled={loading}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No unused accounts match your search.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.userId} className={row.frozen ? 'bg-amber-50/40' : ''}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {dash(row.email)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{dash(row.mobileNo)}</td>
                    <td className="max-w-[10rem] truncate px-4 py-3 text-slate-600" title={dash(row.companyName)}>
                      {dash(row.companyName)}
                    </td>
                    <td className="max-w-[10rem] truncate px-4 py-3 text-slate-600" title={dash(row.contactPersonName || row.userName)}>
                      {dash(row.contactPersonName || row.userName)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFreeze(row)}
                          disabled={busyUserId === row.userId}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition disabled:opacity-50 border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          title={row.frozen ? 'Enable login' : 'Disable login'}
                        >
                          {row.frozen ? (
                            <>
                              <Unlock className="h-3.5 w-3.5" aria-hidden /> Enable
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5" aria-hidden /> Disable
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(row)}
                          disabled={busyUserId === row.userId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>
              Page {page} of {totalPages} · {filtered.length} accounts
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-title"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="max-w-md cursor-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="del-title" className="text-lg font-semibold text-slate-900">
              Delete account permanently?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This removes user ID <strong className="font-mono">{pendingDelete.userId}</strong> (
              <strong>{dash(pendingDelete.email)}</strong>) from the database, billing details, invoices, payments, and
              their uploads under storage. They can sign up again afterwards. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
                onClick={() => confirmDelete()}
                disabled={busyUserId === pendingDelete.userId}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
