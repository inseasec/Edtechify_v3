import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { X } from 'lucide-react'
import ApplicantFilters from '@/Components/ApplicantFilters'
import useApplyForJobsCatalog from '@/hooks/useApplyForJobsCatalog'
import api from '@/lib/api'
import { PIPELINE_STAGE } from '@/lib/careersApi'
import {
  applicantAgeInYearsFromDob,
  formatSalaryForDisplay,
  mergedRoleTitlesForDropdown,
  mergeMaritalFilterOptions,
  pickApplicantVideoProfileUrl,
  uniqueFieldValues,
} from '@/lib/careersApplicantFilters'
import { useApplicantFilters } from '@/hooks/useApplicantFilters'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import {
  clearApplicantsError,
  fetchApplicantsByStatus,
  updateApplicantStatus,
  toggleHrApplicant,
} from '@/store/applicantsSlice'
import { getUserRole } from '@/utils/auth'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'

const ITEMS_PER_PAGE = 500

const FALLBACK_CITIES = ['Gurgaon', 'Mohali', 'Bangalore', 'Hyderabad', 'Pune']
const FALLBACK_STATES = ['Haryana', 'Punjab', 'Karnataka', 'Telangana', 'Maharashtra']
const FALLBACK_TEACHING = ['Mathematics', 'Physics', 'English', 'Computer Science']
const FALLBACK_NON_TEACHING = ['Admin', 'HR', 'Operations', 'Counsellor']

const STATUS_HEADINGS = {
  [PIPELINE_STAGE.applied]: 'Applied applicants',
  [PIPELINE_STAGE.shortlisted]: 'Shortlisted applicants',
  [PIPELINE_STAGE.underReview]: 'Under review — applicants',
  [PIPELINE_STAGE.selected]: 'Selected applicants',
  [PIPELINE_STAGE.archived]: 'Archived applicants',
  [PIPELINE_STAGE.hrApplicants]: 'HR applicants',
}

function sectionPathFromStatus(pipelineStatus) {
  const m = {
    [PIPELINE_STAGE.applied]: 'applied',
    [PIPELINE_STAGE.shortlisted]: 'shortlisted',
    [PIPELINE_STAGE.underReview]: 'under-review',
    [PIPELINE_STAGE.selected]: 'selected',
    [PIPELINE_STAGE.archived]: 'archived',
    [PIPELINE_STAGE.hrApplicants]: 'hr-applicants',
  }
  return m[pipelineStatus] ?? 'applied'
}

/** Match ApplicantDetails.tsx `location.state.from` for action rules */
function listContextFromPipelineStatus(status) {
  if (status === PIPELINE_STAGE.underReview) return 'REVIEW'
  if (status === PIPELINE_STAGE.applied) return 'APPLIED'
  if (status === PIPELINE_STAGE.shortlisted) return 'SHORTLISTED'
  if (status === PIPELINE_STAGE.selected) return 'SELECTED'
  if (status === PIPELINE_STAGE.archived) return 'ARCHIVED'
  return 'APPLIED'
}

