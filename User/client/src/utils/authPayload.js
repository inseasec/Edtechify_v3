import { resolveAuthIdentifier } from "./authIdentifier";

/**
 * Builds JSON body for /users/signup and /users/signin (email or mobile + password).
 */
export function buildAuthPayload(userData) {
  const mode = userData.signupMode || "NORMAL";
  const resolved = resolveAuthIdentifier(mode, {
    identifier: userData.identifier,
    phoneCountryCode: userData.phoneCountryCode,
    phoneNational: userData.phoneNational,
  });

  const payload = {
    password: userData.password,
    email: resolved.channel === "email" ? resolved.email : undefined,
    mobileNo: resolved.channel === "mobile" ? resolved.mobileNo : undefined,
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
  if (d?.detail != null && String(d.detail).trim()) return String(d.detail).trim();
  const status = error?.response?.status;
  if (status === 401) return "Your session expired. Sign in again and retry.";
  if (status === 403) {
    return "You are not allowed to save this change. Sign in again and retry.";
  }
  if (status === 409) return "That email or mobile number is already linked to another account.";
  const em = typeof error?.message === "string" ? error.message.trim() : "";
  if (/^Request failed with status code \d+$/i.test(em)) {
    return "Something went wrong. Please try again.";
  }
  if (em) return em;
  return "Something went wrong. Please try again.";
}
