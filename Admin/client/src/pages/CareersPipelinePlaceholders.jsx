import { Link, useLocation, useParams } from 'react-router-dom'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'

/** Map `from` on location.state to careers URL segment (sidebar). */
function sectionPathFromFrom(from) {
  const map = {
    applied: 'applied',
    shortlisted: 'shortlisted',
    'under-review': 'under-review',
    selected: 'selected',
    archived: 'archived',
    'hr-applicants': 'hr-applicants',
  }
  return map[from] ?? 'shortlisted'
}

/** Placeholder detail view; full profile can reuse shared applicant components later. */
export function CareersApplicantDetailPlaceholder() {
  const base = useAdminBasePath()
  const { applicantId } = useParams()
  const location = useLocation()
  const row = location.state

  const from = row?.from
  const segment = sectionPathFromFrom(from)
  const backTo = `${base}/careers/${segment}`
  const backState =
    (from === 'under-review' || from === 'shortlisted') && row?.page != null
      ? { page: row.page }
      : undefined

  return (
    <div className="max-w-3xl text-left">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Applicant</h1>
      <p className="mt-2 text-slate-600">
        ID: <span className="font-mono text-slate-800">{applicantId}</span>
      </p>
      {row?.fullName && (
        <p className="mt-2 text-slate-700">
          Name: <span className="font-medium">{row.fullName}</span>
        </p>
      )}
      <Link
        to={backTo}
        state={backState}
        className="mt-6 inline-block text-orange-600 hover:underline"
      >
        ← Back
      </Link>
    </div>
  )
}
