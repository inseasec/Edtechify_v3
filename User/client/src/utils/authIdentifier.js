import { COUNTRY_CODES, DEFAULT_PHONE_COUNTRY_CODE } from "../constants/countryCodes";
import { describeCountryCodeError } from "./phoneCountryValidation";
import {
  formatMobileDisplay,
  formatMobileForApi,
  isValidPhoneForCountry,
  normalizeDigits,
  parsePhonePrefill,
} from "./phoneValidation";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function shouldUsePhoneLayout(mode, { identifier, phoneNational }) {
  if (mode === "MOBILE") return true;
  if (mode === "EMAIL") return false;
  const raw = String(identifier ?? "").trim();
  if (raw.includes("@") || /[a-zA-Z]/.test(raw)) return false;
  const national = normalizeDigits(phoneNational);
  if (national) return true;
  if (!raw) return false;
  return /^\+?\d/.test(raw);
}

export function resolveAuthIdentifier(mode, { identifier, phoneCountryCode, phoneNational }) {
  const emailRaw = String(identifier ?? "").trim();
  const countryCode = String(phoneCountryCode ?? DEFAULT_PHONE_COUNTRY_CODE).trim() || DEFAULT_PHONE_COUNTRY_CODE;
  const national = normalizeDigits(phoneNational);
  const usePhone = shouldUsePhoneLayout(mode, { identifier: emailRaw, phoneNational: national });

  if (usePhone) {
    const ccErr = describeCountryCodeError(countryCode, COUNTRY_CODES);
    const mobileNo = national ? formatMobileForApi(countryCode, national) : "";
    const phoneValid = !ccErr && Boolean(national) && isValidPhoneForCountry(countryCode, national);
    return {
      channel: "mobile",
      email: "",
      mobileNo,
      mobileDisplay: formatMobileDisplay(countryCode, national),
      countryCode,
      national,
      isValid: phoneValid,
      isAllowed: mode === "MOBILE" || mode === "BOTH" || mode === "NORMAL",
      errors: {
        phoneCountryCode: ccErr,
        phoneNational: !national
          ? "Mobile number is required."
          : !ccErr && !phoneValid
            ? "This mobile number doesn’t look valid for the selected country calling code. Check the number length and digits, or verify you picked the right country."
            : null,
      },
    };
  }

  const emailValid = Boolean(emailRaw) && EMAIL_RE.test(emailRaw);
  return {
    channel: "email",
    email: emailRaw.toLowerCase(),
    mobileNo: "",
    mobileDisplay: "",
    countryCode,
    national,
    isValid: emailValid,
    isAllowed: mode === "EMAIL" || mode === "BOTH" || mode === "NORMAL",
    errors: {
      identifier: !emailRaw
        ? mode === "EMAIL"
          ? "Email is required."
          : "Email or mobile number is required."
        : !emailValid
          ? mode === "EMAIL"
            ? "Enter a valid email."
            : "Enter a valid email address."
          : null,
    },
  };
}

export function migrateCombinedInputToPhone(value) {
  const parsed = parsePhonePrefill(value);
  return {
    identifier: "",
    phoneCountryCode: parsed.countryCode,
    phoneNational: parsed.number,
  };
}

export function appendAuthIdentifierErrors(target, resolved, mode) {
  if (!resolved.isValid) {
    if (resolved.channel === "mobile") {
      if (resolved.errors.phoneCountryCode) target.phoneCountryCode = resolved.errors.phoneCountryCode;
      if (resolved.errors.phoneNational) target.phoneNational = resolved.errors.phoneNational;
    } else if (resolved.errors.identifier) {
      target.identifier = resolved.errors.identifier;
    }
    return;
  }

  if (!resolved.isAllowed) {
    if (mode === "EMAIL") {
      target.identifier = "Enter a valid email.";
    } else if (mode === "MOBILE") {
      target.phoneNational = "Enter a valid mobile number.";
    } else {
      target.identifier = "Enter a valid email or mobile number.";
    }
  }
}

export function identifierLabelForMode(mode) {
  if (mode === "EMAIL") return "Email address";
  if (mode === "MOBILE") return "Mobile number";
  return "Email or mobile number";
}

export function identifierPlaceholderForMode(mode) {
  if (mode === "MOBILE") return "Mobile number";
  if (mode === "EMAIL") return "you@company.com";
  return "you@company.com or mobile number";
}
