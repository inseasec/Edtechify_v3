import { useEffect, useState } from 'react'
import { catalogRolesFromApplyForJobs, fetchApplyForJobsCatalog } from '@/lib/careersApi'

/** Teaching / non-teaching role titles from Careers Settings (`/applyfor/getAllJobs`). */
export default function useApplyForJobsCatalog() {
  const [catalog, setCatalog] = useState(() => ({
    teachingRoles: [],
    nonTeachingRoles: [],
  }))

  useEffect(() => {
    let cancelled = false
    fetchApplyForJobsCatalog()
      .then((rows) => {
        if (!cancelled) setCatalog(catalogRolesFromApplyForJobs(rows))
      })
      .catch(() => {
        if (!cancelled) setCatalog({ teachingRoles: [], nonTeachingRoles: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return catalog
}
