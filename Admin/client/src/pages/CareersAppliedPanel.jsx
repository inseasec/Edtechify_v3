import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ApplicantFilters from '@/Components/ApplicantFilters'
import ApplicantTableNameCell from '@/Components/ApplicantTableNameCell'
import { INITIAL_APPLICANT_FILTERS } from '@/hooks/useApplicantFilters'
import useApplyForJobsCatalog from '@/hooks/useApplyForJobsCatalog'
import {
  applicantAgeInYearsFromDob,
  applyApplicantFilters,
  formatAppliedRole,
  formatSalaryForDisplay,
  mergedRoleTitlesForDropdown,
  mergeMaritalFilterOptions,
  uniqueFieldValues,
} from '@/lib/careersApplicantFilters'
import { PIPELINE_STAGE } from '@/lib/careersApi'
import {
  clearApplicantsError,
  fetchAllApplicants,
  toggleHrApplicant,
} from '@/store/applicantsSlice'
import { getAdminUserId, getUserRole } from '@/utils/auth'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'
import { CAREER_SECTIONS } from './careersSections'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { LayoutGrid } from 'lucide-react'

const INITIAL_FILTERS = INITIAL_APPLICANT_FILTERS

function currentCalendarYearString() {
  return String(new Date().getFullYear())
}

function yearOrDefaultForMonthPicker(yearStr) {
  const y = String(yearStr ?? '').trim()
  if (y !== '') return y
  return currentCalendarYearString()
}

function calendarMonthYearDefaults() {
  const now = new Date()
  return { y: String(now.getFullYear()), m: String(now.getMonth() + 1) }
}

const FALLBACK_CITIES = ['Gurgaon', 'Mohali', 'Bangalore', 'Hyderabad', 'Pune']
const FALLBACK_STATES = ['Haryana', 'Punjab', 'Karnataka', 'Telangana', 'Maharashtra']
const FALLBACK_TEACHING = ['Mathematics', 'Physics', 'English', 'Computer Science']
const FALLBACK_NON_TEACHING = ['Admin', 'HR', 'Operations', 'Counsellor']

function sameId(a, b) {
  if (a == null || b == null) return false
  return Number(a) === Number(b)
}

