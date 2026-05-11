import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import SmsServiceConfigInner from '@/components/SmsServiceConfigInner'
import { DEFAULT_SMTP_INSTRUCTIONS } from '@/constants/userCommMailConstants'
import { DEFAULT_TWILIO_INSTRUCTIONS } from '@/constants/userCommTwilioConstants'
import { showErrorToast, showSuccessToast, getApiErrorMessage } from '@/utils/toastUtils'

/** Same POST path as saves (see SMTP test `SMTP_TEST_MAIL`). */
const TWILIO_TEST_SMS_KEY = 'TWILIO_TEST_SMS'

function isPlausiblePhone(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return false
  if (t.startsWith('+')) {
    const compact = t.replace(/[^\d+]/g, '')
    return /^\+\d{10,15}$/.test(compact)
  }
  const digits = t.replace(/\D/g, '')
  return digits.length >= 10
}

const emptyComm = () => ({
  USER_MAIL_HOST: '',
  USER_MAIL_PORT: '',
  USER_MAIL_USERNAME: '',
  USER_MAIL_PASSWORD: '',
  USER_MAIL_SMTP_AUTH: 'true',
  USER_MAIL_SMTP_STARTTLS: 'true',
  USER_TWILIO_ENABLED: 'false',
  USER_TWILIO_ACCOUNT_SID: '',
  USER_TWILIO_AUTH_TOKEN: '',
  USER_TWILIO_FROM_NUMBER: '',
  USER_TWILIO_DEFAULT_COUNTRY_CODE: '+91',
  USER_MAIL_INSTRUCTIONS: '',
  USER_TWILIO_INSTRUCTIONS: '',
})

