import React from "react";
import { COUNTRY_CODES, DEFAULT_PHONE_COUNTRY_CODE } from "../constants/countryCodes";
import {
  identifierLabelForMode,
  identifierPlaceholderForMode,
  migrateCombinedInputToPhone,
  shouldUsePhoneLayout,
} from "../utils/authIdentifier";
import { normalizeDigits } from "../utils/phoneValidation";

const inputBase =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-gray-50";
const inputError = "border-red-400 focus:border-red-500 focus:ring-red-100";
const selectBase =
  "h-11 w-[180px] shrink-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-gray-50";

export default function AuthIdentifierFields({
  mode = "BOTH",
  identifier = "",
  phoneCountryCode = DEFAULT_PHONE_COUNTRY_CODE,
  phoneNational = "",
  onIdentifierChange,
  onPhoneCountryCodeChange,
  onPhoneNationalChange,
  disabled = false,
  readOnly = false,
  readOnlyValue = "",
  errors = {},
  autoComplete = "username",
}) {
  const usePhone = shouldUsePhoneLayout(mode, { identifier, phoneNational });
  const label = identifierLabelForMode(mode);

  const handleCombinedChange = (e) => {
    const value = e.target.value;
    if (mode === "MOBILE") return;
    if (mode === "EMAIL") {
      onIdentifierChange?.(value);
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      onIdentifierChange?.("");
      onPhoneNationalChange?.("");
      return;
    }
    if (trimmed.includes("@") || /[a-zA-Z]/.test(trimmed)) {
      onIdentifierChange?.(value);
      onPhoneNationalChange?.("");
      return;
    }
    if (/^\+?\d/.test(trimmed)) {
      const migrated = migrateCombinedInputToPhone(trimmed);
      onIdentifierChange?.(migrated.identifier);
      onPhoneCountryCodeChange?.(migrated.phoneCountryCode);
      onPhoneNationalChange?.(migrated.phoneNational);
      return;
    }
    onIdentifierChange?.(value);
  };

  if (readOnly) {
    return (
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <ReadOnlyInput value={readOnlyValue} autoComplete={autoComplete} />
      </div>
    );
  }

  if (usePhone) {
    return (
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-2 flex gap-2">
          <select
            className={`${selectBase} ${errors.phoneCountryCode ? inputError : ""}`}
            value={phoneCountryCode}
            onChange={(e) => onPhoneCountryCodeChange?.(e.target.value)}
            disabled={disabled}
            aria-label="Country code"
            aria-invalid={Boolean(errors.phoneCountryCode)}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            className={`${inputBase} flex-1 ${errors.phoneNational ? inputError : ""}`}
            value={phoneNational}
            onChange={(e) => onPhoneNationalChange?.(normalizeDigits(e.target.value))}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Mobile number"
            disabled={disabled}
            autoComplete={autoComplete}
            aria-label="Mobile number"
            aria-invalid={Boolean(errors.phoneNational)}
          />
        </div>
        {errors.phoneCountryCode ? (
          <p className="mt-2 text-sm text-red-600">{errors.phoneCountryCode}</p>
        ) : null}
        {errors.phoneNational ? (
          <p className="mt-2 text-sm text-red-600">{errors.phoneNational}</p>
        ) : (
          <p className="mt-2 text-xs text-gray-500">Digits only. We validate by country.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative mt-2">
        <input
          className={`${inputBase} ${errors.identifier ? inputError : ""}`}
          value={identifier}
          onChange={handleCombinedChange}
          type="text"
          autoComplete={autoComplete}
          placeholder={identifierPlaceholderForMode(mode)}
          disabled={disabled}
          aria-invalid={Boolean(errors.identifier)}
        />
      </div>
      {errors.identifier ? <p className="mt-2 text-sm text-red-600">{errors.identifier}</p> : null}
    </div>
  );
}

function ReadOnlyInput({ value, autoComplete }) {
  return (
    <div className="relative mt-2">
      <input
        className={`${inputBase} bg-gray-50`}
        value={value}
        type="text"
        autoComplete={autoComplete}
        disabled
        readOnly
      />
    </div>
  );
}
