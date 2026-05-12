import { parsePhoneNumberFromString } from "libphonenumber-js";
import { COUNTRY_CODES, DEFAULT_PHONE_COUNTRY_CODE } from "../constants/countryCodes";

export function normalizeDigits(s) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

export function isValidE164CountryCode(code) {
  const c = String(code ?? "").trim();
  return /^\+\d{1,4}$/.test(c);
}

export function isoForCountryCode(code) {
  const c = String(code ?? "").trim();
  const row = COUNTRY_CODES.find((x) => x.code === c && x.iso);
  return row?.iso || null;
}

const COUNTRY_CODES_BY_LENGTH = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

function matchCountryCodeFromDialDigits(dialDigits) {
  for (const row of COUNTRY_CODES_BY_LENGTH) {
    const ccDigits = row.code.slice(1);
    if (dialDigits.startsWith(ccDigits)) {
      const number = dialDigits.slice(ccDigits.length);
      if (number.length > 0) {
        return { countryCode: row.code, number };
      }
    }
  }
  return null;
}

export function nationalDigitsForCountry(countryCode, nationalDigits) {
  const cc = String(countryCode ?? "").trim();
  let digits = normalizeDigits(nationalDigits);
  if (!isValidE164CountryCode(cc) || !digits) return digits;

  const ccDigits = cc.slice(1);
  if (digits.startsWith(ccDigits) && digits.length > ccDigits.length) {
    const withoutPrefix = digits.slice(ccDigits.length);
    if (isValidPhoneForCountry(cc, withoutPrefix, { skipPrefixStrip: true })) {
      return withoutPrefix;
    }
  }
  return digits;
}

export function isValidPhoneForCountry(code, digits, options = {}) {
  const cc = String(code ?? "").trim();
  const d = options.skipPrefixStrip ? normalizeDigits(digits) : nationalDigitsForCountry(cc, digits);
  if (!isValidE164CountryCode(cc)) return false;
  if (!d) return false;

  const iso = isoForCountryCode(cc);
  try {
    const pn = parsePhoneNumberFromString(`${cc}${d}`, iso || undefined);
    if (pn) return pn.isValid();
  } catch {
    // ignore
  }

  if (iso) return false;
  return d.length >= 6 && d.length <= 15;
}

export function parsePhonePrefill(rawPhone) {
  const raw = String(rawPhone ?? "").trim();
  if (!raw) {
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: "" };
  }

  const compact = raw.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) {
    const matched = matchCountryCodeFromDialDigits(compact.slice(1));
    if (matched) return matched;
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: normalizeDigits(compact) };
  }

  const digits = normalizeDigits(compact);
  if (!digits) {
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: "" };
  }

  const matched = matchCountryCodeFromDialDigits(digits);
  if (matched && isValidPhoneForCountry(matched.countryCode, matched.number)) {
    return matched;
  }

  return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: digits };
}

export function formatMobileForApi(countryCode, nationalDigits) {
  const cc = String(countryCode ?? "").trim();
  const normalizedCc = cc.startsWith("+") ? cc : `+${cc}`;
  const digits = nationalDigitsForCountry(normalizedCc, nationalDigits);
  if (!digits) return normalizedCc;

  try {
    const pn = parsePhoneNumberFromString(
      `${normalizedCc}${digits}`,
      isoForCountryCode(normalizedCc) || undefined,
    );
    if (pn?.isValid()) return pn.format("E.164");
  } catch {
    // ignore
  }

  return `${normalizedCc}${digits}`;
}

export function formatMobileDisplay(countryCode, nationalDigits) {
  const cc = String(countryCode ?? "").trim();
  const digits = nationalDigitsForCountry(cc, nationalDigits);
  if (!digits) return cc;
  return `${cc} ${digits}`;
}
