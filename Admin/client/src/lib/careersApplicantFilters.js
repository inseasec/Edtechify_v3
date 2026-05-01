/** Parse first number from strings like "0.0 LPA", "1.6 LPA" */
export function parseLpaString(s) {
  if (s == null || s === '') return null
  const raw = String(s).trim()

  // Handle label values coming from User Career form
  // e.g. "Less than 1 LPA" should be treated as < 1, not as 1.
  if (/less\s*than\s*1/i.test(raw)) return 0

  const m = raw.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : null
}

/**
 * Show salary in tables as the candidate entered it (e.g. "3-4 LPA", "Less than 1 LPA").
 * Single bare numbers still render as "n LPA" for older rows.
 */
export function formatSalaryForDisplay(raw) {
  if (raw == null) return '—'
  const t = String(raw).trim()
  if (!t) return '—'
  const looksLikeLabel =
    /lpa/i.test(t) ||
    /less\s*than/i.test(t) ||
    /\d\s*[-–]\s*\d/.test(t) ||
    /[<>≈]/.test(t)
  if (looksLikeLabel) return t
  const n = parseLpaString(t)
  if (n != null && !Number.isNaN(n)) {
    const x = Number.isInteger(n) ? String(n) : String(n).replace(/\.0+$/, '')
    return `${x} LPA`
  }
  return t
}

/** @param {'lt'|'gt'|'between'|''} op */
function finiteNum(s) {
  const x = parseFloat(String(s ?? '').trim())
  return Number.isFinite(x) ? x : null
}

/**
 * Salary filter rule: arbitrary LPA values on admin side.
 * lt / gt compare strictly (&lt;, &gt;).
 * Between is inclusive [low, high] (low/high order normalized).
 */
export function lpaMatchesSalaryRule(lpa, op, primaryStr, endStr) {
  if (!op || op === '') return true

  const a = finiteNum(primaryStr)
  const b = finiteNum(endStr)

  if (lpa == null || Number.isNaN(lpa)) return false

  if (op === 'lt') {
    if (a == null) return true
    return lpa < a
  }
  if (op === 'gt') {
    if (a == null) return true
    return lpa > a
  }
  if (op === 'between') {
    if (a == null || b == null) return true
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    return lpa >= lo && lpa <= hi
  }
  return true
}

