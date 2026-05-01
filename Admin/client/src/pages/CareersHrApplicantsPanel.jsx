import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicantDateAppliedControls from '@/Components/ApplicantDateAppliedControls'
import ApplicantTableNameCell from '@/Components/ApplicantTableNameCell'
import ApplicantFilters from '@/Components/ApplicantFilters'
import useApplyForJobsCatalog from '@/hooks/useApplyForJobsCatalog'
import { useApplicantFilters } from '@/hooks/useApplicantFilters'
import {
  applicantAgeInYearsFromDob,
  formatAppliedRole,
  formatSalaryForDisplay,
  mergedRoleTitlesForDropdown,
  mergeMaritalFilterOptions,
  uniqueFieldValues,
} from '@/lib/careersApplicantFilters'
import api from '@/lib/api'
import { CAREERS_PATHS, normalizeCareersListPayload } from '@/lib/careersApi'
import { getUserRole } from '@/utils/auth'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'
import { CAREER_SECTIONS } from './careersSections'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'

const ITEMS_PER_PAGE = 20

const FALLBACK_CITIES = ['Gurgaon', 'Mohali', 'Bangalore', 'Hyderabad', 'Pune']
const FALLBACK_STATES = ['Haryana', 'Punjab', 'Karnataka', 'Telangana', 'Maharashtra']
const FALLBACK_TEACHING = ['Mathematics', 'Physics', 'English', 'Computer Science']
const FALLBACK_NON_TEACHING = ['Admin', 'HR', 'Operations', 'Counsellor']

function normalizeAdminRole(admin) {
  const r = admin?.role
  if (typeof r === 'string') return r.replace(/-/g, '_').toUpperCase()
  return r != null ? String(r).toUpperCase() : ''
}