export default function SmsServiceSettings() {
  const [comm, setComm] = useState(emptyComm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testRecipientPhone, setTestRecipientPhone] = useState('')
  const [testStaticOtp, setTestStaticOtp] = useState('')
  const [testSmsSending, setTestSmsSending] = useState(false)
  const [testSmsFeedback, setTestSmsFeedback] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api
      .get('/admin/user-comm-config')
      .then((commRes) => {
        if (!mounted) return
        setComm((prev) => ({
          ...prev,
          USER_MAIL_HOST: String(commRes?.data?.USER_MAIL_HOST || ''),
          USER_MAIL_PORT: String(commRes?.data?.USER_MAIL_PORT || ''),
          USER_MAIL_USERNAME: String(commRes?.data?.USER_MAIL_USERNAME || ''),
          USER_MAIL_PASSWORD: String(commRes?.data?.USER_MAIL_PASSWORD || ''),
          USER_MAIL_SMTP_AUTH: String(commRes?.data?.USER_MAIL_SMTP_AUTH || 'true'),
          USER_MAIL_SMTP_STARTTLS: String(commRes?.data?.USER_MAIL_SMTP_STARTTLS || 'true'),
          USER_TWILIO_ENABLED: String(commRes?.data?.USER_TWILIO_ENABLED || 'false'),
          USER_TWILIO_ACCOUNT_SID: String(commRes?.data?.USER_TWILIO_ACCOUNT_SID || ''),
          USER_TWILIO_AUTH_TOKEN: String(commRes?.data?.USER_TWILIO_AUTH_TOKEN || ''),
          USER_TWILIO_FROM_NUMBER: String(commRes?.data?.USER_TWILIO_FROM_NUMBER || ''),
          USER_TWILIO_DEFAULT_COUNTRY_CODE: String(commRes?.data?.USER_TWILIO_DEFAULT_COUNTRY_CODE || '+91'),
          USER_MAIL_INSTRUCTIONS: String(commRes?.data?.USER_MAIL_INSTRUCTIONS || DEFAULT_SMTP_INSTRUCTIONS),
          USER_TWILIO_INSTRUCTIONS: String(commRes?.data?.USER_TWILIO_INSTRUCTIONS || DEFAULT_TWILIO_INSTRUCTIONS),
        }))
      })
      .catch((e) => {
        showErrorToast(e?.response?.data?.message || e?.message || 'Failed to load SMS settings')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const mergeCommFromApi = (data) => {
    if (!data || typeof data !== 'object') return
    setComm((prev) => ({
      ...prev,
      USER_MAIL_HOST: String(data.USER_MAIL_HOST ?? ''),
      USER_MAIL_PORT: String(data.USER_MAIL_PORT ?? ''),
      USER_MAIL_USERNAME: String(data.USER_MAIL_USERNAME ?? ''),
      USER_MAIL_PASSWORD: String(data.USER_MAIL_PASSWORD ?? ''),
      USER_MAIL_SMTP_AUTH: String(data.USER_MAIL_SMTP_AUTH ?? prev.USER_MAIL_SMTP_AUTH),
      USER_MAIL_SMTP_STARTTLS: String(data.USER_MAIL_SMTP_STARTTLS ?? prev.USER_MAIL_SMTP_STARTTLS),
      USER_TWILIO_ENABLED: String(data.USER_TWILIO_ENABLED ?? prev.USER_TWILIO_ENABLED),
      USER_TWILIO_ACCOUNT_SID: String(data.USER_TWILIO_ACCOUNT_SID ?? ''),
      USER_TWILIO_AUTH_TOKEN: String(data.USER_TWILIO_AUTH_TOKEN ?? ''),
      USER_TWILIO_FROM_NUMBER: String(data.USER_TWILIO_FROM_NUMBER ?? ''),
      USER_TWILIO_DEFAULT_COUNTRY_CODE: String(data.USER_TWILIO_DEFAULT_COUNTRY_CODE ?? prev.USER_TWILIO_DEFAULT_COUNTRY_CODE),
      USER_MAIL_INSTRUCTIONS: String(data.USER_MAIL_INSTRUCTIONS ?? prev.USER_MAIL_INSTRUCTIONS),
      USER_TWILIO_INSTRUCTIONS: String(data.USER_TWILIO_INSTRUCTIONS ?? prev.USER_TWILIO_INSTRUCTIONS),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.post('/admin/user-comm-config', comm)
      mergeCommFromApi(res.data)
      showSuccessToast('SMS service settings saved.')
    } catch (e) {
      showErrorToast(e?.response?.data?.message || e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleTestSms = async () => {
    const phone = testRecipientPhone.trim()
    if (!isPlausiblePhone(phone)) {
      showErrorToast('Enter a valid phone number (E.164 like +9198XXXXXXXX or at least 10 digits).')
      return
    }
    if (!testStaticOtp.trim()) {
      showErrorToast('Enter a static OTP to include in the test SMS.')
      return
    }
    setTestSmsFeedback(null)
    setTestSmsSending(true)
    try {
      const res = await api.post('/admin/user-comm-config', {
        ...comm,
        [TWILIO_TEST_SMS_KEY]: {
          recipientPhone: phone,
          staticOtp: testStaticOtp.trim(),
        },
      })
      const backendMsg =
        typeof res?.data?.message === 'string' && res.data.message.trim().length > 0
          ? res.data.message.trim()
          : null
      const okText =
        backendMsg ||
        'Test SMS sent successfully. On a Twilio trial, the recipient must be a verified number in Twilio.'
      setTestSmsFeedback({ kind: 'success', text: okText })
      showSuccessToast(okText)
    } catch (e) {
      const errText = getApiErrorMessage(e, 'Test SMS failed')
      setTestSmsFeedback({ kind: 'error', text: errText })
      showErrorToast(errText)
    } finally {
      setTestSmsSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">SMS Service Settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Twilio / SMS configuration — same as{' '}
          <span className="font-medium text-slate-800">User Panel → Authentication → OTP Based → SMS Service</span>.
          Edits here stay in sync with that screen (
          <span className="font-mono text-xs">GET/POST /admin/user-comm-config</span>
          ).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">SMS service configuration (Twilio)</h2>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          <SmsServiceConfigInner comm={comm} setComm={setComm} />

          <details className="mt-6 rounded-lg border border-slate-200 bg-slate-50/90 p-4">
            <summary className="cursor-pointer select-none text-sm font-semibold text-slate-900 outline-none [&::-webkit-details-marker]:hidden">
              <span className="underline decoration-slate-300 underline-offset-2 hover:decoration-slate-400">
                Test SMS configuration (Twilio)
              </span>
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Sends one SMS via the same <span className="font-mono">POST /admin/user-comm-config</span> endpoint as saves
              (test payload only; nothing is persisted). Twilio fields are merged with saved settings on the server; masked
              auth token keeps the saved value.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 sm:col-span-2">
                Recipient phone
                <input
                  type="tel"
                  autoComplete="tel"
                  value={testRecipientPhone}
                  onChange={(e) => setTestRecipientPhone(e.target.value)}
                  placeholder="+9198XXXXXXXX or 10-digit local"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 sm:col-span-2">
                Static OTP (in SMS body)
                <input
                  type="text"
                  inputMode="numeric"
                  value={testStaticOtp}
                  onChange={(e) => setTestStaticOtp(e.target.value)}
                  placeholder="e.g. 123456"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </label>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleTestSms()}
                    disabled={testSmsSending}
                    className="rounded-lg border border-slate-800 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {testSmsSending ? 'Sending…' : 'Send test SMS'}
                  </button>
                </div>
                {testSmsFeedback ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className={
                      testSmsFeedback.kind === 'success'
                        ? 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950'
                        : 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900'
                    }
                  >
                    {testSmsFeedback.text}
                  </div>
                ) : null}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
