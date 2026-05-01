import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import ApplicantFilters from '@/Components/ApplicantFilters'
import ApplicantTableNameCell from '@/Components/ApplicantTableNameCell'
import useApplyForJobsCatalog from '@/hooks/useApplyForJobsCatalog'
import { useApplicantFilters } from '@/hooks/useApplicantFilters'
import { PIPELINE_STAGE } from '@/lib/careersApi'
import {
  formatAppliedRole,
  mergedRoleTitlesForDropdown,
  mergeMaritalFilterOptions,
  uniqueFieldValues,
} from '@/lib/careersApplicantFilters'
import {
  clearApplicantsError,
  fetchApplicantsByStatus,
} from '@/store/applicantsSlice'
import { getUserRole } from '@/utils/auth'
import { showErrorToast } from '@/utils/toastUtils'
import { CAREER_SECTIONS } from './careersSections'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { LayoutGrid } from 'lucide-react'

const ITEMS_PER_PAGE = 20

const FALLBACK_CITIES = ['Gurgaon', 'Mohali', 'Bangalore', 'Hyderabad', 'Pune']
const FALLBACK_STATES = ['Haryana', 'Punjab', 'Karnataka', 'Telangana', 'Maharashtra']
const FALLBACK_TEACHING = ['Mathematics', 'Physics', 'English', 'Computer Science']
const FALLBACK_NON_TEACHING = ['Admin', 'HR', 'Operations', 'Counsellor']

export default function CareersReviewPanel() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const base = useAdminBasePath()
  const { title, description } = CAREER_SECTIONS['under-review']
  const isHR = getUserRole() === 'HR'
  const jobRoles = useApplyForJobsCatalog()

  const initialPage = Math.max(1, Number(location.state?.page) || 1)

  const { list: allApplicants, loading, error } = useSelector((s) => s.applicants)

  const sortedApplicants = useMemo(() => {
    return [...allApplicants].sort((a, b) => {
      const ad = a.createdAt ?? a.applicationDate
      const bd = b.createdAt ?? b.applicationDate
      if (ad && bd) return new Date(bd) - new Date(ad)
      return (b.id ?? 0) - (a.id ?? 0)
    })
  }, [allApplicants])

  const {
    paginatedApplicants,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredApplicants,
    filters,
    setters,
    resetFilters,
    helpers,
    nameSortOrder,
    setNameSortOrder,
  } = useApplicantFilters(sortedApplicants, ITEMS_PER_PAGE, PIPELINE_STAGE.underReview, {
    initialPage,
  })

  const { calculateAge, formatSalary } = helpers

  useEffect(() => {
    dispatch(fetchApplicantsByStatus(PIPELINE_STAGE.underReview))
  }, [dispatch])

  useEffect(() => {
    if (!error) return
    showErrorToast(error)
    dispatch(clearApplicantsError())
  }, [error, dispatch])

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

  const openApplicant = (row) => {
    navigate(`${base}/careers/applicant/${row.id}`, {
      state: { applicant: row, from: 'REVIEW', page: currentPage },
    })
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
          <p className="mt-2 text-slate-600">{description}</p>
        </div>
        {!isHR && (
          <button
            type="button"
            onClick={() =>
              navigate(`${base}/careers/videos`, { state: { status: PIPELINE_STAGE.underReview } })
            }
            title="Video view"
            className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LayoutGrid className="h-8 w-8" aria-hidden />
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading applicants…</p>}

      {!loading && (
        <>
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
            isHR={isHR}
            showSalaryFilters={!isHR}
            nameSortOrder={nameSortOrder}
            setNameSortOrder={setNameSortOrder}
          />

          {totalPages > 1 && (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`rounded border px-3 py-1 text-sm ${
                    currentPage === i + 1 ? 'border-slate-400 bg-slate-100' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
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

          <div className="max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-3 py-2">
              <span className="text-sm font-medium text-slate-700">Under review</span>
            </div>
            <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable] touch-pan-x">
              <table
                className={`w-full text-left text-sm ${isHR ? 'min-w-[640px]' : 'min-w-[1040px]'}`}
              >
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
                    {!isHR && (
                      <>
                        <th className="px-2 py-2 font-medium">Current salary</th>
                        <th className="sticky right-0 z-[3] whitespace-nowrap border-l border-slate-200 bg-slate-50/95 px-2 py-2 pl-3 font-medium shadow-[-12px_0_16px_-8px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                          Expected salary
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedApplicants.length === 0 && (
                    <tr>
                      <td colSpan={isHR ? 6 : 10} className="px-4 py-8 text-center text-slate-500">
                        No applicants match these filters, or the list is empty.
                      </td>
                    </tr>
                  )}
                  {paginatedApplicants.map((a) => (
                    <tr
                      key={a.id}
                      className="group cursor-pointer border-b border-slate-50 hover:bg-slate-50/50"
                      onClick={() => openApplicant(a)}
                    >
                      <td className="px-2 py-2">
                        <ApplicantTableNameCell row={a} />
                      </td>
                      <td className="px-2 py-2 text-slate-600">{a.phone ?? '—'}</td>
                      <td className="max-w-[14rem] truncate px-2 py-2 text-slate-600" title={formatAppliedRole(a)}>
                        {formatAppliedRole(a)}
                      </td>
                      {!isHR && <td className="px-2 py-2 text-slate-600">{a.maritalStatus ?? '—'}</td>}
                      <td className="px-2 py-2 text-slate-600">{a.city ?? '—'}</td>
                      {!isHR && <td className="px-2 py-2 text-slate-600">{calculateAge(a.dob) ?? '—'}</td>}
                      <td className="px-2 py-2 text-slate-600">{a.gender ?? '—'}</td>
                      <td className="px-2 py-2 text-slate-600">{a.experienceLevel ?? '—'}</td>
                      {!isHR && (
                        <>
                          <td className="px-2 py-2 text-slate-600">
                            {formatSalary(a.currentSalary)}
                          </td>
                          <td className="sticky right-0 z-[2] whitespace-nowrap border-l border-slate-100 bg-white px-2 py-2 pr-3 text-slate-600 shadow-[-10px_0_14px_-6px_rgba(15,23,42,0.1)] group-hover:bg-slate-50/95">
                            {formatSalary(a.expectedSalary)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
