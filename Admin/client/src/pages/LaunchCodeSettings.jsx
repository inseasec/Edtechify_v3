import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'

export default function LaunchCodeSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requireLaunchCode, setRequireLaunchCode] = useState(false)
  const [hasLaunchCodeConfigured, setHasLaunchCodeConfigured] = useState(false)
  const [launchCode, setLaunchCode] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api
      .get('/clients/launch-gate-settings')
      .then((res) => {
        if (!mounted) return
        setRequireLaunchCode(Boolean(res.data?.requireLaunchCode))
        setHasLaunchCodeConfigured(Boolean(res.data?.hasLaunchCodeConfigured))
        setLaunchCode(typeof res.data?.launchCode === 'string' ? res.data.launchCode : '')
      })
      .catch((e) => {
        showErrorToast(e?.response?.data?.message || e?.message || 'Failed to load launch gate settings')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const body = {
        requireLaunchCode,
        launchCode: launchCode.trim(),
      }
      const res = await api.put('/clients/launch-gate-settings', body)
      setRequireLaunchCode(Boolean(res.data?.requireLaunchCode))
      setHasLaunchCodeConfigured(Boolean(res.data?.hasLaunchCodeConfigured))
      setLaunchCode(typeof res.data?.launchCode === 'string' ? res.data.launchCode : '')
      showSuccessToast('Launch code settings saved.')
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === 'string' ? e.response.data : null) ||
        e?.message ||
        'Failed to save'
      showErrorToast(String(msg))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Launch code</h1>
      <p className="mt-2 text-sm text-slate-600">
        When enabled, new accounts must enter this code on the user site before they can open the launch wizard.
        Use this while your edtech launch flow is not ready for self‑serve signups.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              checked={requireLaunchCode}
              onChange={(e) => setRequireLaunchCode(e.target.checked)}
            />
            <span>
              <span className="font-medium text-slate-900">Require launch code</span>
              <span className="mt-0.5 block text-sm text-slate-600">
                If checked, clients see a launch code step before organization details. You must set a non‑empty
                code the first time you turn this on.
              </span>
            </span>
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor="launch-code-input">
              Launch code
            </label>
            <input
              id="launch-code-input"
              type="text"
              autoComplete="off"
              placeholder={hasLaunchCodeConfigured ? 'Edit to replace the code shown above' : 'Choose a code'}
              className="mt-1.5 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={launchCode}
              onChange={(e) => setLaunchCode(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {hasLaunchCodeConfigured
                ? 'The active code stays visible here so you can share it with clients. Save with an empty field to keep it unchanged, or type a new code to rotate it.'
                : 'Save with a code before enabling the requirement, or enter a code in the same save when enabling.'}
            </p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
