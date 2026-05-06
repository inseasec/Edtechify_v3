import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import api from '@/lib/api'
import { CAREERS_PATHS } from '@/lib/careersApi'
import {
  formatAppliedRole,
  formatCareerPipelineStatusForHr,
  pickApplicantVideoProfileUrl,
} from '@/lib/careersApplicantFilters'
import { getAdminUserId, getUserRole } from '@/utils/auth'
import { toggleHrApplicant } from '@/store/applicantsSlice'
import { showSuccessToast, showErrorToast } from '@/utils/toastUtils'

/** e.g. 26 May 2026 — uses calendar date parts to avoid UTC shift on YYYY-MM-DD strings. */
function formatDobDisplay(dob) {
  if (dob == null || dob === '') return null

  let y
  let mo
  let da

  if (typeof dob === 'string') {
    const part = dob.split('T')[0]
    const segs = part.split('-').map(Number)
    if (segs.length >= 3 && segs.every((n) => !Number.isNaN(n))) {
      ;[y, mo, da] = segs
    }
  } else if (Array.isArray(dob) && dob.length >= 3) {
    ;[y, mo, da] = dob.map(Number)
  }

  if (
    y != null &&
    mo != null &&
    da != null &&
    Number.isFinite(y) &&
    Number.isFinite(mo) &&
    Number.isFinite(da)
  ) {
    const d = new Date(y, mo - 1, da)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }
  }

  try {
    const d = new Date(dob)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }
  } catch {
    /* ignore */
  }

  return String(dob)
}

function formatAppliedAt(iso) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return String(iso)
  }
}

