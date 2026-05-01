import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicantFilters from '@/Components/ApplicantFilters'
import ApplicantTableNameCell from '@/Components/ApplicantTableNameCell'
import useApplyForJobsCatalog from '@/hooks/useApplyForJobsCatalog'
import { useApplicantFilters } from '@/hooks/useApplicantFilters'
import {
  formatAppliedRole,
  formatCareerPipelineStatusForHr,
  mergedRoleTitlesForDropdown,
  mergeMaritalFilterOptions,
  uniqueFieldValues,
} from '@/lib/careersApplicantFilters'
import api from '@/lib/api'
import { CAREERS_PATHS, normalizeCareersListPayload, PIPELINE_STAGE } from '@/lib/careersApi'
import { getUserRole } from '@/utils/auth'
import { showErrorToast } from '@/utils/toastUtils'
import { CAREER_SECTIONS } from './careersSections'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'

const ITEMS_PER_PAGE = 20

const FALLBACK_CITIES = ['Gurgaon', 'Mohali', 'Bangalore', 'Hyderabad', 'Pune']
const FALLBACK_TEACHING = ['Mathematics', 'Physics', 'English', 'Computer Science']
const FALLBACK_NON_TEACHING = ['Admin', 'HR', 'Operations', 'Counsellor']

function applicantIsArchived(row) {
  return String(row?.status ?? '').toUpperCase() === PIPELINE_STAGE.archived
}

