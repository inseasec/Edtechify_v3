import api from './api'

/**
 * Admin careers API — returns full applicant list as JSON array.
 * Set `VITE_API_BASE_URL` so paths resolve (e.g. http://host:port + /careers/...).
 */
export const CAREERS_PATHS = {
  getAllApplicants: '/careers/getAllApplicants',
  getAllOfHr: '/careers/getAllOfHr',
  getApplicantByStatus: (status) =>
    `/careers/getApplicantByStatus/${encodeURIComponent(String(status))}`,
  updateByStatus: (id, status) =>
    `/careers/updateByStatus/${encodeURIComponent(String(id))}/${encodeURIComponent(String(status))}`,
  /** Reject / archive a single applicant (adjust path if your backend differs). */
  archiveApplicant: (id) =>
    `/careers/archive/${encodeURIComponent(String(id))}`,
  /** Archived / rejected list (adjust if your backend uses a different path). */
  getAllArchived: '/careers/getAllArchived',
  updateHr: (id, assign) =>
    `/careers/updateHr/${encodeURIComponent(String(id))}?assign=${assign}`,
  /** Optional — keep if your backend exposes these */
  names: '/careers/name',
  filterOptions: '/careers/archive/filter-options',
}

export const PIPELINE_STAGE = {
  applied: 'APPLIED',
  shortlisted: 'SHORTLISTED',
  // Backend status value is "REVIEW" (not "UNDER_REVIEW")
  underReview: 'REVIEW',
  selected: 'SELECTED',
  archived: 'ARCHIVED',
  hrApplicants: 'HR_APPLICANTS',
}

export function parseCareerNames(data) {
  if (data == null) return { teachingRoles: [], nonTeachingRoles: [] }
  if (Array.isArray(data)) {
    return { teachingRoles: data, nonTeachingRoles: [] }
  }
  const d = data.data ?? data
  const teaching =
    d.teachingRoles ?? d.techRoles ?? d.TECH ?? d.teaching ?? (Array.isArray(d.tech) ? d.tech : null)
  const nonTeaching =
    d.nonTeachingRoles ?? d.nonTechRoles ?? d.NON_TECH ?? d.nonTeaching ?? (Array.isArray(d.nonTech) ? d.nonTech : null)
  return {
    teachingRoles: Array.isArray(teaching) ? teaching : [],
    nonTeachingRoles: Array.isArray(nonTeaching) ? nonTeaching : [],
  }
}

export function parseFilterOptions(data) {
  if (data == null) return null
  const d = data.data ?? data
  return {
    cities: d.cities ?? d.cityList ?? [],
    states: d.states ?? d.stateList ?? [],
    ageRanges: d.ageRanges ?? d.ageRangesList ?? null,
  }
}

/** Responses that return JSON array OR plain string messages when empty */
export function normalizeCareersListPayload(data) {
  if (data == null) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') return []
  const inner = data?.data
  return Array.isArray(inner) ? inner : []
}

/** Raw array from GET /careers/getAllApplicants */
export async function fetchAllApplicants() {
  const { data } = await api.get(CAREERS_PATHS.getAllApplicants)
  const raw = data?.data ?? data
  return Array.isArray(raw) ? raw : []
}

export async function fetchCareerNames() {
  const { data } = await api.get(CAREERS_PATHS.names)
  return parseCareerNames(data)
}

/** Jobs defined in Careers Settings (`/applyfor/getAllJobs`) — TECH vs NON_TECH roles. */
export async function fetchApplyForJobsCatalog() {
  try {
    const { data } = await api.get('/applyfor/getAllJobs')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function catalogRolesFromApplyForJobs(rows) {
  const tech = new Set()
  const nonTech = new Set()
  for (const row of rows ?? []) {
    const name = String(row?.applyingFor ?? '').trim()
    if (!name) continue
    const rt = String(row?.roleType ?? '').toUpperCase()
    if (rt === 'NON_TECH') nonTech.add(name)
    else tech.add(name)
  }
  const sortTitles = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
  return {
    teachingRoles: [...tech].sort(sortTitles),
    nonTeachingRoles: [...nonTech].sort(sortTitles),
  }
}

export async function fetchApplicantFilterOptions() {
  try {
    const { data } = await api.get(CAREERS_PATHS.filterOptions)
    return parseFilterOptions(data)
  } catch {
    return null
  }
}
