import { jwtDecode } from "jwt-decode";

const SIGNUP_CHANNEL_KEY_PREFIX = "edukifySignupChannel:";
const LAUNCH_LOCKS_KEY_PREFIX = "launchContactLocks:";

export function persistSignupChannel(userId, channel) {
  if (userId == null || (channel !== "email" && channel !== "mobile")) return;
  try {
    localStorage.setItem(`${SIGNUP_CHANNEL_KEY_PREFIX}${userId}`, channel);
  } catch {
    // ignore storage failures
  }
}

export function storeSignupChannelFromToken(token, channel) {
  if (!token || (channel !== "email" && channel !== "mobile")) return;
  try {
    const userId = jwtDecode(token)?.user_id;
    persistSignupChannel(userId, channel);
  } catch {
    // ignore token decode failures
  }
}

export function readSignupChannel(userId) {
  if (userId == null) return null;
  try {
    const channel = localStorage.getItem(`${SIGNUP_CHANNEL_KEY_PREFIX}${userId}`);
    return channel === "email" || channel === "mobile" ? channel : null;
  } catch {
    return null;
  }
}

function readCachedLaunchLocks(userId) {
  if (userId == null) return null;
  try {
    const raw = sessionStorage.getItem(`${LAUNCH_LOCKS_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.emailLocked !== "boolean" || typeof parsed?.mobileLocked !== "boolean") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function cacheLaunchLocks(userId, locks) {
  if (userId == null) return;
  try {
    sessionStorage.setItem(`${LAUNCH_LOCKS_KEY_PREFIX}${userId}`, JSON.stringify(locks));
  } catch {
    // ignore storage failures
  }
}

export function deriveLaunchContactLocks(userId, user, parsedPhone) {
  const cached = readCachedLaunchLocks(userId);
  if (cached) return cached;

  const emailFromAccount = String(user?.email ?? "").trim();
  const mobileFromAccount = Boolean(parsedPhone?.number);
  const emailVerifiedFlag = Boolean(user?.emailVerified);
  const mobileVerifiedFlag = Boolean(user?.mobileVerified);
  const storedChannel = readSignupChannel(userId);

  let locks;
  if (storedChannel === "email") {
    locks = { emailLocked: true, mobileLocked: false };
  } else if (storedChannel === "mobile") {
    locks = { emailLocked: false, mobileLocked: true };
  } else if (mobileVerifiedFlag && !emailVerifiedFlag) {
    locks = { emailLocked: false, mobileLocked: true };
  } else if (emailVerifiedFlag && !mobileVerifiedFlag) {
    locks = { emailLocked: true, mobileLocked: false };
  } else if (mobileFromAccount && !emailFromAccount) {
    locks = { emailLocked: false, mobileLocked: true };
  } else if (emailFromAccount && !mobileFromAccount) {
    locks = { emailLocked: true, mobileLocked: false };
  } else if (mobileFromAccount && emailFromAccount) {
    locks = { emailLocked: false, mobileLocked: true };
  } else {
    locks = { emailLocked: false, mobileLocked: false };
  }

  cacheLaunchLocks(userId, locks);
  return locks;
}

export function resolveLaunchOtpRequirements(signupMode, contactLocks = {}) {
  const mode = signupMode || "NORMAL";
  const emailLocked = Boolean(contactLocks.emailLocked);
  const mobileLocked = Boolean(contactLocks.mobileLocked);

  if (mode === "EMAIL" || mode === "MOBILE") {
    return { requireEmailOtp: false, requireMobileOtp: false };
  }

  if (mode === "BOTH" || mode === "NORMAL") {
    return {
      requireEmailOtp: !emailLocked,
      requireMobileOtp: !mobileLocked,
    };
  }

  return { requireEmailOtp: true, requireMobileOtp: true };
}

export function resolveContactOtpCapabilities(signupMode) {
  const mode = String(signupMode || "NORMAL").toUpperCase();
  return {
    emailOtpEnabled: mode === "EMAIL" || mode === "BOTH",
    mobileOtpEnabled: mode === "MOBILE" || mode === "BOTH",
  };
}
