import React, { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import { showErrorToast, showSuccessToast, getApiErrorMessage } from '@/utils/toastUtils'

const emptyForm = () => ({
  name: '',
  description: '',
  price: '',
  currency: 'INR',
  durationDays: '',
  storageLimitMb: '',
  active: true,
  sortOrder: 0,
})

function formatDurationDays(days) {
  const d = Number(days)
  if (!Number.isFinite(d) || d < 1) return '—'
  if (d % 365 === 0) {
    const y = d / 365
    return `${y} year${y === 1 ? '' : 's'}`
  }
  if (d % 30 === 0) {
    const m = d / 30
    return `${m} month${m === 1 ? '' : 's'}`
  }
  return `${d} day${d === 1 ? '' : 's'}`
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/subscription-plans')
      setPlans(Array.isArray(data) ? data : [])
    } catch (e) {
      showErrorToast(getApiErrorMessage(e, 'Could not load plans'))
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      price: p.price != null ? String(p.price) : '',
      currency: p.currency ?? 'INR',
      durationDays: p.durationDays != null ? String(p.durationDays) : '',
      storageLimitMb: p.storageLimitMb != null ? String(p.storageLimitMb) : '',
      active: p.active !== false,
      sortOrder: p.sortOrder ?? 0,
    })
  }

  const payloadFromForm = () => {
    const price = Number(form.price)
    const durationDays = parseInt(form.durationDays, 10)
    const storageLimitMb = parseInt(form.storageLimitMb, 10)
    const sortOrder = parseInt(form.sortOrder, 10)
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      currency: (form.currency || 'INR').trim() || 'INR',
      durationDays,
      storageLimitMb,
      active: Boolean(form.active),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    }
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = payloadFromForm()
      if (!body.name) {
        showErrorToast('Name is required.')
        setSaving(false)
        return
      }
      if (!Number.isFinite(body.price) || body.price < 0) {
        showErrorToast('Enter a valid price.')
        setSaving(false)
        return
      }
      if (!Number.isFinite(body.durationDays) || body.durationDays < 1) {
        showErrorToast('Duration must be at least 1 day.')
        setSaving(false)
        return
      }
      if (!Number.isFinite(body.storageLimitMb) || body.storageLimitMb < 1) {
        showErrorToast('Storage limit must be at least 1 MB.')
        setSaving(false)
        return
      }
      if (editingId == null) {
        await api.post('/subscription-plans', body)
        showSuccessToast('Plan created.')
      } else {
        await api.put(`/subscription-plans/${editingId}`, body)
        showSuccessToast('Plan updated.')
      }
      setForm(emptyForm())
      setEditingId(null)
      await load()
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this plan? Customers will no longer see it.')) return
    try {
      await api.delete(`/subscription-plans/${id}`)
      showSuccessToast('Plan deleted.')
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm())
      }
      await load()
    } catch (e) {
      showErrorToast(getApiErrorMessage(e, 'Delete failed'))
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription Plans</h1>
        <p className="mt-1 text-sm text-slate-600">
          Define plans shown when customers choose <strong>Upgrade Plan</strong> on their portal. Prices are in
          rupees; Razorpay uses paise internally.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">All plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                  <th className="px-4 py-2 font-medium">Storage</th>
                  <th className="px-4 py-2 font-medium">Active</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No plans yet. Create one using the form.
                    </td>
                  </tr>
                ) : (
                  plans.map((p) => (
                    <tr key={p.id} className={editingId === p.id ? 'bg-sky-50/60' : 'hover:bg-slate-50/80'}>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {(p.currency || 'INR') === 'INR' ? '₹' : `${p.currency} `}
                        {p.price != null ? Number(p.price).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{formatDurationDays(p.durationDays)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {p.storageLimitMb != null ? `${p.storageLimitMb} MB` : '—'}
                      </td>
                      <td className="px-4 py-3">{p.active ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="mr-2 text-sky-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => remove(p.id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={save} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">{editingId == null ? 'New plan' : 'Edit plan'}</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-slate-600">
              Name *
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-slate-600">
                Price (rupees) *
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Currency
                <input
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-slate-600">
                Duration (days) *
                <input
                  required
                  type="number"
                  min={1}
                  value={form.durationDays}
                  onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Storage limit (MB) *
                <input
                  required
                  type="number"
                  min={1}
                  value={form.storageLimitMb}
                  onChange={(e) => setForm((f) => ({ ...f, storageLimitMb: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active (visible on user site)
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Sort order
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
              </label>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId == null ? 'Create plan' : 'Save changes'}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={startCreate}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
