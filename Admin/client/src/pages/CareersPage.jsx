import { Navigate, useParams } from 'react-router-dom'
import CareersAppliedPanel from './CareersAppliedPanel'
import CareersArchivedPanel from './CareersArchivedPanel'
import CareersHrApplicantsPanel from './CareersHrApplicantsPanel'
import CareersMyApplicantsPanel from './CareersMyApplicantsPanel'
import CareersReviewPanel from './CareersReviewPanel'
import CareersSelectedPanel from './CareersSelectedPanel'
import CareersShortlistedPanel from './CareersShortlistedPanel'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { getUserRole } from '@/utils/auth'
import { CAREER_SECTIONS } from './careersSections'

const HR_CAREER_SECTIONS = new Set([
  'applied',
  'my-applicants',
  'shortlisted',
  'under-review',
  'selected',
  'archived',
])

export default function CareersPage() {
  const base = useAdminBasePath()
  const role = getUserRole()
  const { section } = useParams()

  if (role === 'HR' && section && !HR_CAREER_SECTIONS.has(section)) {
    return <Navigate to={`${base}/careers/applied`} replace />
  }
  if (role === 'HR' && section == null) {
    return <Navigate to={`${base}/careers/applied`} replace />
  }

  if (section === 'applied') {
    return <CareersAppliedPanel />
  }

  if (section === 'shortlisted') {
    return <CareersShortlistedPanel />
  }

  if (section === 'under-review') {
    return <CareersReviewPanel />
  }

  if (section === 'selected') {
    return <CareersSelectedPanel />
  }

  if (section === 'archived') {
    return <CareersArchivedPanel />
  }

  if (section === 'hr-applicants') {
    return <CareersHrApplicantsPanel />
  }

  if (section === 'my-applicants') {
    return <CareersMyApplicantsPanel />
  }

  if (section === 'settings') {
    return <Navigate to={`${base}/settings/career`} replace />
  }

  if (section && section in CAREER_SECTIONS) {
    const { title, description } = CAREER_SECTIONS[section]
    return (
      <div className="max-w-5xl text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{description}</p>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm text-slate-500">
          Applicant list and actions for this stage will connect to your careers API here.
        </div>
      </div>
    )
  }

  if (section) {
    return (
      <div className="max-w-3xl text-left">
        <h1 className="text-2xl font-semibold text-slate-900">Not found</h1>
        <p className="mt-2 text-slate-600">This careers section does not exist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl text-left">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Career</h1>
      <p className="mt-2 text-slate-600">
        Manage job postings, applicant pipelines, and hiring stages. Use the sidebar to open Applied,
        Shortlisted, Under Review, Selected, Archived, or HR Candidates. Career roles are managed from
        Career → Settings → Career settings. Additional options (e.g. salaries) live under Career →
        Settings.
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        Overview dashboard — hook up jobs list, metrics, and quick links when ready.
      </div>
    </div>
  )
}