function videoSrcForApplicant(applicant) {
  if (!applicant) return ''
  if (applicant.introVideoUrl) return String(applicant.introVideoUrl)
  if (applicant.video) {
    const p = String(applicant.video).replace(/^\//, '')
    const base = api.defaults.baseURL || ''
    return `${base}/${p}`
  }
  return ''
}

function ActionBtn({ children, color, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: color }}
      className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export default function CareersVideosPage() {
  const dispatch = useDispatch()
  const location = useLocation()
  const base = useAdminBasePath()
  const role = getUserRole()
  const isHR = role === 'HR'
  const jobRoles = useApplyForJobsCatalog()

  const pipelineStatus = location.state?.status ?? PIPELINE_STAGE.shortlisted
  const from = listContextFromPipelineStatus(pipelineStatus)

  const { list, loading, error } = useSelector((s) => s.applicants)
  const hrLoading = useSelector((s) => s.applicants.loading)

  const [modalApplicant, setModalApplicant] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (role === 'HR') return
    dispatch(fetchApplicantsByStatus(pipelineStatus))
  }, [dispatch, pipelineStatus, role])

  useEffect(() => {
    if (!error) return
    showErrorToast(error)
    dispatch(clearApplicantsError())
  }, [error, dispatch])

  const sortedApplicants = useMemo(() => {
    return [...list].sort((a, b) => {
      const dateA = new Date(a?.applicationDate || a?.createdAt || 0).getTime()
      const dateB = new Date(b?.applicationDate || b?.createdAt || 0).getTime()
      return dateB - dateA
    })
  }, [list])

  const {
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

  const backTo = `${base}/careers/${sectionPathFromStatus(pipelineStatus)}`
  const heading = STATUS_HEADINGS[pipelineStatus] ?? 'Applicants'

  const closeModal = useCallback(() => setModalApplicant(null), [])

  useEffect(() => {
    if (!modalApplicant) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalApplicant, closeModal])

  const runStatusUpdate = async (nextStatus) => {
    if (!modalApplicant?.id) return
    try {
      setActionLoading(true)
      await dispatch(updateApplicantStatus({ id: modalApplicant.id, status: nextStatus })).unwrap()
      showSuccessToast(`Applicant moved to ${String(nextStatus).toLowerCase()}`)
      closeModal()
    } catch (e) {
      showErrorToast(e?.message || 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleHrAdd = () => {
    if (!modalApplicant || hrLoading) return
    dispatch(toggleHrApplicant({ id: modalApplicant.id, checked: true }))
      .unwrap()
      .then(() => {
        showSuccessToast('Applicant added successfully')
        closeModal()
      })
      .catch((err) => {
        showErrorToast(err?.message || 'Failed to add applicant')
      })
  }

  const modalSrc = modalApplicant ? videoSrcForApplicant(modalApplicant) : ''
  const modalProfileUrl = modalApplicant ? pickApplicantVideoProfileUrl(modalApplicant) : null

  if (role === 'HR') {
    return <Navigate to={`${base}/careers/applied`} replace />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{heading}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Open a card to play the intro video and use pipeline actions.
          </p>
          <Link to={backTo} className="mt-2 inline-block text-sm font-medium text-orange-600 hover:underline">
            ← Back to table view
          </Link>
        </div>
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
            nameSortOrder={nameSortOrder}
            setNameSortOrder={setNameSortOrder}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredApplicants.length === 0 && (
              <p className="col-span-full rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500">
                No applicants match these filters, or the list is empty.
              </p>
            )}
            {filteredApplicants.map((row, i) => {
              const key = row.id ?? row.email ?? i
              const src = videoSrcForApplicant(row)
              const profileUrl = pickApplicantVideoProfileUrl(row)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setModalApplicant(row)}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="relative aspect-video bg-slate-900">
                    {src ? (
                      <video
                        src={src}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                        aria-hidden
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        No intro video
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 px-3 py-3">
                    <p className="font-semibold text-slate-900">{row.fullName ?? '—'}</p>
                    <div className="space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                      <p className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <span>
                          <span className="font-medium text-slate-700">Age</span>{' '}
                          {applicantAgeInYearsFromDob(row.dob) ?? '—'}
                        </span>
                        <span className="text-slate-300" aria-hidden>
                          ·
                        </span>
                        <span className="min-w-0">
                          <span className="font-medium text-slate-700">City</span>{' '}
                          <span className="break-words">{row.city?.trim() || '—'}</span>
                        </span>
                      </p>
                      <p className="leading-snug">
                        <span className="font-medium text-slate-700">Current</span>{' '}
                        {formatSalaryForDisplay(row.currentSalary)}
                        <span className="mx-1.5 text-slate-300" aria-hidden>
                          ·
                        </span>
                        <span className="font-medium text-slate-700">Expected</span>{' '}
                        {formatSalaryForDisplay(row.expectedSalary)}
                      </p>
                      <p className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <span className="min-w-0 break-all">
                          <span className="font-medium text-slate-700">Mobile</span>{' '}
                          {row.phone?.trim() || '—'}
                        </span>
                        <span className="text-slate-300" aria-hidden>
                          ·
                        </span>
                        <span className="min-w-0 capitalize">{row.maritalStatus?.trim() || '—'}</span>
                      </p>
                      {profileUrl ? (
                        <p className="pt-0.5">
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block max-w-full break-all font-medium text-orange-700 underline decoration-orange-400 decoration-2 underline-offset-2 hover:text-orange-800"
                            title={profileUrl}
                          >
                            Video profile link
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {modalApplicant && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="careers-video-review-title"
          onMouseDown={closeModal}
        >
          <div
            className="relative flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
              <h2 id="careers-video-review-title" className="text-lg font-semibold text-slate-900">
                Intro video review
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <div className="space-y-1.5 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{modalApplicant.fullName ?? '—'}</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="font-medium text-slate-700">Age</span>{' '}
                    {applicantAgeInYearsFromDob(modalApplicant.dob) ?? '—'}
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="font-medium text-slate-700">City</span>{' '}
                    {modalApplicant.city?.trim() || '—'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Current</span>{' '}
                    {formatSalaryForDisplay(modalApplicant.currentSalary)}
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="font-medium text-slate-700">Expected</span>{' '}
                    {formatSalaryForDisplay(modalApplicant.expectedSalary)}
                  </p>
                  <p className="break-all">
                    <span className="font-medium text-slate-700">Mobile</span>{' '}
                    {modalApplicant.phone?.trim() || '—'}
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="capitalize">{modalApplicant.maritalStatus?.trim() || '—'}</span>
                  </p>
                </div>
                {modalProfileUrl ? (
                  <p className="text-xs">
                    <span className="font-medium text-slate-700">Video profile</span>{' '}
                    <a
                      href={modalProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-medium text-orange-700 underline decoration-orange-400 underline-offset-2 hover:text-orange-800"
                    >
                      {modalProfileUrl}
                    </a>
                  </p>
                ) : null}
              </div>

              {modalSrc ? (
                <video
                  key={modalSrc}
                  src={modalSrc}
                  controls
                  playsInline
                  className="max-h-[50vh] w-full rounded-xl bg-black"
                />
              ) : (
                <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No intro video on file — you can still update pipeline status below.
                </div>
              )}

              {!isHR ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {modalApplicant.status !== 'SHORTLISTED' && from !== 'REVIEW' && (
                    <ActionBtn
                      color="#ec8536"
                      disabled={actionLoading}
                      onClick={() => runStatusUpdate('SHORTLISTED')}
                    >
                      Shortlist
                    </ActionBtn>
                  )}
                  {from !== 'REVIEW' && (
                    <ActionBtn color="#5cbd48" disabled={actionLoading} onClick={() => runStatusUpdate('REVIEW')}>
                      Process
                    </ActionBtn>
                  )}
                  {from === 'REVIEW' && (
                    <ActionBtn
                      color="#5cbd48"
                      disabled={actionLoading}
                      onClick={() => runStatusUpdate('SELECTED')}
                    >
                      Select
                    </ActionBtn>
                  )}
                  <ActionBtn color="#d23b3b" disabled={actionLoading} onClick={() => runStatusUpdate('ARCHIVED')}>
                    Reject
                  </ActionBtn>
                </div>
              ) : (
                <div className="pt-2">
                  <ActionBtn color="#2563eb" disabled={hrLoading} onClick={handleHrAdd}>
                    {hrLoading ? 'Adding…' : '+ ADD'}
                  </ActionBtn>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