function parseApplicantDobDate(dob) {
  if (dob == null || dob === '') return null
  if (Array.isArray(dob) && dob.length >= 3) {
    const [y, m, d] = dob
    if ([y, m, d].some((x) => x == null)) return null
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  if (typeof dob === 'object') {
    const y = dob.year
    const m = dob.monthValue ?? dob.month
    const d = dob.dayOfMonth ?? dob.day
    if (y != null && m != null && d != null) {
      return new Date(Number(y), Number(m) - 1, Number(d))
    }
  }
  const dt = new Date(dob)
  return Number.isNaN(dt.getTime()) ? null : dt
}

/** Whole years from DOB (same semantics as admin table display). */
export function applicantAgeInYearsFromDob(dob) {
  const d = parseApplicantDobDate(dob)
  if (!d) return null
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1
  if (age < 0 || age > 120) return null
  return age
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function applicationDateInRange(isoStr, dateFilterType, yearStr, fromStr, toStr, monthStr) {
  if (!dateFilterType) return true
  const app = new Date(isoStr)
  if (Number.isNaN(app.getTime())) return false
  const appDay = startOfDay(app)

  const now = new Date()
  const today = startOfDay(now)

  switch (dateFilterType) {
    case 'today':
      return appDay.getTime() === today.getTime()
    case 'currentWeek': {
      const dow = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - ((dow + 6) % 7))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return app >= monday && app <= sunday
    }
    case 'lastWeek': {
      const dow = today.getDay()
      const thisMonday = new Date(today)
      thisMonday.setDate(today.getDate() - ((dow + 6) % 7))
      const lastMonday = new Date(thisMonday)
      lastMonday.setDate(thisMonday.getDate() - 7)
      const lastSunday = new Date(lastMonday)
      lastSunday.setDate(lastMonday.getDate() + 6)
      return app >= lastMonday && app <= lastSunday
    }
    case 'last1': {
      const a = new Date(today)
      a.setMonth(a.getMonth() - 1)
      return app >= a && app <= now
    }
    case 'last2': {
      const a = new Date(today)
      a.setMonth(a.getMonth() - 2)
      return app >= a && app <= now
    }
    case 'last3': {
      const a = new Date(today)
      a.setMonth(a.getMonth() - 3)
      return app >= a && app <= now
    }
    /** Applications in a specific calendar month of a chosen year */
    case 'monthYear': {
      const y = parseInt(yearStr, 10)
      const mo = parseInt(String(monthStr ?? '').trim(), 10)
      if (Number.isNaN(y) || Number.isNaN(mo) || mo < 1 || mo > 12) return false
      return app.getFullYear() === y && app.getMonth() === mo - 1
    }
    case 'custom': {
      if (!fromStr && !toStr) return true
      const from = fromStr ? startOfDay(new Date(fromStr)) : null
      const to = toStr ? startOfDay(new Date(toStr)) : null
      if (from && appDay < from) return false
      if (to && appDay > to) return false
      return true
    }
    default:
      return true
  }
}

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

/**
 * Client-side filter for `/admin-api/careers/getAllApplicants` rows.
 * @param {object[]} applicants
 * @param {object} filters - ApplicantFilters state
 * @param {string} nameSortOrder - '' | 'asc' | 'desc'
 * @param {string|null} pipelineStatus - e.g. APPLIED, or `null` to skip status filtering (e.g. archived-only list).
 */
export function applyApplicantFilters(
  applicants,
  filters,
  nameSortOrder,
  pipelineStatus = 'APPLIED',
) {
  if (!Array.isArray(applicants)) return []

  let list =
    pipelineStatus == null
      ? [...applicants]
      : applicants.filter((a) => (a.status ?? '').toUpperCase() === String(pipelineStatus).toUpperCase())

  const f = filters

  if (f.currentSalaryOp) {
    list = list.filter((row) =>
      lpaMatchesSalaryRule(
        parseLpaString(row.currentSalary),
        f.currentSalaryOp,
        f.currentSalaryNum,
        f.currentSalaryNumEnd,
      ),
    )
  }
  if (f.expectedSalaryOp) {
    list = list.filter((row) =>
      lpaMatchesSalaryRule(
        parseLpaString(row.expectedSalary),
        f.expectedSalaryOp,
        f.expectedSalaryNum,
        f.expectedSalaryNumEnd,
      ),
    )
  }
  if (f.cityFilter) {
    const c = String(f.cityFilter).trim()
    list = list.filter((a) => String(a.city ?? '').trim() === c)
  }
  if (f.stateFilter) {
    const s = String(f.stateFilter).trim()
    list = list.filter((a) => String(a.state ?? '').trim() === s)
  }
  if (f.maritalFilter) {
    const m = String(f.maritalFilter).trim()
    list = list.filter((a) => String(a.maritalStatus ?? '').trim() === m)
  }
  if (f.ageOp) {
    list = list.filter((a) =>
      lpaMatchesSalaryRule(
        applicantAgeInYearsFromDob(a.dob),
        f.ageOp,
        f.ageNum,
        f.ageNumEnd,
      ),
    )
  }
  if (f.roleTypeFilter) {
    if (f.roleTypeFilter === 'TECH') {
      list = list.filter((a) => {
        if (a.applyFor == null) return true
        return (a.applyFor?.roleType ?? '') !== 'NON_TECH'
      })
    } else {
      list = list.filter((a) => (a.applyFor?.roleType ?? '') === f.roleTypeFilter)
    }
  }
  if (f.roleFilter && f.roleTypeFilter === 'NON_TECH') {
    const r = String(f.roleFilter).trim()
    list = list.filter((a) => String(a.applyFor?.applyingFor ?? '').trim() === r)
  }
  if (f.genderFilter) {
    list = list.filter((a) => (a.gender ?? '') === f.genderFilter)
  }
  if (f.experienceFilter) {
    list = list.filter((a) => (a.experienceLevel ?? '') === f.experienceFilter)
  }
  if (f.dateFilterType) {
    list = list.filter((a) =>
      applicationDateInRange(
        a.applicationDate,
        f.dateFilterType,
        f.dateFilterYear,
        f.customFromDate,
        f.customToDate,
        f.dateFilterMonth,
      ),
    )
  }

  const q = (f.search ?? '').trim().toLowerCase()
  if (q) {
    list = list.filter((a) => {
      const hay = [
        a.fullName,
        a.email,
        a.phone,
        a.city,
        a.state,
        a.subjects,
        a.applyFor?.applyingFor,
        a.qualification,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }

  list = [...list]
  if (nameSortOrder === 'asc') {
    list.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? '', undefined, { sensitivity: 'base' }))
  } else if (nameSortOrder === 'desc') {
    list.sort((a, b) => (b.fullName ?? '').localeCompare(a.fullName ?? '', undefined, { sensitivity: 'base' }))
  }

  return list
}

/** Unique non-empty strings from applicant field */
export function uniqueFieldValues(applicants, key) {
  const set = new Set()
  for (const a of applicants) {
    const v = a[key]
    if (v != null && String(v).trim() !== '') set.add(String(v).trim())
  }
  return [...set].sort((x, y) => x.localeCompare(y, undefined, { sensitivity: 'base' }))
}

/** Unique applyingFor for a roleType */
export function uniqueApplyingFor(applicants, roleType) {
  const set = new Set()
  for (const a of applicants) {
    if ((a.applyFor?.roleType ?? '') !== roleType) continue
    const v = a.applyFor?.applyingFor
    if (v != null && String(v).trim() !== '') set.add(String(v).trim())
  }
  return [...set].sort((x, y) => x.localeCompare(y, undefined, { sensitivity: 'base' }))
}

/** Deduped sorted values for marital filter — matches usual career form options plus data on file. */
export function mergeMaritalFilterOptions(applicants) {
  const preset = ['Single', 'Married']
  const s = new Set(preset)
  for (const v of uniqueFieldValues(applicants, 'maritalStatus')) s.add(v)
  return [...s].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

/**
 * TECH / NON_TECH role dropdown: saved jobs from Careers Settings, applicants currently in this list,
 * then static fallbacks.
 */
export function mergedRoleTitlesForDropdown(applicants, catalogTitles, fallbackTitles, pipelineRoleType) {
  const fromApplicants = uniqueApplyingFor(applicants, pipelineRoleType)
  const merged = new Set()
  const addBatch = (arr) => {
    for (const x of arr ?? []) {
      const t = String(x ?? '').trim()
      if (t) merged.add(t)
    }
  }
  addBatch(catalogTitles)
  addBatch(fromApplicants)
  addBatch(fallbackTitles)
  return [...merged].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

/**
 * Pipeline stages shown to HR as ordered levels: Shortlisted (1) → Under review (2) → Selected (3).
 * Other statuses stay human-readable without a level suffix.
 */
export function formatCareerPipelineStatusForHr(status) {
  if (status == null || String(status).trim() === '') return '—'
  const u = String(status).trim().toUpperCase().replace(/\s+/g, '_')

  if (u === 'SHORTLISTED') return 'Shortlisted - Level 1'
  if (u === 'REVIEW' || u === 'UNDER_REVIEW') return 'Under review - Level 2'
  if (u === 'SELECTED') return 'Selected - Level 3'
  if (u === 'APPLIED') return 'Applied'
  if (u === 'ARCHIVED') return 'Archived'

  return String(status)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** First non-empty typed video profile / intro URL (not uploaded file path). camelCase or snake_case JSON. */
export function pickApplicantVideoProfileUrl(a) {
  if (!a || typeof a !== 'object') return null
  const candidates = [
    a.videoUrl,
    a.video_url,
    a.videoProfileLink,
    a.video_profile_link,
    a.videoProfile,
    a.video_profile,
    a.introVideoUrl,
    a.intro_video_url,
  ]
  for (const c of candidates) {
    const s = c != null ? String(c).trim() : ''
    if (s) return s
  }
  return null
}

/** Job opening / role title the applicant applied for (list column). */
export function formatAppliedRole(a) {
  if (a == null) return '—'
  const nested = String(a.applyFor?.applyingFor ?? '').trim()
  if (nested) return nested
  const flat = String(a.applyingFor ?? '').trim()
  if (flat) return flat
  const subjects = String(a.subjects ?? '').trim()
  if (subjects) return `Teaching — ${subjects}`
  const rt = String(a.roleType ?? '').trim()
  return rt || 'Teaching'
}
