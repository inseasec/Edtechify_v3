import { pickApplicantVideoProfileUrl } from '@/lib/careersApplicantFilters'

/**
 * Applicant list: name is a link (new tab) when they saved a video profile URL; plain text otherwise.
 * Stops row click so navigating to detail vs opening link stay separate.
 */
export default function ApplicantTableNameCell({ row }) {
  const href = pickApplicantVideoProfileUrl(row)
  const name = row?.fullName ?? '—'
  if (!href) {
    return <span className="font-medium text-slate-900">{name}</span>
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-orange-700 underline decoration-orange-500 decoration-2 underline-offset-2 hover:text-orange-800"
      onClick={(e) => e.stopPropagation()}
      title="Video profile link — opens in new tab"
    >
      {name}
    </a>
  )
}
