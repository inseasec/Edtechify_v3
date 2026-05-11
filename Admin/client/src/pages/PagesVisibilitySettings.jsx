import React, { useCallback, useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'
import { CONFIGURABLE_PUBLIC_NAV_PAGES } from '@/constants/publicNavPages'
import { showErrorToast, showSuccessToast, getApiErrorMessage } from '@/utils/toastUtils'

export default function PagesVisibilitySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  /** Paths to hide from public navbar/footer */
  const [hiddenPaths, setHiddenPaths] = useState(() => new Set())
  /** Last saved snapshot for Cancel */
  const [serverHidden, setServerHidden] = useState(() => new Set())

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/organizations/details')
      .then((res) => {
        const raw = Array.isArray(res?.data?.navbarHiddenPaths) ? res.data.navbarHiddenPaths : []
        const next = new Set(raw.map(String))
        setHiddenPaths(next)
        setServerHidden(new Set(next))
      })
      .catch((e) => {
        showErrorToast(getApiErrorMessage(e, 'Failed to load page visibility'))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const isVisible = useCallback(
    (mLink) => !hiddenPaths.has(mLink),
    [hiddenPaths],
  )

  const toggleVisible = useCallback((mLink, checked) => {
    setHiddenPaths((prev) => {
      const n = new Set(prev)
      if (checked) {
        n.delete(mLink)
      } else {
        n.add(mLink)
      }
      return n
    })
  }, [])

  const dirty = useMemo(() => {
    if (hiddenPaths.size !== serverHidden.size) return true
    for (const p of hiddenPaths) {
      if (!serverHidden.has(p)) return true
    }
    return false
  }, [hiddenPaths, serverHidden])

  const handleSave = async () => {
    setSaving(true)
    try {
      const navbarHiddenPaths = [...hiddenPaths]
      await api.post('/admin/organization/navbar-hidden-paths', { navbarHiddenPaths })
      showSuccessToast('Page visibility saved.')
      const snap = new Set(hiddenPaths)
      setServerHidden(snap)
    } catch (e) {
      showErrorToast(getApiErrorMessage(e, 'Could not save page visibility'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setHiddenPaths(new Set(serverHidden))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Pages visibility settings</h1>
      <p className="mt-2 text-sm text-slate-600">
        Uncheck a page to hide its link from the public site navbar and footer. Home stays visible. URLs can still be opened
        directly if someone knows the path.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
            {CONFIGURABLE_PUBLIC_NAV_PAGES.map(({ mLink, mName }) => (
              <li key={mLink} className="flex items-center gap-4 px-4 py-3 first:rounded-t-xl last:rounded-b-xl">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                    checked={isVisible(mLink)}
                    onChange={(e) => toggleVisible(mLink, e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-900">{mName}</span>
                  <span className="font-mono text-xs text-slate-500">{mLink}</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => handleCancel()}
              disabled={saving || !dirty}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || !dirty}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
