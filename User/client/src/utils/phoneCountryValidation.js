/**
 * User-facing validation message for phone country-code field (launch + profile edit).
 * @param {string} code Raw value from the country-code control
 * @param {Array<{ code: string }>|null} dropdownOptions When set, value must match one entry's `.code`
 * @returns {string|null} Error message or null if the value is acceptable by these rules
 */
export function describeCountryCodeError(code, dropdownOptions = null) {
  const s = String(code ?? "").trim();

  if (!s) {
    return "Please select your country calling code from the dropdown.";
  }
  if (!s.startsWith("+")) {
    return "Country calling codes start with + (for example +91 or +44). Please choose yours from the dropdown.";
  }
  const digits = s.slice(1);
  if (!digits) {
    return "Pick a complete code from the dropdown (for example +91, +1, +44).";
  }
  if (!/^\d+$/.test(digits)) {
    return "Only + and digits are allowed in the country code, with no spaces. Please choose from the dropdown.";
  }
  if (digits.length > 4) {
    return "International dial codes use 1 to 4 digits after +. Please select a supported country from the dropdown.";
  }
  if (dropdownOptions && dropdownOptions.length > 0) {
    const ok = dropdownOptions.some((opt) => (typeof opt === "string" ? opt : opt?.code) === s);
    if (!ok) {
      return "That country calling code isn’t supported here. Please select one of the listed countries.";
    }
  }
  return null;
}