function uploadedFilePublicUrl(relPath) {
  if (!relPath) return null
  const base = api.defaults.baseURL?.replace(/\/?$/, '') ?? ''
  const p = String(relPath).replace(/^\//, '')
  return `${base}/${p}`
}

function sameHrId(a, b) {
  if (a == null || b == null) return false
  return Number(a) === Number(b)
}

export default function ApplicantDetails() {
  const navigate = useNavigate()
  const { applicantId } = useParams()
  const location = useLocation()
  const dispatch = useDispatch()

  const role = getUserRole()
  const isHR = role === 'HR'

  const { loading: hrLoading } = useSelector((state) => state.applicants)

  const [applicant, setApplicant] = useState(location.state?.applicant || null)
  const [loading, setLoading] = useState(false)

  /* ================= FETCH ================= */
  const fetchApplicant = useCallback(async () => {
    if (!applicantId) return
    try {
      setLoading(true)
      const res = await api.get(`/careers/getApplicantById/${applicantId}`)
      setApplicant(res.data)
    } catch (err) {
      console.error(err)
      showErrorToast('Failed to fetch applicant data')
    } finally {
      setLoading(false)
    }
  }, [applicantId])

  /** Always hydrate from API — list rows passed in `location.state` can omit new fields (e.g. videoUrl). */
  useEffect(() => {
    fetchApplicant()
  }, [fetchApplicant])

  /* ================= RESUME ================= */
  const getResumeUrl = () => {
    if (!applicant?.resume) return null
    // Backend returns relative path like "Careers/<file>.pdf" and serves it from `upload/` (static-locations=file:upload/).
    const p = String(applicant.resume).replace(/^\//, '')
    return `${api.defaults.baseURL}/${p}`
  }

  const openResumePdf = () => {
    const url = getResumeUrl()
    if (!url) return alert('Resume not available')
    window.open(url, '_blank')
  }

  /* ================= NAVIGATION ================= */
  const goBackToList = () => {
    navigate(-1)
  }

  /* ================= STATUS ACTIONS ================= */
  const updateStatus = async (status) => {
    try {
      setLoading(true)
      await api.put(`/careers/updateByStatus/${applicantId}/${status}`)
      showSuccessToast(`Applicant ${String(status).toLowerCase()} successfully`)
      goBackToList()
    } catch (error) {
      showErrorToast(error?.response?.data?.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const rejectAndArchive = async () => {
    try {
      setLoading(true)
      await api.put(CAREERS_PATHS.archiveApplicant(applicantId))
      showSuccessToast('Applicant archived successfully')
      goBackToList()
    } catch (error) {
      showErrorToast(error?.response?.data?.message || 'Failed to archive applicant')
    } finally {
      setLoading(false)
    }
  }

  /** HR sees intro video only when opening from the Applied list (not other pipeline tabs). */
  const openedFromApplied = location.state?.from === 'APPLIED'

  /* ================= INTRO VIDEO (same sources as Careers video modal) ================= */
  const introVideoSrc = useMemo(() => {
    if (isHR && !openedFromApplied) return null
    if (!applicant?.introVideoUrl && !applicant?.video) return null
    if (applicant.introVideoUrl) return String(applicant.introVideoUrl)
    return uploadedFilePublicUrl(applicant.video)
  }, [applicant, isHR, openedFromApplied])

  /** Profile / intro URLs the applicant typed (never the file-upload link row). Blank when none. */
  const videoProfileLinkOnly = pickApplicantVideoProfileUrl(applicant)

  /* ================= HR tag (Applied list → detail only; hrId freezes for all HRs) ================= */
  const myHrId = getAdminUserId()

  const handleHrTagApplicant = () => {
    if (!applicant || hrLoading) return

    if (applicant.hrId != null) {
      showErrorToast(
        sameHrId(applicant.hrId, myHrId)
          ? 'This applicant is tagged. Tags are frozen until a super admin re-tags.'
          : 'Tagged by another HR. Only a super admin can re-tag to make them available.',
      )
      return
    }
    if (myHrId == null) {
      showErrorToast('Sign out and sign in again so your account ID is loaded for tagging.')
      return
    }

    dispatch(
      toggleHrApplicant({
        id: applicant.id,
        checked: true,
      }),
    )
      .unwrap()
      .then(() => {
        showSuccessToast('Applicant tagged — find them under My Applicants.')
        goBackToList()
      })
      .catch((error) => {
        showErrorToast(error?.message || 'Failed to tag applicant')
      })
  }

  /* ================= UI ================= */
  if (loading && !applicant) return <p className="p-6 text-center">Loading...</p>
  if (!applicant) return <p className="p-6 text-center">No Applicant Found</p>

  const roleLabel = formatAppliedRole(applicant)
  const dobDisplay = formatDobDisplay(applicant.dob)
  const appliedDisplay = formatAppliedAt(applicant.applicationDate)

  const showVideoPlayer = Boolean(introVideoSrc) && (!isHR || openedFromApplied)

  /** Salary is visible to HR only on Applied list/detail; hide elsewhere for HR. */
  const showSalaryForHrViewer = !isHR || openedFromApplied

  /** Only HRs arriving from Applied can tag; applicant must still be pipeline APPLIED. */
  const showHrTagApplicantBtn =
    isHR && openedFromApplied && applicant.status === 'APPLIED'
  const hrTagDisabledHard =
    showHrTagApplicantBtn &&
    (applicant.hrId != null || myHrId == null || hrLoading)
  const hrTagButtonTitle =
    applicant.hrId != null
      ? sameHrId(applicant.hrId, myHrId)
        ? 'Tagged — only a super admin can clear this tag.'
        : 'Tagged by another HR — only a super admin can re-tag.'
      : myHrId == null
        ? 'Sign out and sign in again so your account ID is loaded for tagging.'
        : 'Tag this applicant to your My Applicants list'

  return (
    <div className="mx-auto mt-4 w-[95%] max-w-6xl pb-10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Applicant</h1>
          <p className="text-sm text-slate-600">
            {applicant.fullName || '—'}{' '}
            <span className="text-slate-400">·</span> ID {applicant.id}
            {appliedDisplay && (
              <>
                <span className="text-slate-400"> · </span>
                Applied {appliedDisplay}
              </>
            )}
            {applicant.status && (
              <>
                <span className="text-slate-400"> · </span>
                {isHR
                  ? formatCareerPipelineStatusForHr(applicant.status)
                  : String(applicant.status).replace(/_/g, ' ')}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={goBackToList}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-90"
        >
          Back
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mb-4 flex flex-wrap gap-2">
        {!isHR && (
          <>
            {applicant.status !== 'SHORTLISTED' && location.state?.from !== 'REVIEW' && (
              <ActionBtn color="#ec8536" onClick={() => updateStatus('SHORTLISTED')}>
                Shortlist
              </ActionBtn>
            )}
            {location.state?.from !== 'REVIEW' && (
              <ActionBtn color="#5cbd48" onClick={() => updateStatus('REVIEW')}>
                Process
              </ActionBtn>
            )}
            {location.state?.from === 'REVIEW' && (
              <ActionBtn color="#5cbd48" onClick={() => updateStatus('SELECTED')}>
                Select
              </ActionBtn>
            )}
            <ActionBtn color="#d23b3b" onClick={rejectAndArchive}>
              Reject
            </ActionBtn>
          </>
        )}

        {showHrTagApplicantBtn && (
          <button
            type="button"
            title={hrTagButtonTitle}
            onClick={handleHrTagApplicant}
            disabled={hrTagDisabledHard}
            className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition ${
              hrTagDisabledHard
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-[#2563eb] hover:opacity-95'
            }`}
          >
            {hrLoading ? 'Tagging…' : 'Tag applicant'}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <ApplicantSection title="Personal">
          <FieldRow>
            <DenseRow label="Full name" value={applicant.fullName} inGridRow />
            <DenseRow label="DOB" value={dobDisplay} inGridRow />
            <DenseRow label="Marital status" value={applicant.maritalStatus} inGridRow />
          </FieldRow>
          <FieldRow>
            <DenseRow label="Gender" value={applicant.gender} inGridRow />
            <DenseRow label="Email" value={applicant.email} mono inGridRow />
            <DenseRow label="City" value={applicant.city} inGridRow />
          </FieldRow>
          <FieldRow>
            <DenseRow label="State" value={applicant.state} inGridRow />
            <DenseRow label="Applicant ID" value={applicant.id} inGridRow />
            <DenseRow label="Phone" value={applicant.phone} inGridRow />
          </FieldRow>
        </ApplicantSection>

        <ApplicantSection title="Professional">
          <FieldRow>
            <DenseRow label="Qualification" value={applicant.qualification} inGridRow />
            <DenseRow label="Experience" value={applicant.experienceLevel} inGridRow />
            <DenseRow label="Role" value={roleLabel} emphasized inGridRow />
          </FieldRow>
          {showSalaryForHrViewer ? (
            <FieldRow>
              <DenseRow label="Current salary (LPA)" value={applicant.currentSalary} inGridRow />
              <DenseRow label="Expected salary (LPA)" value={applicant.expectedSalary} inGridRow />
              <DenseRow label="Subjects" value={applicant.subjects} inGridRow />
            </FieldRow>
          ) : (
            <FieldRow>
              <div className="min-w-0 sm:col-span-3">
                <DenseRow label="Subjects" value={applicant.subjects} inGridRow />
              </div>
            </FieldRow>
          )}
          <FieldRow>
            <div className="min-w-0 sm:col-span-3">
              <DenseRow
                label="Video profile"
                value={null}
                inGridRow
                addon={<VideoProfileLinkRow url={videoProfileLinkOnly} />}
              />
            </div>
          </FieldRow>
        </ApplicantSection>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Resume</span>
          <button
            type="button"
            onClick={openResumePdf}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white hover:opacity-90"
          >
            Open resume PDF
          </button>
          {getResumeUrl() && (
            <a
              href={getResumeUrl()}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-orange-600 hover:underline"
            >
              Open in new tab
            </a>
          )}
        </div>

        {showVideoPlayer && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Intro video (preview)</p>
            <video
              src={introVideoSrc}
              controls
              className="max-h-56 w-full max-w-xl rounded-lg border border-slate-200 bg-black sm:max-h-64"
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= UI HELPERS ================= */
function ApplicantSection({ title, children }) {
  return (
    <section className="mb-5 last:mb-0">
      <h2 className="mb-2.5 border-b border-slate-200 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
        {title}
      </h2>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

/** One horizontal band: typically three cells on ≥sm widths. */
function FieldRow({ children }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 border-b border-slate-100 sm:grid-cols-3 sm:gap-x-5">
      {children}
    </div>
  )
}

function DenseRow({ label, value, emphasized, mono, addon, inGridRow }) {
  const useAddon = addon != null && addon !== false
  const empty = value === null || value === undefined || value === ''
  const textValue = empty ? '—' : mono ? String(value) : String(value)
  const content = useAddon ? addon : textValue

  return (
    <div
      className={`flex min-w-0 flex-col gap-0.5 py-2 text-sm sm:py-1.5 ${
        inGridRow ? '' : 'border-b border-slate-100'
      }`}
    >
      <span className="shrink-0 text-xs leading-tight text-slate-500 sm:text-sm">{label}</span>
      <div
        className={`min-w-0 break-words text-slate-800 sm:min-h-[1.375rem] ${
          emphasized ? 'font-medium text-slate-900' : ''
        } ${mono ? 'font-mono text-xs sm:text-xs' : ''}`}
      >
        {content}
      </div>
    </div>
  )
}

/** Video profile row: link text only when the applicant entered a URL; otherwise empty. */
function VideoProfileLinkRow({ url }) {
  const s = url ? String(url).trim() : ''
  if (!s) return null
  return (
    <a href={s} target="_blank" rel="noreferrer" className="break-all text-orange-600 hover:underline">
      {s}
    </a>
  )
}

const ActionBtn = ({ children, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{ backgroundColor: color }}
    className="rounded-lg px-5 py-2 text-sm text-white disabled:opacity-60"
  >
    {children}
  </button>
)

