import ApplicantDateAppliedControls from '@/Components/ApplicantDateAppliedControls'

const salarySelectCls =
  'max-w-[12rem] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20'
const salaryInputCls =
  'w-[4.5rem] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

/** lt / gt / between with numeric inputs (salary LPA or age in years). */
function ComparisonFilterRow({
  groupLabel,
  anyOptionLabel,
  unitLabel,
  op,
  num,
  numEnd,
  setOp,
  setNum,
  setNumEnd,
  inputMode = 'decimal',
  min = 0,
  max,
  step,
  placeholderSingle = '',
}) {
  const maxAttr = max != null ? { max } : {}
  const mergedStep = step ?? (inputMode === 'numeric' ? 1 : 'any')
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="flex flex-wrap items-center gap-1 rounded-md bg-white/60 px-1.5 py-1 ring-1 ring-slate-200/70"
    >
      <select
        aria-label={`${groupLabel} condition`}
        value={op ?? ''}
        onChange={(e) => setOp(e.target.value)}
        className={salarySelectCls}
      >
        <option value="">{anyOptionLabel}</option>
        <option value="lt">{`Less than … ${unitLabel}`}</option>
        <option value="gt">{`Greater than … ${unitLabel}`}</option>
        <option value="between">{`Between … and … ${unitLabel}`}</option>
      </select>
      {op === 'between' && (
        <>
          <input
            type="number"
            inputMode={inputMode}
            min={min}
            {...maxAttr}
            step={mergedStep}
            aria-label={`${groupLabel} range low`}
            placeholder="Low"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            className={salaryInputCls}
          />
          <span className="select-none text-slate-400">–</span>
          <input
            type="number"
            inputMode={inputMode}
            min={min}
            {...maxAttr}
            step={mergedStep}
            aria-label={`${groupLabel} range high`}
            placeholder="High"
            value={numEnd}
            onChange={(e) => setNumEnd(e.target.value)}
            className={salaryInputCls}
          />
        </>
      )}
      {(op === 'lt' || op === 'gt') && (
        <input
          type="number"
          inputMode={inputMode}
          min={min}
          {...maxAttr}
          step={mergedStep}
          aria-label={`${groupLabel} value`}
          placeholder={placeholderSingle || `e.g. ${unitLabel === 'years' ? '30' : '7'}`}
          value={num}
          onChange={(e) => setNum(e.target.value)}
          className={salaryInputCls}
        />
      )}
    </div>
  )
}

/**
 * Filter bar for careers applicant lists (Applied, HR, etc.).
 * Controlled via `filters` + `setters` from the parent.
 */
export default function ApplicantFilters({
  total,
  cities = [],
  states = [],
  teachingRoles = [],
  nonTeachingRoles = [],
  maritalOptions = [],
  filters,
  setters,
  resetFilters,
  isHR,
  nameSortOrder,
  setNameSortOrder,
  /** When false, current/expected salary filter controls are hidden (e.g. HR outside Applied). */
  showSalaryFilters = true,
  /** When true, Date applied controls are omitted (render them elsewhere, e.g. HR Candidates toolbar). */
  hideDateAppliedFilter = false,
}) {
  return (
    <div className="max-w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm shadow-sm sm:px-4">
      <p className="font-semibold text-slate-800">Showing {total} applicants</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {showSalaryFilters && (
          <>
            <ComparisonFilterRow
              groupLabel="Current salary filter"
              anyOptionLabel="Current salary — any"
              unitLabel="LPA"
              op={filters.currentSalaryOp}
              num={filters.currentSalaryNum ?? ''}
              numEnd={filters.currentSalaryNumEnd ?? ''}
              setOp={setters.setCurrentSalaryOp}
              setNum={setters.setCurrentSalaryNum}
              setNumEnd={setters.setCurrentSalaryNumEnd}
            />

            <ComparisonFilterRow
              groupLabel="Expected salary filter"
              anyOptionLabel="Expected salary — any"
              unitLabel="LPA"
              op={filters.expectedSalaryOp}
              num={filters.expectedSalaryNum ?? ''}
              numEnd={filters.expectedSalaryNumEnd ?? ''}
              setOp={setters.setExpectedSalaryOp}
              setNum={setters.setExpectedSalaryNum}
              setNumEnd={setters.setExpectedSalaryNumEnd}
            />
          </>
        )}

        <select
          aria-label="Filter by city"
          value={filters.cityFilter}
          onChange={(e) => setters.setCityFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        {!isHR && (
          <select
            aria-label="Filter by state"
            value={filters.stateFilter}
            onChange={(e) => setters.setStateFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">States</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        )}

        {!isHR && maritalOptions.length > 0 && (
          <select
            aria-label="Filter by marital"
            value={filters.maritalFilter ?? ''}
            onChange={(e) => setters.setMaritalFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Marital</option>
            {maritalOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}

        <ComparisonFilterRow
          groupLabel="Age filter"
          anyOptionLabel="Age — any"
          unitLabel="years"
          op={filters.ageOp}
          num={filters.ageNum ?? ''}
          numEnd={filters.ageNumEnd ?? ''}
          setOp={setters.setAgeOp}
          setNum={setters.setAgeNum}
          setNumEnd={setters.setAgeNumEnd}
          inputMode="numeric"
          min={0}
          max={120}
          step={1}
        />

        <select
          aria-label="Filter by role type"
          value={filters.roleTypeFilter}
          onChange={(e) => {
            setters.setRoleTypeFilter(e.target.value)
            setters.setRoleFilter('')
          }}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Role type</option>
          <option value="TECH">Teaching</option>
          <option value="NON_TECH">Non teaching</option>
        </select>

        {filters.roleTypeFilter === 'NON_TECH' && (
          <select
            aria-label="Filter by role"
            value={filters.roleFilter}
            onChange={(e) => setters.setRoleFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Roles</option>
            {nonTeachingRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Filter by gender"
          value={filters.genderFilter}
          onChange={(e) => setters.setGenderFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <select
          aria-label="Filter by experience"
          value={filters.experienceFilter}
          onChange={(e) => setters.setExperienceFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Experience</option>
          <option value="0-1">0–1 years</option>
          <option value="2-4">2–4 years</option>
          <option value="5+">5+ years</option>
        </select>

        {!hideDateAppliedFilter && (
          <ApplicantDateAppliedControls filters={filters} setters={setters} />
        )}

        <input
          type="search"
          placeholder="Search…"
          value={filters.search}
          onChange={(e) => setters.setSearch(e.target.value)}
          className="min-w-[140px] flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 sm:max-w-xs sm:flex-none"
        />

        <select
          aria-label="Sort by name"
          value={nameSortOrder}
          onChange={(e) => setNameSortOrder(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Sort by name</option>
          <option value="asc">A – Z</option>
          <option value="desc">Z – A</option>
        </select>

        <button
          type="button"
          onClick={resetFilters}
          className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white transition hover:bg-slate-800"
        >
          Reset filters
        </button>
      </div>
    </div>
  )
}
