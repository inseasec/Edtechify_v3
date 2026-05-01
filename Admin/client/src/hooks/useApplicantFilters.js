import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyApplicantFilters,
  applicantAgeInYearsFromDob,
  formatSalaryForDisplay,
  parseLpaString,
} from '@/lib/careersApplicantFilters'

export const INITIAL_APPLICANT_FILTERS = {
  currentSalaryOp: '',
  currentSalaryNum: '',
  currentSalaryNumEnd: '',
  expectedSalaryOp: '',
  expectedSalaryNum: '',
  expectedSalaryNumEnd: '',
  cityFilter: '',
  stateFilter: '',
  maritalFilter: '',
  ageOp: '',
  ageNum: '',
  ageNumEnd: '',
  roleTypeFilter: '',
  roleFilter: '',
  genderFilter: '',
  experienceFilter: '',
  dateFilterType: '',
  dateFilterYear: '',
  /** 1–12 when filtering by calendar month */
  dateFilterMonth: '',
  customFromDate: '',
  customToDate: '',
  search: '',
}

function calculateAge(dob) {
  return applicantAgeInYearsFromDob(dob)
}

function normalizeSalary(s) {
  return parseLpaString(s)
}

/** Pass raw `currentSalary` / `expectedSalary` from the applicant row. */
function formatSalary(raw) {
  return formatSalaryForDisplay(raw)
}

function currentCalendarYearString() {
  return String(new Date().getFullYear())
}

/** Month & year filter: empty year defaults to current year. */
function yearOrDefaultForMonthPicker(yearStr) {
  const y = String(yearStr ?? '').trim()
  if (y !== '') return y
  return currentCalendarYearString()
}

/**
 * Client-side filters + pagination for a careers pipeline slice.
 * @param {object[]} applicants
 * @param {number} itemsPerPage
 * @param {string|null} pipelineStatus — e.g. PIPELINE_STAGE.shortlisted, or `null` to skip status filter.
 * @param {{ initialPage?: number }} [options]
 */
export function useApplicantFilters(applicants, itemsPerPage, pipelineStatus, options = {}) {
  const { initialPage: initialPageOpt = 1 } = options
  const [filters, setFilters] = useState(() => ({ ...INITIAL_APPLICANT_FILTERS }))
  const [nameSortOrder, setNameSortOrder] = useState('')
  const [currentPage, setCurrentPage] = useState(() =>
    Math.max(1, parseInt(String(initialPageOpt), 10) || 1),
  )

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
            const now = new Date()
            next.dateFilterYear = String(now.getFullYear())
            next.dateFilterMonth = String(now.getMonth() + 1)
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
    setFilters({ ...INITIAL_APPLICANT_FILTERS })
    setNameSortOrder('')
  }, [])

  const filtersKey = JSON.stringify(filters)

  useEffect(() => {
    setCurrentPage(1)
  }, [filtersKey, nameSortOrder, pipelineStatus])

  const filteredApplicants = useMemo(
    () => applyApplicantFilters(applicants, filters, nameSortOrder, pipelineStatus),
    [applicants, filters, nameSortOrder, pipelineStatus],
  )

  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / itemsPerPage))

  useEffect(() => {
    setCurrentPage((p) => (p > totalPages ? totalPages : p))
  }, [totalPages])

  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredApplicants.slice(start, start + itemsPerPage)
  }, [filteredApplicants, currentPage, itemsPerPage])

  const helpers = useMemo(
    () => ({
      calculateAge,
      normalizeSalary,
      formatSalary,
    }),
    [],
  )

  return {
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
  }
}