export default function CareersHrApplicantsPanel() {
  const navigate = useNavigate()
  const base = useAdminBasePath()
  const role = getUserRole()
  const canRetag = role === 'SUPER_ADMIN' || role === 'TEAM_ADMIN' || role === 'SUB_ADMIN'

  const { title, description } = CAREER_SECTIONS['hr-applicants']
  const jobRoles = useApplyForJobsCatalog()

  const [assignedRows, setAssignedRows] = useState([])
  const [hrAdmins, setHrAdmins] = useState([])
  const [hrFilterId, setHrFilterId] = useState('')
  const [loading, setLoading] = useState(true)
  const [retaggingId, setRetaggingId] = useState(null)

  const loadAssigned = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get(CAREERS_PATHS.getAllOfHr)
      setAssignedRows(normalizeCareersListPayload(data))
    } catch (err) {
      console.error(err)
      showErrorToast(err?.response?.data?.message || 'Failed to load HR candidates')
      setAssignedRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHrAdmins = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/getAllAdmins')
      const list = Array.isArray(data) ? data : []
      setHrAdmins(list.filter((a) => normalizeAdminRole(a) === 'HR'))
    } catch {
      setHrAdmins([])
    }
  }, [])

  useEffect(() => {
    loadAssigned()
    loadHrAdmins()
  }, [loadAssigned, loadHrAdmins])

  const hrFiltered = useMemo(() => {
    if (!hrFilterId) return assignedRows
    const want = Number(hrFilterId)
    if (!Number.isFinite(want)) return assignedRows
    return assignedRows.filter((r) => Number(r?.hrId) === want)
  }, [assignedRows, hrFilterId])

  const sortedApplicants = useMemo(() => {
    return [...hrFiltered].sort((a, b) => {
      const ad = a.applicationDate ?? a.createdAt
      const bd = b.applicationDate ?? b.createdAt
      if (ad && bd) return new Date(bd) - new Date(ad)
      return (b.id ?? 0) - (a.id ?? 0)
    })
  }, [hrFiltered])

  const {
    paginatedApplicants,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredApplicants,
    filters,
    setters,
    resetFilters,
    nameSortOrder,
    setNameSortOrder,
  } = useApplicantFilters(sortedApplicants, ITEMS_PER_PAGE, null)

  const cities = useMemo(() => {
    const u = uniqueFieldValues(sortedApplicants, 'city')
    return u.length ? u : FALLBACK_CITIES
  }, [sortedApplicants])

  const states = useMemo(() => {
    const u = uniqueFieldValues(sortedApplicants, 'state')
    return u.length ? u : FALLBACK_STATES
  }, [sortedApplicants])

  const teachingRoles = useMemo(
    () => mergedRoleTitlesForDropdown(sortedApplicants, jobRoles.teachingRoles, FALLBACK_TEACHING, 'TECH'),
    [sortedApplicants, jobRoles.teachingRoles],
  )

  const nonTeachingRoles = useMemo(
    () =>
      mergedRoleTitlesForDropdown(sortedApplicants, jobRoles.nonTeachingRoles, FALLBACK_NON_TEACHING, 'NON_TECH'),
    [sortedApplicants, jobRoles.nonTeachingRoles],
  )

  const maritalOptions = useMemo(() => mergeMaritalFilterOptions(sortedApplicants), [sortedApplicants])

  const hrNameById = useMemo(() => {
    const m = new Map()
    for (const a of hrAdmins) {
      if (a?.id != null) m.set(Number(a.id), a.name ?? a.email ?? `#${a.id}`)
    }
    return m
  }, [hrAdmins])

  const applicantKey = (row, i) => row.id ?? row.email ?? i

  const openApplicant = (row) => {
    navigate(`${base}/careers/applicant/${row.id}`, { state: { applicant: row, from: 'HR' } })
  }

  const handleRetag = async (row, e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!canRetag || !row?.hrId || !row?.id) return
    if (
      !window.confirm(
        `Remove HR tag for ${row.fullName ?? 'this applicant'}? They will appear as available to tag again for all HRs.`,
      )
    ) {
      return
    }
    try {
      setRetaggingId(row.id)
      await api.put(CAREERS_PATHS.updateHr(row.id, false))
      showSuccessToast('Re-tag complete — assignment removed.')
      await loadAssigned()
    } catch (err) {
      const msg =
        typeof err?.response?.data === 'string'
          ? err.response.data
          : err?.response?.data?.message || err?.message || 'Failed to re-tag'
      showErrorToast(msg)
    } finally {
      setRetaggingId(null)
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 text-left">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
        {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
      </div>

      {!loading && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {hrAdmins.length > 0 ? (
            <>
              <label htmlFor="hr-filter" className="shrink-0 text-sm font-medium text-slate-700">
                Select HR:
              </label>
              <select
                id="hr-filter"
                value={hrFilterId}
                onChange={(e) => setHrFilterId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">All HRs</option>
                {hrAdmins.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.name ?? a.email}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <ApplicantDateAppliedControls filters={filters} setters={setters} />
        </div>
      )}

      {!loading && (
        <ApplicantFilters
          total={filteredApplicants.length}
          cities={cities}
          states={states}
          teachingRoles={teachingRoles}
          nonTeachingRoles={nonTeachingRoles}
          maritalOptions={maritalOptions}
          filters={filters}
          setters={setters}
          resetFilters={resetFilters}
          isHR={false}
          nameSortOrder={nameSortOrder}
          setNameSortOrder={setNameSortOrder}
          hideDateAppliedFilter
        />
      )}

      <div className="max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-medium text-slate-700">HR candidates</span>
            {!loading ? (
              <span className="text-xs text-slate-500 sm:hidden">
                Swipe sideways on the table to see ReTag
              </span>
            ) : null}
          </div>
          {loading && <span className="text-xs text-slate-500">Loading…</span>}
        </div>
        <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable] touch-pan-x">
          <table className="min-w-[1180px] w-max text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/95 text-slate-600 backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2 font-medium">Tagged HR</th>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Mobile number</th>
                <th className="px-2 py-2 font-medium">Role</th>
                <th className="px-2 py-2 font-medium">Marital</th>
                <th className="px-2 py-2 font-medium">City</th>
                <th className="px-2 py-2 font-medium">Age</th>
                <th className="px-2 py-2 font-medium">Gender</th>
                <th className="px-2 py-2 font-medium">Experience</th>
                <th className="px-2 py-2 font-medium">Current Salary</th>
                <th className="px-2 py-2 font-medium">Expected Salary</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th
                  className="sticky right-0 z-[3] border-l border-slate-200 bg-slate-50/95 px-3 py-2 text-center font-medium shadow-[-12px_0_16px_-8px_rgba(15,23,42,0.12)] backdrop-blur-sm"
                  title="Sticky column — table scrolls underneath"
                >
                  ReTag
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && paginatedApplicants.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-500">
                    No tagged applicants for this filter.
                  </td>
                </tr>
              )}
              {paginatedApplicants.map((row, i) => (
                <tr
                  key={applicantKey(row, i)}
                  className="group cursor-pointer border-b border-slate-50 hover:bg-slate-50/50"
                  onClick={() => openApplicant(row)}
                >
                  <td className="px-2 py-2 text-slate-700">
                    {row.hrId != null ? hrNameById.get(Number(row.hrId)) ?? `ID ${row.hrId}` : '—'}
                  </td>
                  <td className="px-2 py-2">
                    <ApplicantTableNameCell row={row} />
                  </td>
                  <td className="px-2 py-2 text-slate-600">{row.phone ?? '—'}</td>
                  <td className="max-w-[14rem] truncate px-2 py-2 text-slate-600" title={formatAppliedRole(row)}>
                    {formatAppliedRole(row)}
                  </td>
                  <td className="px-2 py-2 text-slate-600">{row.maritalStatus ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{row.city ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{applicantAgeInYearsFromDob(row.dob) ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{row.gender ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{row.experienceLevel ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{formatSalaryForDisplay(row.currentSalary)}</td>
                  <td className="px-2 py-2 text-slate-600">{formatSalaryForDisplay(row.expectedSalary)}</td>
                  <td className="px-2 py-2 font-medium text-blue-600">{row.status ?? '—'}</td>
                  <td
                    className="sticky right-0 z-[2] border-l border-slate-100 bg-white px-3 py-2 text-center align-middle shadow-[-12px_0_16px_-8px_rgba(15,23,42,0.1)] group-hover:bg-slate-50/95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {row.hrId != null ? (
                      <input
                        type="checkbox"
                        aria-label={`ReTag ${row.fullName ?? row.id ?? 'applicant'}`}
                        title={
                          canRetag
                            ? 'Uncheck to remove HR tag so another HR can claim this applicant'
                            : 'Only an administrator can re-tag'
                        }
                        className={`h-[18px] w-[18px] rounded accent-green-600 focus:ring-2 focus:ring-green-500/30 ${
                          canRetag && retaggingId !== row.id ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                        }`}
                        checked={Boolean(row.hrId)}
                        disabled={!canRetag || retaggingId === row.id}
                        onChange={(e) => {
                          e.stopPropagation()
                          if (!canRetag || !row.hrId) return
                          if (!e.target.checked) {
                            handleRetag(row, e)
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPage(idx + 1)}
              className={`rounded border px-3 py-1 text-sm ${
                currentPage === idx + 1 ? 'border-slate-400 bg-slate-100' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
