/**
 * Reads portal live status from /clients/me payload (camelCase or snake_case keys).
 */
export function pickPortalAccessStatus(portal) {
  if (!portal || typeof portal !== "object") return undefined
  const v = portal.portalAccessStatus ?? portal.portal_access_status
  if (v == null) return undefined
  const s = String(v).trim()
  return s === "" ? undefined : s
}

/** Same “on” tokens as the admin grid; blank / unknown = not live (do not assume YES). */
export function isPortalLiveYes(portalOrRawString) {
  const raw =
    typeof portalOrRawString === "object" && portalOrRawString !== null
      ? pickPortalAccessStatus(portalOrRawString)
      : portalOrRawString
  const pas = String(raw ?? "").trim().toUpperCase()
  return pas === "YES" || pas === "ACTIVE" || pas === "TRUE" || pas === "1"
}

export function portalLiveDisplay(portal) {
  const on = isPortalLiveYes(portal)
  return { on, text: on ? "YES" : "NO" }
}
