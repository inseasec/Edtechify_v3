import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Check,
  CalendarDays,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react'
import api from '@/lib/api'
import { showSuccessToast, showErrorToast, getApiErrorMessage } from '@/utils/toastUtils'

const usersPerPage = 10

function formatBytes(n) {
  if (n == null) return '—'
  const b = Number(n)
  if (!Number.isFinite(b) || b < 0) return '—'
  if (b < 1024) return `${Math.round(b)} B`
  const kb = b / 1024
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

const LIVE_SINCE_DAY_CAP = 30
const DAYS_PER_MONTH_IN_LABEL = 30
const DAYS_PER_YEAR_IN_LABEL = 365

/** One decimal abbreviation (e.g. 1.2 months); whole numbers omit .0 */
function formatScaledAbbrev(amount, singularWord, pluralWord) {
  const roundedOneDec = Math.round(amount * 10) / 10
  const approxWhole =
    Math.abs(roundedOneDec - Math.round(roundedOneDec)) < 1e-6
  const str = approxWhole ? String(Math.round(roundedOneDec)) : roundedOneDec.toFixed(1)
  const magnitude = Number(str)
  const label = magnitude === 1 ? singularWord : pluralWord
  return `${str} ${label}`
}

/** Days portal has been live (API field); legacy fallback for cached responses. */
function formatPortalLiveLabel(row) {
  if (!row.portalLaunched) return '—'
  const raw = row.daysSincePortalLive ?? row.daysSinceRegistration
  if (raw == null) return '—'
  const d = Math.floor(Number(raw))
  if (!Number.isFinite(d) || d < 0) return '—'

  // 0–30: show calendar days counted by the API (whole days since launch anchor)
  if (d <= LIVE_SINCE_DAY_CAP) {
    if (d === 0) return '0 days'
    if (d === 1) return '1 day'
    return `${d} days`
  }

  if (d < DAYS_PER_YEAR_IN_LABEL) {
    return formatScaledAbbrev(d / DAYS_PER_MONTH_IN_LABEL, 'month', 'months')
  }

  return formatScaledAbbrev(d / DAYS_PER_YEAR_IN_LABEL, 'year', 'years')
}

function effectiveTrialDays(row, platform) {
  const v = row.effectiveTrialLimitDays
  if (v != null && Number.isFinite(Number(v))) return Number(v)
  return Number(platform.trialDurationDays ?? 14)
}

function effectiveTrialMb(row, platform) {
  const v = row.effectiveTrialLimitStorageMb
  if (v != null && Number.isFinite(Number(v))) return Number(v)
  return Number(platform.trialStorageMb ?? 512)
}

function usingPlatformTrialCaps(row) {
  return row.trialLimitDaysOverride == null && row.trialLimitStorageMbOverride == null
}

function isTrialPlanRow(row) {
  const sub = String(row.subscription ?? '').trim()
  if (!sub) return true
  const s = sub.toLowerCase()
  // Treat trial-like statuses as trial so expiry editing stays available.
  // Examples: "Trial", "trial_expired", "Trial expired", etc.
  return s === 'trial' || s.startsWith('trial_') || s.startsWith('trial ') || s.startsWith('trial-')
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function localDateToIso(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function isoToLocalDate(iso) {
  if (!iso || typeof iso !== 'string') return null
  const parts = iso.slice(0, 10).split('-').map(Number)
  if (parts.length !== 3 || parts.some((x) => !Number.isFinite(x))) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/** Last calendar day of trial (inclusive): anchor plus (trialDays − 1). */
function trialInclusiveEndIso(anchorIso, trialDays) {
  if (!anchorIso || !Number.isFinite(trialDays) || trialDays < 1) return null
  const d = isoToLocalDate(anchorIso)
  if (!d) return null
  d.setDate(d.getDate() + trialDays - 1)
  return localDateToIso(d)
}

/** Derive stored trial-day count from chosen inclusive last day. */
function trialDaysFromInclusiveEnd(anchorIso, endInclusiveIso) {
  const a = isoToLocalDate(anchorIso)
  const e = isoToLocalDate(endInclusiveIso)
  if (!a || !e) return NaN
  const diff = Math.round((e.getTime() - a.getTime()) / (24 * 60 * 60 * 1000))
  return diff + 1
}

function fallbackAnchorIsoFromRow(row) {
  const raw = row.daysSincePortalLive ?? row.daysSinceRegistration
  if (raw == null) return null
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n) || n < 0) return null
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return localDateToIso(d)
}

/** e.g. 22 Apr 2026 — last calendar day included in trial */
function formatExpiryDisplay(iso) {
  if (!iso) return '—'
  const d = isoToLocalDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminStudents() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  /** '' = all, 'trial' = launched + Trial plan, 'paid' = launched + non-trial plan */
  const [planFilter, setPlanFilter] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw] = useState({ new: false, confirm: false })

  const [trialDaysInput, setTrialDaysInput] = useState('14')
  const [trialMbInput, setTrialMbInput] = useState('512')
  /** Snapshot from server — inputs must match until user edits */
  const [savedTrialDefaults, setSavedTrialDefaults] = useState({
    trialDurationDays: 14,
    trialStorageMb: 512,
  })
  const [savingTrialDefaults, setSavingTrialDefaults] = useState(false)

  const [limitDraftByUserId, setLimitDraftByUserId] = useState({})
  const [limitSavingUid, setLimitSavingUid] = useState(null)
  /** When set, that row’s Expires cell shows the date picker (otherwise only the formatted date). */
  const [expiryEditingKey, setExpiryEditingKey] = useState(null)

  const [detailRow, setDetailRow] = useState(null)

  const fetchPortalRows = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/clients/portal-rows')
      const raw = res.data?.data ?? res.data ?? []
      const list = Array.isArray(raw) ? raw : []
      setRows(
        list.map((r) => ({
          ...r,
          portalAccessStatus: r.portalAccessStatus ?? 'ACTIVE',
        })),
      )
    } catch (error) {
      console.error('Error fetching clients:', error)
      showErrorToast(error?.response?.data?.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortalRows()
  }, [fetchPortalRows])

  useEffect(() => {
    if (expiryEditingKey == null) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setExpiryEditingKey(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expiryEditingKey])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/clients/trial-defaults')
        const d = res.data
        if (cancelled || !d) return
        const days = Number(d.trialDurationDays ?? 14)
        const mb = Number(d.trialStorageMb ?? 512)
        setSavedTrialDefaults({ trialDurationDays: days, trialStorageMb: mb })
        setTrialDaysInput(String(days))
        setTrialMbInput(String(mb))
      } catch (e) {
        console.error('trial-defaults', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const saveTrialDefaults = async () => {
    const days = parseInt(trialDaysInput, 10)
    const mb = parseInt(trialMbInput, 10)
    if (!Number.isFinite(days) || days < 1) {
      showErrorToast('Enter a valid number of days (1 or more).')
      return
    }
    if (!Number.isFinite(mb) || mb < 1) {
      showErrorToast('Enter a valid storage size in MB (1 or more).')
      return
    }
    try {
      setSavingTrialDefaults(true)
      await api.put('/clients/trial-defaults', {
        trialDurationDays: days,
        trialStorageMb: mb,
      })
      setSavedTrialDefaults({ trialDurationDays: days, trialStorageMb: mb })
      showSuccessToast('Default trial limits saved.')
      await fetchPortalRows()
      setLimitDraftByUserId({})
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, 'Could not save defaults'))
    } finally {
      setSavingTrialDefaults(false)
    }
  }

  const normalizePortalRowPayload = useCallback((r) => {
    if (!r || typeof r !== 'object') return r
    return {
      ...r,
      portalAccessStatus: r.portalAccessStatus ?? 'ACTIVE',
    }
  }, [])

  const patchLimitDraft = useCallback(
    (userIdStr, row, patch) => {
      setLimitDraftByUserId((prev) => {
        const anchorIso = row.trialAnchorDate ?? fallbackAnchorIsoFromRow(row)
        const effD = effectiveTrialDays(row, savedTrialDefaults)
        const effM = effectiveTrialMb(row, savedTrialDefaults)
        const trial = isTrialPlanRow(row)
        const baseExpiry =
          trial && anchorIso ? trialInclusiveEndIso(anchorIso, effD) : null
        const cur =
          prev[userIdStr] ??
          (trial && baseExpiry
            ? { expiryIso: baseExpiry, mb: String(effM) }
            : { mb: String(effM) })
        return { ...prev, [userIdStr]: { ...cur, ...patch } }
      })
    },
    [savedTrialDefaults],
  )

  const saveClientTrialLimits = async (row) => {
    const uid = row.userId ?? row.user_id ?? row.id
    if (uid == null || uid === '') {
      showErrorToast('Missing client user id; refresh the page and try again.')
      return
    }
    const key = String(uid)
    const isTrial = isTrialPlanRow(row)
    const anchorIso = row.trialAnchorDate ?? fallbackAnchorIsoFromRow(row)
    const effD = effectiveTrialDays(row, savedTrialDefaults)
    const effM = effectiveTrialMb(row, savedTrialDefaults)
    const baseExpiry =
      isTrial && anchorIso ? trialInclusiveEndIso(anchorIso, effD) : null
    const draft =
      limitDraftByUserId[key] ??
      (isTrial && baseExpiry
        ? { expiryIso: baseExpiry, mb: String(effM) }
        : { mb: String(effM) })
    const expiryIso =
      draft.expiryIso ??
      baseExpiry ??
      (isTrial && anchorIso ? trialInclusiveEndIso(anchorIso, effD) : null)
    let d = effD
    if (isTrial) {
      if (!anchorIso || !expiryIso) {
        showErrorToast(
          'Could not compute trial expiry (missing anchor date). Refresh the client list.',
        )
        return
      }
      d = trialDaysFromInclusiveEnd(anchorIso, expiryIso)
      const endDt = isoToLocalDate(expiryIso)
      const anchDt = isoToLocalDate(anchorIso)
      if (!Number.isFinite(d) || d < 1 || d > 3650 || !endDt || !anchDt || endDt < anchDt) {
        showErrorToast(
          'Invalid expiry date. Choose a date on or after trial start (' +
            formatExpiryDisplay(anchorIso) +
            ').',
        )
        return
      }
    }
    const m = parseInt(String(draft.mb ?? String(effM)).trim(), 10)
    if (!Number.isFinite(m) || m < 1 || m > 1_000_000) {
      showErrorToast('Storage limit: enter 1–1,000,000 MB.')
      return
    }
    try {
      setLimitSavingUid(uid)
      const res = await api.put(`/clients/user/${uid}/trial-overrides`, {
        trialLimitDays: d,
        trialLimitStorageMb: m,
      })
      const updated = normalizePortalRowPayload(res.data?.data ?? res.data)
      if (updated?.userId != null || updated?.id != null) {
        const id = updated.userId ?? updated.id
        setRows((prev) =>
          prev.map((r) => ((r.userId ?? r.id) === id ? { ...r, ...updated } : r)),
        )
      }
      setLimitDraftByUserId((p) => {
        const n = { ...p }
        delete n[key]
        return n
      })
      setExpiryEditingKey((cur) => (cur === key ? null : cur))
      showSuccessToast('Trial limits saved for this client.')
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, 'Could not save limits'))
    } finally {
      setLimitSavingUid(null)
    }
  }

  const revertClientTrialLimitsToPlatform = async (row) => {
    const uid = row.userId ?? row.user_id ?? row.id
    if (uid == null || uid === '') {
      showErrorToast('Missing client user id; refresh the page and try again.')
      return
    }
    const key = String(uid)
    try {
      setLimitSavingUid(uid)
      const res = await api.put(`/clients/user/${uid}/trial-overrides`, {
        resetToPlatformDefaults: true,
      })
      const updated = normalizePortalRowPayload(res.data?.data ?? res.data)
      if (updated?.userId != null || updated?.id != null) {
        const id = updated.userId ?? updated.id
        setRows((prev) =>
          prev.map((r) => ((r.userId ?? r.id) === id ? { ...r, ...updated } : r)),
        )
      }
      setLimitDraftByUserId((p) => {
        const n = { ...p }
        delete n[key]
        return n
      })
      setExpiryEditingKey((cur) => (cur === key ? null : cur))
      showSuccessToast('This client now uses platform default limits.')
    } catch (err) {
      showErrorToast(getApiErrorMessage(err, 'Could not revert limits'))
    } finally {
      setLimitSavingUid(null)
    }
  }

  const trialDefaultsDirty = useMemo(() => {
    const dTrim = trialDaysInput.trim()
    const mTrim = trialMbInput.trim()
    return (
      dTrim !== String(savedTrialDefaults.trialDurationDays) ||
      mTrim !== String(savedTrialDefaults.trialStorageMb)
    )
  }, [trialDaysInput, trialMbInput, savedTrialDefaults])

  const cancelTrialDefaultsEdit = () => {
    setTrialDaysInput(String(savedTrialDefaults.trialDurationDays))
    setTrialMbInput(String(savedTrialDefaults.trialStorageMb))
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, planFilter])

  const filteredRows = useMemo(() => {
    const searchTerm = search.toLowerCase().trim()
    return rows.filter((row) => {
      const haystack = [
        row.userName,
        row.companyName,
        row.contactPersonName,
        row.email,
        row.portalEmail,
        row.mobileNo,
        row.portalPhone,
        row.subdomain,
        row.portalAccessStatus,
      ]
      const searchMatch =
        !searchTerm ||
        haystack.some((v) => String(v ?? '').toLowerCase().includes(searchTerm))

      const sub = String(row.subscription ?? '').trim()
      const isTrialPlan = !sub || sub.toLowerCase() === 'trial'
      const planMatch =
        planFilter === '' ||
        (planFilter === 'trial' && row.portalLaunched && isTrialPlan) ||
        (planFilter === 'paid' && row.portalLaunched && !isTrialPlan)

      return searchMatch && planMatch
    })
  }, [rows, search, planFilter])

  useEffect(() => {
    const tp = Math.ceil(filteredRows.length / usersPerPage)
    if (tp === 0) {
      setCurrentPage(1)
      return
    }
    setCurrentPage((p) => Math.min(p, tp))
  }, [filteredRows.length])

  const indexOfLast = currentPage * usersPerPage
  const indexOfFirst = indexOfLast - usersPerPage
  const currentRows = filteredRows.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / usersPerPage))

  const visiblePageNumbers = useMemo(() => {
    const total = Math.max(1, totalPages)
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    const nums = new Set([
      1,
      total,
      currentPage,
      currentPage - 1,
      currentPage + 1,
      currentPage - 2,
      currentPage + 2,
    ])
    return [...nums].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  }, [currentPage, totalPages])

  const rangeStart = filteredRows.length === 0 ? 0 : indexOfFirst + 1
  const rangeEnd = filteredRows.length === 0 ? 0 : Math.min(indexOfLast, filteredRows.length)

  const handleChangePassword = async () => {
    if (!selectedUser) return
    if (form.newPassword !== form.confirmPassword) {
      showErrorToast('Passwords do not match')
      return
    }
    try {
      const res = await api.put(`/users/updatePassword/${selectedUser.userId ?? selectedUser.id}`, {
        newPassword: form.newPassword,
      })
      setShowPasswordModal(false)
      setForm({ newPassword: '', confirmPassword: '' })
      setSelectedUser(null)

      const raw = res.data?.message ?? res.data
      const msg = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '')
      if (msg.toLowerCase().includes('success')) {
        showSuccessToast(msg)
      } else {
        showErrorToast(msg || 'Update completed')
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ??
        (typeof err?.response?.data === 'string' ? err.response.data : null) ??
        err?.message ??
        'Something went wrong'
      showErrorToast(String(errorMsg))
    }
  }

  const togglePortalLiveStatus = async (userId, nextYes) => {
    try {
      const desired = nextYes ? 'YES' : 'NO'
      await api.put(`/clients/user/${userId}/portal-live-status`, { portalLiveStatus: desired })
      setRows((prev) =>
        prev.map((r) =>
          (r.userId ?? r.id) === userId ? { ...r, portalAccessStatus: desired } : r,
        ),
      )
    } catch (err) {
      console.error(err)
      const msg = getApiErrorMessage(err)
      const code = err?.response?.status
      showErrorToast(code ? `Could not update live status (${code}): ${msg}` : `Could not update live status: ${msg}`)
    }
  }

  return (
    <div className="bg-[#f3f4f6] min-h-screen -mx-4 sm:mx-0 sm:px-0">
      <div className="bg-white border border-gray-200 mt-[1%] rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Default trial limits</h3>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Applies to all <strong>Trial</strong> clients: maximum trial length and total disk space before
          upgrade.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Duration (days)</span>
            <input
              type="number"
              min={1}
              max={3650}
              className="border border-gray-300 rounded-md px-3 py-2 w-[7rem] text-base"
              value={trialDaysInput}
              onChange={(e) => setTrialDaysInput(e.target.value)}
              aria-label="Default trial duration in days"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Storage (MB)</span>
            <input
              type="number"
              min={1}
              max={1000000}
              className="border border-gray-300 rounded-md px-3 py-2 w-[8rem] text-base"
              value={trialMbInput}
              onChange={(e) => setTrialMbInput(e.target.value)}
              aria-label="Default trial storage in megabytes"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {trialDefaultsDirty ? (
              <button
                type="button"
                onClick={cancelTrialDefaultsEdit}
                disabled={savingTrialDefaults}
                className="text-sm font-medium px-5 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              onClick={saveTrialDefaults}
              disabled={!trialDefaultsDirty || savingTrialDefaults}
              title={trialDefaultsDirty ? undefined : 'Change the values above to save'}
              className="bg-sky-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-sky-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:hover:bg-gray-200 disabled:cursor-not-allowed"
            >
              {savingTrialDefaults ? 'Saving…' : 'Save defaults'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#f7f7f7] border border-gray-200 mt-3 rounded-lg p-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 lg:w-[38%]">
            <h2 className="text-base font-medium uppercase text-gray-700 whitespace-nowrap">
              Subscription
            </h2>
            <select
              className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm h-[38px] min-w-[11rem]"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              aria-label="Filter by subscription"
            >
              <option value="">All clients</option>
              <option value="trial">Trial only</option>
              <option value="paid">Paid only</option>
            </select>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:ml-8">
            <input
              type="text"
              placeholder="Search company, contact, phone, email…"
              className="min-w-[200px] flex-1 max-w-md border border-black rounded-md px-3 py-2 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setPlanFilter('')
              }}
              className="bg-black text-white text-sm px-4 py-2 rounded-md hover:bg-gray-900"
            >
              Reset filters
            </button>
          </div>
          <p className="text-base bg-black text-white font-semibold rounded-md px-4 py-2.5 lg:w-auto text-center">
            Showing {filteredRows.length} clients
          </p>
        </div>
      </div>

      <div className="mt-3 min-w-0 rounded-lg border border-gray-200 bg-white overflow-x-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-600">Loading…</div>
        ) : (
          <table className="w-full min-w-[1100px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '5%' }} />
            </colgroup>
            <thead className="bg-[#f9fafb] border-b text-gray-600 text-sm">
              <tr>
                <th className="py-2.5 pl-4 pr-3 text-left font-semibold align-bottom min-w-0">
                  Company
                </th>
                <th className="py-2.5 pl-3 pr-3 text-left font-semibold whitespace-nowrap align-bottom">
                  Phone
                </th>
                <th className="py-2.5 pl-3 pr-3 text-left font-semibold align-bottom min-w-0">
                  Contact
                </th>
                <th
                  className="py-2.5 pl-3 pr-3 text-left font-semibold whitespace-nowrap align-bottom"
                  title="Approximate time live: shows days through 30, then months (30-day shorthand, e.g. 1.2 months), then years (365-day shorthand). Based on portal launch anchor vs today."
                >
                  Live Since
                </th>
                <th
                  className="py-2.5 px-3 text-left font-semibold whitespace-nowrap align-bottom"
                  title="Storage used on this portal"
                >
                  Storage
                </th>
                <th
                  className="py-2.5 pl-3 pr-3 text-left font-semibold align-bottom min-w-0"
                  title="Inclusive last calendar day of access (trial or subscription)."
                >
                  Expires
                </th>
                <th
                  className="py-2.5 pl-6 pr-3 text-left font-semibold whitespace-nowrap align-bottom border-l border-gray-200"
                  title="Trial storage cap (MB). Save applies expiry + MB together for trials; MB only semantics for paid portals."
                >
                  Data
                </th>
                <th
                  className="py-2.5 px-2 text-center font-semibold"
                  title="Contact, email & portal URLs"
                >
                  <Info className="h-5 w-5 mx-auto text-gray-500" aria-hidden />
                  <span className="sr-only">Details</span>
                </th>
                <th
                  className="py-2.5 pl-3 pr-6 text-left font-semibold whitespace-nowrap"
                  title="Plan status (trial/subscription/expired)"
                >
                  Plan
                </th>
                <th
                  className="py-2.5 pl-6 pr-4 text-center font-semibold whitespace-nowrap border-l border-gray-200"
                  title="Portal live (YES/NO). Edits here do not change expiry or plan; those fields do not change this toggle."
                >
                  Live
                </th>
              </tr>
            </thead>
            <tbody className="text-base font-normal leading-snug text-gray-900">
              {currentRows.map((row) => {
                const uid = row.userId ?? row.user_id ?? row.id
                const uidKey = String(uid)
                const phone = row.portalPhone || row.mobileNo
                const effD = effectiveTrialDays(row, savedTrialDefaults)
                const effM = effectiveTrialMb(row, savedTrialDefaults)
                const isTrial = isTrialPlanRow(row)
                const anchorIso = row.trialAnchorDate ?? fallbackAnchorIsoFromRow(row)
                const baseEndIso =
                  isTrial && anchorIso ? trialInclusiveEndIso(anchorIso, effD) : null
                const limitDraft = limitDraftByUserId[uidKey]
                const expiryIso = isTrial
                  ? limitDraft?.expiryIso ?? baseEndIso
                  : row.trialExpiresOn ?? (anchorIso ? trialInclusiveEndIso(anchorIso, effD) : null)
                const mbStr = limitDraft?.mb ?? String(effM)
                const pm = parseInt(String(mbStr).trim(), 10)
                let pdComputed = effD
                if (isTrial && anchorIso && expiryIso) {
                  pdComputed = trialDaysFromInclusiveEnd(anchorIso, expiryIso)
                }
                const anchDt = anchorIso ? isoToLocalDate(anchorIso) : null
                const endDt = expiryIso ? isoToLocalDate(expiryIso) : null
                const trialExpiryValid =
                  !isTrial ||
                  !!(
                    anchorIso &&
                    expiryIso &&
                    anchDt &&
                    endDt &&
                    endDt >= anchDt &&
                    Number.isFinite(pdComputed) &&
                    pdComputed >= 1 &&
                    pdComputed <= 3650
                  )
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const expiredByDate = !!(endDt && endDt.getTime() < today.getTime())
                const planLabel = row.portalLaunched
                  ? expiredByDate
                    ? isTrial
                      ? 'Trial_expired'
                      : 'subscription_expired'
                    : isTrial
                      ? 'Trial'
                      : String(row.subscription || '').trim() || 'Subscription'
                  : '—'
                const pas = String(row.portalAccessStatus ?? '').trim().toUpperCase()
                const liveYes = pas === 'YES' || pas === 'ACTIVE' || pas === 'TRUE'
                const liveEffective = row.portalLaunched ? liveYes : false
                const limitParsesOk =
                  trialExpiryValid &&
                  Number.isFinite(pm) &&
                  pm >= 1 &&
                  pm <= 1_000_000
                const expiryDirty = limitParsesOk && isTrial && pdComputed !== effD
                const mbDirty = limitParsesOk && pm !== effM
                const limitsDirty = expiryDirty || mbDirty
                const platformCaps = usingPlatformTrialCaps(row)
                return (
                  <tr key={uid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td
                      className="py-2.5 pl-3 pr-0.5 align-middle min-w-0 truncate text-gray-800"
                      title={row.companyName || ''}
                    >
                      {row.companyName || '—'}
                    </td>
                    <td className="py-2.5 pl-0.5 pr-1 align-middle whitespace-nowrap text-gray-900">
                      {phone || '—'}
                    </td>
                    <td
                      className="py-2.5 pl-1 pr-0.5 align-middle min-w-0 truncate text-gray-900"
                      title={row.contactPersonName || undefined}
                    >
                      {row.contactPersonName || '—'}
                    </td>
                    <td
                      className="py-2.5 pl-0.5 pr-2 align-middle tabular-nums text-gray-900 whitespace-nowrap"
                      title={
                        row.portalLaunched
                          ? 'Days from portal launch date to today (signup date used only when launch timestamp is missing)'
                          : undefined
                      }
                    >
                      {formatPortalLiveLabel(row)}
                    </td>
                    <td className="py-2.5 px-2 align-middle text-gray-900 whitespace-nowrap">
                      {row.portalLaunched ? formatBytes(row.storageUsedBytes ?? 0) : '—'}
                    </td>
                    <td
                      className={`py-2.5 pl-2 pr-4 align-middle min-w-0 ${
                        expiryEditingKey === uidKey ? 'overflow-visible' : 'overflow-hidden'
                      }`}
                      title={
                        isTrial && anchorIso
                          ? `Trial start (anchor date): ${formatExpiryDisplay(
                              anchorIso,
                            )}. Shown expiry is last day included before lockout.`
                          : undefined
                      }
                    >
                      {row.portalLaunched ? (
                        isTrial ? (
                          <div className="flex h-9 flex-nowrap items-center gap-1.5">
                            {expiryEditingKey === uidKey ? (
                              <>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <input
                                    type="date"
                                    autoFocus
                                    min={anchorIso ?? undefined}
                                    max={
                                      anchorIso
                                        ? trialInclusiveEndIso(anchorIso, 3650) ?? undefined
                                        : undefined
                                    }
                                    disabled={limitSavingUid === uid}
                                    className="h-8 w-[7.25rem] shrink-0 rounded border border-gray-200 px-2 text-sm text-gray-900 shadow-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 disabled:bg-gray-100"
                                    value={expiryIso ?? ''}
                                    onChange={(e) =>
                                      patchLimitDraft(uidKey, row, { expiryIso: e.target.value })
                                    }
                                    aria-label={`Trial expiry (last inclusive day) for ${row.companyName || 'client'}`}
                                  />
                                </div>
                                <span
                                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                    platformCaps ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  title={
                                    platformCaps
                                      ? 'Platform default caps'
                                      : 'Custom caps for this portal'
                                  }
                                  aria-hidden
                                />
                                {!platformCaps && limitSavingUid !== uid ? (
                                  <button
                                    type="button"
                                    onClick={() => revertClientTrialLimitsToPlatform(row)}
                                    className="inline-flex h-8 shrink-0 items-center justify-center rounded border border-transparent px-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                    title="Use platform defaults (expiry from default duration + MB)"
                                    aria-label="Revert to platform default trial limits"
                                  >
                                    <RotateCcw className="h-4 w-4" aria-hidden strokeWidth={2} />
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={limitSavingUid === uid}
                                  onClick={() => setExpiryEditingKey(uidKey)}
                                  className="relative inline-flex h-8 w-[8.25rem] shrink-0 items-center rounded border border-gray-200 bg-white pl-2 pr-8 text-left text-sm tabular-nums text-gray-900 shadow-sm outline-none hover:bg-gray-50 focus-visible:border-sky-400 focus-visible:ring-1 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Click to change expiry date"
                                >
                                  <span className="truncate">{formatExpiryDisplay(expiryIso)}</span>
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                                    <CalendarDays className="h-4 w-4" aria-hidden />
                                  </span>
                                </button>
                                <span
                                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                    platformCaps ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  title={
                                    platformCaps
                                      ? 'Platform default caps'
                                      : 'Custom caps for this portal'
                                  }
                                  aria-hidden
                                />
                                {!platformCaps && limitSavingUid !== uid ? (
                                  <button
                                    type="button"
                                    onClick={() => revertClientTrialLimitsToPlatform(row)}
                                    className="inline-flex h-8 shrink-0 items-center justify-center rounded border border-transparent px-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                    title="Use platform defaults (expiry from default duration + MB)"
                                    aria-label="Revert to platform default trial limits"
                                  >
                                    <RotateCcw className="h-4 w-4" aria-hidden strokeWidth={2} />
                                  </button>
                                ) : null}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="whitespace-nowrap tabular-nums text-gray-900">
                            {formatExpiryDisplay(expiryIso)}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-4 pr-2 align-middle min-w-0 overflow-hidden border-l border-gray-200">
                      {row.portalLaunched ? (
                        <div className="flex h-9 flex-nowrap items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={1000000}
                            disabled={limitSavingUid === uid}
                            className="h-8 w-[3.75rem] rounded border border-gray-200 px-1.5 text-base tabular-nums text-gray-900 shadow-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 disabled:bg-gray-100"
                            value={mbStr}
                            onChange={(e) => patchLimitDraft(uidKey, row, { mb: e.target.value })}
                            aria-label={`Storage limit MB for ${row.companyName || 'client'}`}
                          />
                          <span className="shrink-0 text-sm tabular-nums text-gray-600">MB</span>
                          {limitsDirty && limitParsesOk ? (
                            <button
                              type="button"
                              disabled={limitSavingUid === uid}
                              onClick={() => saveClientTrialLimits(row)}
                              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-sky-600 bg-sky-600 px-2.5 text-white shadow-sm hover:bg-sky-700 disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-600"
                              title={isTrial ? 'Save expiry and MB limit' : 'Save MB limit'}
                              aria-label={isTrial ? 'Save trial limits' : 'Save storage limit'}
                            >
                              {limitSavingUid === uid ? (
                                <span className="text-[10px]">…</span>
                              ) : (
                                <Check className="h-5 w-5" aria-hidden strokeWidth={2.5} />
                              )}
                            </button>
                          ) : null}
                          {!platformCaps && limitSavingUid !== uid ? (
                            <button
                              type="button"
                              onClick={() => revertClientTrialLimitsToPlatform(row)}
                              className="inline-flex h-8 shrink-0 items-center justify-center rounded border border-transparent px-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              title={
                                isTrial
                                  ? 'Use platform defaults (expiry from default duration + MB)'
                                  : 'Use platform default storage cap'
                              }
                              aria-label={isTrial ? 'Revert to platform default trial limits' : 'Revert storage limit'}
                            >
                              <RotateCcw className="h-4 w-4" aria-hidden strokeWidth={2} />
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-0.5 text-center align-middle">
                      <button
                        type="button"
                        className="text-gray-500 hover:text-sky-600 p-1 inline-flex rounded-md hover:bg-sky-50"
                        onClick={() => setDetailRow(row)}
                        aria-label="View details including email and portal URLs"
                      >
                        <Info className="h-5 w-5" />
                      </button>
                    </td>
                    <td className="py-2.5 pr-12 pl-2 align-middle whitespace-nowrap">
                      {row.portalLaunched ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block whitespace-nowrap rounded-md px-2 py-1 font-normal ${
                              planLabel.endsWith('expired')
                                ? 'bg-gray-100 text-gray-700'
                                : isTrial
                                  ? 'bg-sky-100 text-sky-900'
                                  : 'bg-amber-100 text-amber-900'
                            }`}
                            title={planLabel}
                          >
                            {planLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-12 pr-3 text-center align-middle border-l border-gray-100">
                      {row.portalLaunched ? (
                        <button
                          type="button"
                          onClick={() => {
                            togglePortalLiveStatus(uid, !liveEffective)
                          }}
                          className="inline-flex items-center justify-center p-0.5"
                          title={liveEffective ? 'Live (YES) — click to disable' : 'Not live (NO) — click to enable'}
                          aria-label={liveEffective ? 'Set portal live status to NO' : 'Set portal live status to YES'}
                        >
                          {liveEffective ? (
                            <ToggleLeft className="h-8 w-8 text-green-600 shrink-0" />
                          ) : (
                            <ToggleRight className="h-8 w-8 text-red-600 shrink-0" />
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {!loading && filteredRows.length === 0 && (
          <div className="p-4 text-center text-gray-500">No clients found</div>
        )}

        {!loading && filteredRows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#fafafa] border-t border-gray-200">
            <p className="text-sm text-gray-600 tabular-nums">
              Showing <strong className="text-gray-800">{rangeStart}</strong>–
              <strong className="text-gray-800">{rangeEnd}</strong> of{' '}
              <strong className="text-gray-800">{filteredRows.length}</strong> clients · Page{' '}
              <span className="text-gray-800 font-medium">
                {currentPage} / {totalPages}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-45 disabled:pointer-events-none"
              >
                Previous
              </button>
              <div className="flex flex-wrap items-center gap-1 max-w-[min(100vw-8rem,28rem)] justify-center">
                {visiblePageNumbers.map((page, idx) => {
                  const prev = idx > 0 ? visiblePageNumbers[idx - 1] : null
                  const showGap = prev != null && page - prev > 1
                  return (
                    <span key={page} className="flex items-center gap-1">
                      {showGap ? (
                        <span className="px-1 text-gray-400 select-none" aria-hidden>
                          …
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-label={`Go to page ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`min-w-[2.25rem] px-2 py-2 text-sm rounded-md border font-medium ${
                          currentPage === page
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-45 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {detailRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-detail-title"
          onClick={() => setDetailRow(null)}
        >
          <div
            className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="client-detail-title" className="text-lg font-semibold text-gray-900 mb-4">
              Client details
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500 font-medium">Login email</dt>
                <dd className="mt-0.5 text-gray-900 break-all">{detailRow.email || '—'}</dd>
              </div>
              {detailRow.portalLaunched && detailRow.portalSiteUrl ? (
                <div>
                  <dt className="text-gray-500 font-medium">Portal site URL</dt>
                  <dd className="mt-0.5 break-all">
                    <a
                      href={detailRow.portalSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline"
                    >
                      {detailRow.portalSiteUrl}
                    </a>
                  </dd>
                </div>
              ) : null}
              {detailRow.portalLaunched && detailRow.portalAdminUrl ? (
                <div>
                  <dt className="text-gray-500 font-medium">Portal admin URL</dt>
                  <dd className="mt-0.5 break-all">
                    <a
                      href={detailRow.portalAdminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline"
                    >
                      {detailRow.portalAdminUrl}
                    </a>
                  </dd>
                </div>
              ) : null}
              {detailRow.portalEmail ? (
                <div>
                  <dt className="text-gray-500 font-medium">Portal contact email</dt>
                  <dd className="mt-0.5 text-gray-900 break-all">{detailRow.portalEmail}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-gray-500 font-medium">Phone (profile)</dt>
                <dd className="mt-0.5 text-gray-900">{detailRow.mobileNo || '—'}</dd>
              </div>
              {detailRow.portalPhone ? (
                <div>
                  <dt className="text-gray-500 font-medium">Phone (portal)</dt>
                  <dd className="mt-0.5 text-gray-900">{detailRow.portalPhone}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-gray-500 font-medium">Organization</dt>
                <dd className="mt-0.5 text-gray-900">{detailRow.companyName || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Contact person</dt>
                <dd className="mt-0.5 text-gray-900">{detailRow.contactPersonName || '—'}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                setSelectedUser(detailRow)
                setForm({ newPassword: '', confirmPassword: '' })
                setShowPasswordModal(true)
              }}
              className="mt-6 w-full py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700"
            >
              Change password
            </button>
            <button
              type="button"
              onClick={() => setDetailRow(null)}
              className="mt-3 w-full py-2 rounded-lg bg-gray-100 text-gray-800 font-medium hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPasswordModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setShowPasswordModal(false)
            setSelectedUser(null)
          }}
        >
          <div
            className="bg-white p-6 rounded-2xl w-full max-w-[380px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-5 text-center text-gray-900">Change password</h2>
            <p className="text-xs text-gray-500 mb-3 text-center truncate">{selectedUser.email}</p>

            <div className="relative mb-4">
              <input
                type={showPw.new ? 'text' : 'password'}
                placeholder="New password"
                className="w-full p-2 border border-gray-300 rounded pr-10"
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                onClick={() => setShowPw((s) => ({ ...s, new: !s.new }))}
              >
                {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative mb-5">
              <input
                type={showPw.confirm ? 'text' : 'password'}
                placeholder="Confirm password"
                className="w-full p-2 border border-gray-300 rounded pr-10"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
              >
                {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
