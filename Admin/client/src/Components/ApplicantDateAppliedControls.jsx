import { useEffect, useMemo } from 'react'

/** Years for Month & year filter: newest first (scroll down for older years). */
const MONTH_YEAR_HISTORY = 55

function buildMonthYearDescendingYears() {
  const cy = new Date().getFullYear()
  const min = cy - MONTH_YEAR_HISTORY
  const out = []
  for (let y = cy; y >= min; y--) out.push(y)
  return out
}

const dateControlSelectCls =
  'rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20'

/**
 * Date-applied preset + month/year / custom controls. Used inside ApplicantFilters
 * or inline (e.g. HR Candidates toolbar next to Select HR).
 */
export default function ApplicantDateAppliedControls({ filters, setters }) {
  const monthYearYearOptions = useMemo(() => buildMonthYearDescendingYears(), [])

  useEffect(() => {
    if (filters.dateFilterType === 'year') {
      setters.setDateFilterType('')
    }
  }, [filters.dateFilterType, setters])

  useEffect(() => {
    if (filters.dateFilterType !== 'monthYear') return
    const y = parseInt(String(filters.dateFilterYear ?? '').trim(), 10)
    if (!monthYearYearOptions.includes(y)) {
      setters.setDateFilterYear(String(monthYearYearOptions[0]))
      return
    }
    const m = String(filters.dateFilterMonth ?? '').trim()
    if (!/^([1-9]|1[0-2])$/.test(m)) {
      setters.setDateFilterMonth(String(new Date().getMonth() + 1))
    }
  }, [
    filters.dateFilterType,
    filters.dateFilterYear,
    filters.dateFilterMonth,
    monthYearYearOptions,
    setters,
  ])

  return (
    <>
      <select
        aria-label="Filter by application date"
        value={filters.dateFilterType}
        onChange={(e) => setters.setDateFilterType(e.target.value)}
        className={dateControlSelectCls}
      >
        <option value="">Date applied</option>
        <option value="today">Today</option>
        <option value="currentWeek">Current week</option>
        <option value="lastWeek">Last week</option>
        <option value="monthYear">Month &amp; year</option>
        <option value="last1">Last 1 month</option>
        <option value="last2">Last 2 months</option>
        <option value="last3">Last 3 months</option>
        <option value="custom">Custom range</option>
      </select>

      {filters.dateFilterType === 'monthYear' && (
        <>
          <select
            aria-label="Application year"
            title="Years listed with the current year at the top — scroll down for older years."
            value={
              monthYearYearOptions.includes(parseInt(filters.dateFilterYear, 10))
                ? filters.dateFilterYear
                : String(monthYearYearOptions[0] ?? new Date().getFullYear())
            }
            onChange={(e) => setters.setDateFilterYear(e.target.value)}
            className={`max-w-[5.75rem] ${dateControlSelectCls}`}
          >
            {monthYearYearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <select
            aria-label="Application month"
            value={
              /^([1-9]|1[0-2])$/.test(String(filters.dateFilterMonth ?? '').trim())
                ? String(filters.dateFilterMonth).trim()
                : String(new Date().getMonth() + 1)
            }
            onChange={(e) => setters.setDateFilterMonth(e.target.value)}
            className={`max-w-[9.5rem] ${dateControlSelectCls}`}
          >
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </>
      )}

      {filters.dateFilterType === 'custom' && (
        <>
          <input
            type="date"
            value={filters.customFromDate}
            onChange={(e) => setters.setCustomFromDate(e.target.value)}
            className={dateControlSelectCls}
          />
          <input
            type="date"
            value={filters.customToDate}
            onChange={(e) => setters.setCustomToDate(e.target.value)}
            className={dateControlSelectCls}
          />
        </>
      )}
    </>
  )
}
