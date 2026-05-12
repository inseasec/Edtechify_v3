import { useState, useEffect } from 'react'
import { COUNTRY_CODES, DEFAULT_PHONE_COUNTRY_CODE } from '@/constants/countryCodes'
import {
  formatMobileForApi,
  mobileFieldKeys,
  normalizeDigits,
  parsePhonePrefill,
} from '@/utils/phoneMobile'

function applyMobileFieldDefaults(values, fields) {
  const next = { ...values }
  fields.forEach((field) => {
    if (field.type !== 'mobile') return
    const { countryCode, national } = mobileFieldKeys(field.name)
    const parsed = parsePhonePrefill(next[field.name])
    next[countryCode] = parsed.countryCode || DEFAULT_PHONE_COUNTRY_CODE
    next[national] = parsed.number ?? ''
    next[field.name] = String(next[field.name] ?? '')
  })
  return next
}

function normalizeInitials(initialValues, fields) {
  const base = {
    name: '',
    email: '',
    password: '',
    role: '',
    mobileNo: '',
    ...initialValues,
  }
  return applyMobileFieldDefaults(
    { ...base, mobileNo: String(base.mobileNo ?? '') },
    fields,
  )
}

function buildSubmitValues(values, fields) {
  const payload = { ...values }
  fields.forEach((field) => {
    if (field.type !== 'mobile') return
    const { countryCode, national } = mobileFieldKeys(field.name)
    payload[field.name] = formatMobileForApi(payload[countryCode], payload[national])
    delete payload[countryCode]
    delete payload[national]
  })
  return payload
}

export default function ReusableForm({
  initialValues = {},
  fields = [],
  onSubmit,
  onCancel,
  buttonLabel = 'Submit',
  cancelButtonLabel = 'Cancel',
  res,
}) {
  const [values, setValues] = useState(() => normalizeInitials(initialValues, fields))

  useEffect(() => {
    setValues(normalizeInitials(initialValues, fields))
  }, [JSON.stringify(initialValues)])

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form
      className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
      onSubmit={async (e) => {
        e.preventDefault()
        await onSubmit(buildSubmitValues(values, fields))
      }}
    >
      {fields.map((field) => {
        if (field.hide?.(values)) return null

        if (field.type === 'checkbox') {
          return (
            <div key={field.name}>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  disabled={field.readOnly}
                  onChange={(e) => setField(field.name, e.target.checked)}
                />
                <span>{field.label}</span>
              </label>
            </div>
          )
        }

        if (field.type === 'select') {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <select
                value={values[field.name] ?? ''}
                disabled={field.readOnly}
                onChange={(e) => setField(field.name, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-100"
              >
                <option value="">{field.placeholder || 'Select…'}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )
        }

        if (field.type === 'mobile') {
          const { countryCode, national } = mobileFieldKeys(field.name)
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <div className="flex gap-2">
                <select
                  value={values[countryCode] ?? DEFAULT_PHONE_COUNTRY_CODE}
                  disabled={field.readOnly}
                  onChange={(e) => setField(countryCode, e.target.value)}
                  aria-label="Country code"
                  className="w-[180px] shrink-0 border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white disabled:bg-gray-100"
                >
                  {COUNTRY_CODES.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  readOnly={field.readOnly}
                  placeholder={field.placeholder || 'Mobile number'}
                  value={values[national] ?? ''}
                  onChange={(e) => setField(national, normalizeDigits(e.target.value))}
                  className="min-w-0 flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white read-only:bg-gray-50"
                />
              </div>
            </div>
          )
        }

        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              type={field.type || 'text'}
              readOnly={field.readOnly}
              placeholder={field.placeholder}
              value={values[field.name] ?? ''}
              onChange={(e) => setField(field.name, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white read-only:bg-gray-50"
            />
          </div>
        )
      })}

      {res != null && res !== '' && (
        <p className="text-sm text-green-700 break-words">
          {typeof res === 'string' ? res : JSON.stringify(res)}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
          {buttonLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg text-sm font-medium"
        >
          {cancelButtonLabel}
        </button>
      </div>
    </form>
  )
}