export default function CareersAppliedPanel() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const base = useAdminBasePath()
  const { title, description } = CAREER_SECTIONS.applied
  const role = getUserRole()
  const isHR = role === 'HR'
  const myHrId = getAdminUserId()

  const allApplicants = useSelector((s) => s.applicants.list)
  const listLoading = useSelector((s) => s.applicants.loading)
  const applicantsError = useSelector((s) => s.applicants.error)

  const [filters, setFilters] = useState(() => ({ ...INITIAL_FILTERS }))
  const [nameSortOrder, setNameSortOrder] = useState('')
  const [taggingId, setTaggingId] = useState(null)

  const jobRoles = useApplyForJobsCatalog()

  const setters = useMemo(
    () => ({
      setCurrentSalaryOp: (v) =>
        setFilters((f) => ({ ...f, currentSalaryOp: v, ...(v !== 'between' ? { currentSalaryNumEnd: '' } : {}) })),
      setCurrentSalaryNum: (v) => setFilters((f) => ({ ...f, currentSalaryNum: v })),
      setCurrentSalaryNumEnd: (v) => setFilters((f) => ({ ...f, currentSalaryNumEnd: v })),
      setExpectedSalaryOp: (v) =>
        setFilters((f) => ({ ...f, expectedSalaryOp: v, ...(v !== 'between' ? { expectedSalaryNumEnd: '' } : {}) })),
      setExpectedSalaryNum: (v) => setFilters((f) => ({ ...f, expectedSalaryNum: v })),
      setExpectedSalaryNumEnd: (v) => setFilters((f) => ({ ...f, expectedSalaryNumEnd: v })),
      setCityFilter: (v) => setFilters((f) => ({ ...f, cityFilter: v })),
      setStateFilter: (v) => setFilters((f) => ({ ...f, stateFilter: v })),
      setMaritalFilter: (v) => setFilters((f) => ({ ...f, maritalFilter: v })),
      setAgeOp: (v) =>
        setFilters((f) => ({ ...f, ageOp: v, ...(v !== 'between' ? { ageNumEnd: '' } : {}) })),
      setAgeNum: (v) => setFilters((f) => ({ ...f, ageNum: v })),
      setAgeNumEnd: (v) => setFilters((f) => ({ ...f, ageNumEnd: v })),
      setRoleTypeFilter: (v) => setFilters((f) => ({ ...f, roleTypeFilter: v })),
      setRoleFilter: (v) => setFilters((f) => ({ ...f, roleFilter: v })),
      setGenderFilter: (v) => setFilters((f) => ({ ...f, genderFilter: v })),
      setExperienceFilter: (v) => setFilters((f) => ({ ...f, experienceFilter: v })),
      setDateFilterType: (v) =>
        setFilters((f) => {
          const next = { ...f, dateFilterType: v }
          if (v === 'monthYear' && f.dateFilterType !== 'monthYear') {
            const d = calendarMonthYearDefaults()
            next.dateFilterYear = d.y
            next.dateFilterMonth = d.m
          }
          return next
        }),
      setDateFilterYear: (v) => setFilters((f) => ({ ...f, dateFilterYear: v })),
      setDateFilterMonth: (v) =>
        setFilters((f) => {
          if (f.dateFilterType !== 'monthYear') return { ...f, dateFilterMonth: v }
          const year = yearOrDefaultForMonthPicker(f.dateFilterYear)
          return { ...f, dateFilterMonth: v, dateFilterYear: year }
        }),
      setCustomFromDate: (v) => setFilters((f) => ({ ...f, customFromDate: v })),
      setCustomToDate: (v) => setFilters((f) => ({ ...f, customToDate: v })),
      setSearch: (v) => setFilters((f) => ({ ...f, search: v })),
    }),
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS })
    setNameSortOrder('')
  }, [])

  useEffect(() => {
    dispatch(fetchAllApplicants())
  }, [dispatch])

  useEffect(() => {
    if (!applicantsError) return
    showErrorToast(applicantsError)
    dispatch(clearApplicantsError())
  }, [applicantsError, dispatch])

  const cities = useMemo(() => {
    const u = uniqueFieldValues(allApplicants, 'city')
    return u.length ? u : FALLBACK_CITIES
  }, [allApplicants])

  const states = useMemo(() => {
    const u = uniqueFieldValues(allApplicants, 'state')
    return u.length ? u : FALLBACK_STATES
  }, [allApplicants])

  const teachingRoles = useMemo(
    () => mergedRoleTitlesForDropdown(allApplicants, jobRoles.teachingRoles, FALLBACK_TEACHING, 'TECH'),
    [allApplicants, jobRoles.teachingRoles],
  )

  const nonTeachingRoles = useMemo(
    () => mergedRoleTitlesForDropdown(allApplicants, jobRoles.nonTeachingRoles, FALLBACK_NON_TEACHING, 'NON_TECH'),
    [allApplicants, jobRoles.nonTeachingRoles],
  )

  const maritalOptions = useMemo(() => mergeMaritalFilterOptions(allApplicants), [allApplicants])

  const filteredApplicants = useMemo(
    () => {
      const rows = applyApplicantFilters(allApplicants, filters, nameSortOrder, PIPELINE_STAGE.applied)
      if (nameSortOrder) return rows
      return [...rows].sort((a, b) => {
        const dateA = new Date(a?.applicationDate || a?.createdAt || 0).getTime()
        const dateB = new Date(b?.applicationDate || b?.createdAt || 0).getTime()
        return dateB - dateA
      })
    },
    [allApplicants, filters, nameSortOrder],
  )

  const total = filteredApplicants.length

  const applicantKey = (row, i) => row.id ?? row.email ?? i

  const openApplicant = useCallback(
    (row) => {
      if (!row?.id) return
      navigate(`../careers/applicant/${row.id}`, { state: { applicant: row, from: 'APPLIED' } })
    },
    [navigate],
  )

  const handleTagApplicant = useCallback(
    async (row, e) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      if (!isHR || !row?.id) return
      if (row.hrId != null) {
        showErrorToast(
          sameId(row.hrId, myHrId)
            ? 'This applicant is tagged to you. Tags are frozen until a super admin re-tags.'
            : 'Tagged by another HR. A super admin can re-tag to make them available.',
        )
        return
      }
      if (myHrId == null) {
        showErrorToast('Sign out and sign in again so your account ID is loaded for tagging.')
        return
      }
      try {
        setTaggingId(row.id)
        await dispatch(toggleHrApplicant({ id: row.id, checked: true })).unwrap()
        showSuccessToast('Applicant tagged — find them under My Applicants.')
        await dispatch(fetchAllApplicants()).unwrap()
      } catch (error) {
        showErrorToast(error?.message || error?.response?.data || 'Failed to tag applicant')
      } finally {
        setTaggingId(null)
      }
    },
    [dispatch, isHR, myHrId],
  )

  const tagTitle = (row) => {
    if (row.hrId == null) return 'Tag this applicant to your list'
    if (sameId(row.hrId, myHrId)) return 'Tagged to you — only a super admin can clear (Re-tag)'
    return 'Tagged by another HR — only a super admin can re-tag'
  }

  const colSpan = isHR ? 9 : 10

  const headerTitle = isHR ? 'Applicant' : title

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{headerTitle}</h3>
          {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
          {isHR && myHrId == null ? (
            <p className="mt-2 text-sm text-amber-800">
              Sign in again to enable tagging — your token needs your admin profile id.
            </p>
          ) : null}
        </div>
        {!isHR && (
          <button
            type="button"
            onClick={() =>
              navigate(`${base}/careers/videos`, { state: { status: PIPELINE_STAGE.applied } })
            }
            title="Video & quick actions"
            className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LayoutGrid className="h-8 w-8" aria-hidden />
          </button>
        )}
      </div>
      <ApplicantFilters
        total={total}
        cities={cities}
        states={states}
        teachingRoles={teachingRoles}
        nonTeachingRoles={nonTeachingRoles}
        maritalOptions={maritalOptions}
        filters={filters}
        setters={setters}
        resetFilters={resetFilters}
        isHR={isHR}
        nameSortOrder={nameSortOrder}
        setNameSortOrder={setNameSortOrder}
      />
      <div className="max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span className="text-sm font-medium text-slate-700">{isHR ? 'Applicants' : 'Applicants'}</span>
          {listLoading && <span className="text-xs text-slate-500">Loading…</span>}
        </div>
        <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable] touch-pan-x">
          <table className={`w-full text-left text-sm ${isHR ? 'min-w-[800px]' : 'min-w-[1040px]'}`}>
            <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-600">
              <tr>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Mobile number</th>
                <th className="px-2 py-2 font-medium">Role</th>
                {!isHR && <th className="px-2 py-2 font-medium">Marital</th>}
                <th className="px-2 py-2 font-medium">City</th>
                {!isHR && <th className="px-2 py-2 font-medium">Age</th>}
                <th className="px-2 py-2 font-medium">Gender</th>
                <th className="px-2 py-2 font-medium">Experience</th>
                <th className="px-2 py-2 font-medium">Current Salary</th>
                {isHR ? (
                  <>
                    <th className="px-2 py-2 font-medium">Expected</th>
                    <th
                      title="Tag applicant"
                      className="sticky right-0 z-[3] w-[4.75rem] border-l border-slate-200 bg-slate-50/95 px-1.5 py-2 text-center text-xs font-medium leading-snug shadow-[-12px_0_16px_-8px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:w-auto sm:px-2 sm:text-sm"
                    >
                      Tag
                    </th>
                  </>
                ) : (
                  <th
                    title="Expected salary"
                    className="sticky right-0 z-[3] whitespace-nowrap border-l border-slate-200 bg-slate-50/95 px-2 py-2 pl-3 font-medium shadow-[-12px_0_16px_-8px_rgba(15,23,42,0.12)] backdrop-blur-sm"
                  >
                    Expected
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {!listLoading && filteredApplicants.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                    No applicants match these filters, or the list is empty.
                  </td>
                </tr>
              )}
              {filteredApplicants.map((row, i) => (
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
                  {!isHR && <td className="px-2 py-2 text-slate-600">{row.maritalStatus ?? '—'}</td>}
                  <td className="px-2 py-2 text-slate-600">{row.city ?? '—'}</td>
                  {!isHR && (
                    <td className="px-2 py-2 text-slate-600">{applicantAgeInYearsFromDob(row.dob) ?? '—'}</td>
                  )}
                  <td className="px-2 py-2 text-slate-600">{row.gender ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{row.experienceLevel ?? '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{formatSalaryForDisplay(row.currentSalary)}</td>
                  {!isHR ? (
                    <td className="sticky right-0 z-[2] whitespace-nowrap border-l border-slate-100 bg-white px-2 py-2 pr-3 text-slate-600 shadow-[-10px_0_14px_-6px_rgba(15,23,42,0.1)] group-hover:bg-slate-50/95">
                      {formatSalaryForDisplay(row.expectedSalary)}
                    </td>
                  ) : (
                    <>
                      <td className="px-2 py-2 text-slate-600">{formatSalaryForDisplay(row.expectedSalary)}</td>
                      <td
                        className="sticky right-0 z-[2] border-l border-slate-100 bg-white px-2 py-2 text-center shadow-[-10px_0_14px_-6px_rgba(15,23,42,0.1)] group-hover:bg-slate-50/95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 accent-slate-900 disabled:opacity-70"
                          checked={Boolean(row.hrId)}
                          disabled={row.hrId != null || taggingId === row.id}
                          title={tagTitle(row)}
                          onChange={(e) => {
                            e.stopPropagation()
                            if (e.target.checked) handleTagApplicant(row, e)
                          }}
                        />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
