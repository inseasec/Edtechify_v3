import { COUNTRY_CODES, DEFAULT_PHONE_COUNTRY_CODE } from '@/constants/countryCodes'

const COUNTRY_CODES_BY_LENGTH = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)

export function normalizeDigits(value) {
  return String(value ?? '').replace(/[^\d]/g, '')
}

function matchCountryCodeFromDialDigits(dialDigits) {
  for (const row of COUNTRY_CODES_BY_LENGTH) {
    const ccDigits = row.code.slice(1)
    if (dialDigits.startsWith(ccDigits)) {
      const number = dialDigits.slice(ccDigits.length)
      if (number.length > 0) {
        return { countryCode: row.code, number }
      }
    }
  }
  return null
}

export function parsePhonePrefill(rawPhone) {
  const raw = String(rawPhone ?? '').trim()
  if (!raw) {
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: '' }
  }

  const compact = raw.replace(/[^\d+]/g, '')
  if (compact.startsWith('+')) {
    const matched = matchCountryCodeFromDialDigits(compact.slice(1))
    if (matched) return matched
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: normalizeDigits(compact) }
  }

  const digits = normalizeDigits(compact)
  if (!digits) {
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: '' }
  }

  const matched = matchCountryCodeFromDialDigits(digits)
  if (matched) return matched

  return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: digits }
}

export function formatMobileForApi(countryCode, nationalDigits) {
  const cc = String(countryCode ?? '').trim()
  const normalizedCc = cc.startsWith('+') ? cc : `+${cc}`
  const digits = normalizeDigits(nationalDigits)
  if (!digits) return ''
  return `${normalizedCc}${digits}`
}

export function mobileFieldKeys(name) {
  return {
    countryCode: `${name}CountryCode`,
    national: `${name}National`,
  }
}