export default function CareersMyApplicantsPanel() {
  const navigate = useNavigate()
  const base = useAdminBasePath()
  const isHR = getUserRole() === 'HR'
  const jobRoles = useApplyForJobsCatalog()

  const { title, description } = CAREER_SECTIONS['my-applicants']

  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)
  /** When true (default): hide ARCHIVED rows; toggle green. When false: grey, show everyone. */
  const [excludeArchived, setExcludeArchived] = useState(true)

  const loadMine = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get(CAREERS_PATHS.getAllOfHr)
      setMine(normalizeCareersListPayload(data))
    } catch (err) {
      console.error(err)
      showErrorToast(err?.response?.data?.message || 'Failed to load your applicants')
      setMine([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMine()
  }, [loadMine])

  const sortedApplicants = useMemo(() => {
    return [...mine].sort((a, b) => {
      const ad = a.applicationDate ?? a.createdAt
      const bd = b.applicationDate ?? b.createdAt
      if (ad && bd) return new Date(bd) - new Date(ad)
      return (b.id ?? 0) - (a.id ?? 0)
    })
  }, [mine])

  const applicantsForFilters = useMemo(() => {
    if (!excludeArchived) return sortedApplicants
    return sortedApplicants.filter((a) => !applicantIsArchived(a))
  }, [sortedApplicants, excludeArchived])

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
  } = useApplicantFilters(applicantsForFilters, ITEMS_PER_PAGE, null)

  const cities = useMemo(() => {
    const u = uniqueFieldValues(applicantsForFilters, 'city')
    return u.length ? u : FALLBACK_CITIES
  }, [applicantsForFilters])

  const teachingRoles = useMemo(
    () =>
      mergedRoleTitlesForDropdown(applicantsForFilters, jobRoles.teachingRoles, FALLBACK_TEACHING, 'TECH'),
    [applicantsForFilters, jobRoles.teachingRoles],
  )

  const nonTeachingRoles = useMemo(
    () =>
      mergedRoleTitlesForDropdown(applicantsForFilters, jobRoles.nonTeachingRoles, FALLBACK_NON_TEACHING, 'NON_TECH'),
    [applicantsForFilters, jobRoles.nonTeachingRoles],
  )

  const maritalOptions = useMemo(() => mergeMaritalFilterOptions(applicantsForFilters), [applicantsForFilters])

  const applicantKey = (row, i) => row.id ?? row.email ?? i

  const openApplicant = (row) => {
    navigate(`${base}/careers/applicant/${row.id}`, { state: { applicant: row, from: 'MY_APPLICANTS' } })
  }

  const toggleExcludeArchived = () => {
    setExcludeArchived((v) => !v)
    setCurrentPage(1)
  }

  const emptyHintArchivedOnly =
    !loading &&
    excludeArchived &&
    sortedApplicants.length > 0 &&
    applicantsForFilters.length === 0

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 text-left">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
        {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
      </div>

      {!loading && (
        <ApplicantFilters
          total={filteredApplicants.length}
          cities={cities}
          states={[]}
          teachingRoles={teachingRoles}
          nonTeachingRoles={nonTeachingRoles}
          maritalOptions={maritalOptions}
          filters={filters}
          setters={setters}
          resetFilters={resetFilters}
          isHR={isHR}
          showSalaryFilters={false}
          nameSortOrder={nameSortOrder}
          setNameSortOrder={setNameSortOrder}
        />
      )}

      <div className="max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
          <span className="text-sm font-medium text-slate-700">My applicants</span>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {!loading && (
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <span className="text-xs text-slate-600">Exclude archived</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={excludeArchived}
                  aria-label={
                    excludeArchived
                      ? 'Exclude archived is on — archived applicants are hidden. Click to show them.'
                      : 'Exclude archived is off — archived applicants are shown. Click to hide them.'
                  }
                  onClick={toggleExcludeArchived}
                  className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 ${
                    excludeArchived ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                >
                  <span
                    className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ${
                      excludeArchived ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
            )}
            {loading && <span className="text-xs text-slate-500">Loading…</span>}
          </div>
        </div>
        <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable] touch-pan-x">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-600">
              <tr>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Mobile number</th>
                <th className="px-2 py-2 font-medium">Role</th>
                <th className="px-2 py-2 font-medium">City</th>
                <th className="px-2 py-2 font-medium">Gender</th>
                <th className="px-2 py-2 font-medium">Experience</th>
                <th className="sticky right-0 z-[3] whitespace-nowrap border-l border-slate-200 bg-slate-50/95 px-2 py-2 pl-3 font-medium shadow-[-12px_0_16px_-8px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && paginatedApplicants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {emptyHintArchivedOnly ? (
                      <>
                        Only archived applicants match your HR tag.{' '}
                        <button
                          type="button"
                          className="font-medium text-orange-600 underline decoration-orange-600/40 hover:text-orange-700"
                          onClick={() => {
                            setExcludeArchived(false)
                            setCurrentPage(1)
                          }}
                        >
                          Show archived
                        </button>{' '}
                        or turn off Exclude archived next to My applicants.
                      </>
                    ) : (
                      <>You have no tagged applicants yet. Use Applied → Tag applicant.</>
                    )}
                  </td>
                </tr>
              )}
              {paginatedApplicants.map((row, i) => (
                <tr
                  key={applicantKey(row, i)}
                  className="group cursor-pointer border-b border-slate-50 hover:bg-slate-50/50"
                  onClick={() => openApplicant(row)}
                >
                  <td className="px-2 py-2">
                    <ApplicantTableNameCell row={row} />
                  </td>
                  <td className="px-2 py-2 text-slate-600">{row.phone ?? '—'}</td>
                  <td className="max-w-[14rem] truncate px-2 py-2 text-slate-600" title={formatAppliedRole(row)}>
                    {formatAppliedRole(row)}
                  </td>
                  <td className="px-2 py-2 text-slate-600">{row.city ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{row.gender ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{row.experienceLevel ?? '—'}</td>
                  <td
                    className="sticky right-0 z-[2] min-w-[11rem] whitespace-normal border-l border-slate-100 bg-white px-2 py-2 pr-3 font-medium text-blue-600 shadow-[-10px_0_14px_-6px_rgba(15,23,42,0.1)] group-hover:bg-slate-50/95"
                    title={formatCareerPipelineStatusForHr(row.status)}
                  >
                    {formatCareerPipelineStatusForHr(row.status)}
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
