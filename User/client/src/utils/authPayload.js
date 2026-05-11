/**
 * Builds JSON body for /users/signup and /users/signin (email or mobile + password).
 */
export function buildAuthPayload(userData) {
  const id = String(userData.identifier ?? "").trim();
  const payload = {
    email: id.includes("@") ? id : undefined,
    mobileNo: /^\d{10}$/.test(id) ? id : undefined,
    password: userData.password,
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });
  return payload;
}

export function getApiErrorMessage(error) {
  const d = error?.response?.data;
  if (typeof d === "string" && d.trim()) return d.trim();
  if (d?.message != null && String(d.message).trim()) return String(d.message).trim();
  // Spring Boot 6+ ProblemDetail and some error handlers use `detail`
  if (d?.detail != null && String(d.detail).trim()) return String(d.detail).trim();
  const em = typeof error?.message === "string" ? error.message.trim() : "";
  // Axios default when the response body is empty or not parsed
  if (/^Request failed with status code \d+$/i.test(em)) {
    return "Something went wrong. Please try again.";
  }
  if (em) return em;
  return "Something went wrong. Please try again.";
}
