/**
 * Resolve organization-uploaded media paths (OrgData/…, course-images/…) against API base.
 * Mirrors Admin UserPanelHome `courseImageUrl` behaviour for the public site.
 */
export function orgMediaUrl(filename, base) {
  const baseUrl = String(base ?? "").replace(/\/$/, "");
  if (!filename || typeof filename !== "string") return "";
  const path = filename.replace(/^\/+/, "");
  if (path.startsWith("OrgData/")) {
    return baseUrl ? `${baseUrl}/${path}` : `/${path}`;
  }
  if (path.includes("course-images")) {
    return baseUrl ? `${baseUrl}/${path}` : `/${path}`;
  }
  return baseUrl ? `${baseUrl}/course-images/${path}` : `/${path}`;
}
