import { jwtDecode } from 'jwt-decode'

/** Canonical roles returned after login / OTP (matches JWT `role` claim). */
const CANONICAL = ['SUPER_ADMIN', 'TEAM_ADMIN', 'SUB_ADMIN', 'HR']

/**
 * Normalize various JWT / API role strings to SUPER_ADMIN | TEAM_ADMIN | SUB_ADMIN | HR | null
 */
function normalizeRole(raw) {
  if (raw == null || raw === '') return null
  const s = String(raw).trim()
  const upper = s.toUpperCase().replace(/-/g, '_')
  if (CANONICAL.includes(upper)) return upper
  const lower = s.toLowerCase()
  if (lower === 'super-admin' || lower === 'superadmin') return 'SUPER_ADMIN'
  if (lower === 'team-admin' || lower === 'teamadmin') return 'TEAM_ADMIN'
  if (lower === 'sub-admin' || lower === 'subadmin') return 'SUB_ADMIN'
  if (lower === 'hr') return 'HR'
  return null
}

/**
 * Read admin role from JWT in localStorage (`token`).
 * Expects claim `role` (or `authority`) on the token payload.
 */
/**
 * Numeric admin id from JWT claim `id` (set after login / OTP refresh).
 */
export function getAdminUserId() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const decoded = jwtDecode(token)
    const raw = decoded.id ?? decoded.adminId
    if (raw == null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/** Email/login identifier from JWT subject (falls back to localStorage email). */
export function getAdminLoginEmail() {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = jwtDecode(token)
      const raw = decoded.sub ?? decoded.email
      const s = raw != null ? String(raw).trim() : ''
      if (s) return s
    }
  } catch {
    /* ignore */
  }
  return String(localStorage.getItem('email') ?? '').trim()
}

export function getUserRole() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const decoded = jwtDecode(token)
    const raw =
      decoded.role ??
      decoded.authority ??
      (Array.isArray(decoded.authorities) ? decoded.authorities[0] : null)
    return normalizeRole(raw)
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('email')
}
