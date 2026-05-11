import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import MailServerConfigInner from '@/components/MailServerConfigInner'
import SmsServiceConfigInner from '@/components/SmsServiceConfigInner'
import { DEFAULT_SMTP_INSTRUCTIONS } from '@/constants/userCommMailConstants'
import { DEFAULT_TWILIO_INSTRUCTIONS } from '@/constants/userCommTwilioConstants'
import { showErrorToast, showSuccessToast, getApiErrorMessage } from '@/utils/toastUtils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SMTP_TEST_MAIL_KEY = 'SMTP_TEST_MAIL'
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

const MODES = [
  { id: 'NORMAL', label: 'Normal sign up', help: 'Email + password only (no OTP, no mobile).' },
  { id: 'EMAIL', label: 'Email OTP', help: 'Verify with email OTP, then set password.' },
  { id: 'MOBILE', label: 'Mobile OTP', help: 'Verify with mobile OTP (SMS), then set password.' },
  { id: 'BOTH', label: 'Email or Mobile OTP', help: 'User can verify with either email or mobile OTP.' },
]

const IconMail = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5Z"
      opacity="0.08"
    />
    <path
      fill="#EA4335"
      d="M20 7.2 12.7 12.3a1.2 1.2 0 0 1-1.4 0L4 7.2V6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v.6Z"
      opacity="0.18"
    />
    <path
      fill="currentColor"
      d="M6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v10.8A2.6 2.6 0 0 1 17.4 20H6.6A2.6 2.6 0 0 1 4 17.4V6.6A2.6 2.6 0 0 1 6.6 4Zm0 1.6a1 1 0 0 0-1 1v.15l6.6 4.58a.4.4 0 0 0 .46 0L19.4 6.75V6.6a1 1 0 0 0-1-1H6.6Zm12.8 3.08-5.8 4.02a2 2 0 0 1-2.28 0L5.6 8.68v8.72a1 1 0 0 0 1 1h10.8a1 1 0 0 0 1-1V8.68Z"
    />
  </svg>
)

const IconTwilio = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="#F22F46" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
    <circle cx="9" cy="9.2" r="2.2" fill="#fff" />
    <circle cx="15" cy="9.2" r="2.2" fill="#fff" />
    <circle cx="9" cy="14.8" r="2.2" fill="#fff" />
    <circle cx="15" cy="14.8" r="2.2" fill="#fff" />
  </svg>
)

export default function AuthenticationProviders() {
  const [mode, setMode] = useState('BOTH')
  const [comm, setComm] = useState({
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const [smtpTestRecipient, setSmtpTestRecipient] = useState('')
  const [smtpTestSubject, setSmtpTestSubject] = useState('Edukify SMTP test')
  const [smtpTestOtp, setSmtpTestOtp] = useState('')
  const [smtpTestSending, setSmtpTestSending] = useState(false)
  const [smtpTestFeedback, setSmtpTestFeedback] = useState(null)

  const [twilioTestPhone, setTwilioTestPhone] = useState('')
  const [twilioTestOtp, setTwilioTestOtp] = useState('')
  const [twilioTestSending, setTwilioTestSending] = useState(false)
  const [twilioTestFeedback, setTwilioTestFeedback] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([api.get('/admin/signup-auth'), api.get('/admin/user-comm-config')])
      .then(([authRes, commRes]) => {
        if (!mounted) return
        const m = authRes?.data?.mode
        if (typeof m === 'string' && m.trim()) setMode(m.trim().toUpperCase())
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
        setError(null)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e?.response?.data || e?.message || 'Failed to load settings')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const [authRes] = await Promise.all([
        api.post('/admin/signup-auth', { mode }),
        api.post('/admin/user-comm-config', comm),
      ])
      setMessage(`Saved: ${authRes?.data?.mode || mode}`)
    } catch (e) {
      setError(e?.response?.data || e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleTestMail = async () => {
    const to = smtpTestRecipient.trim()
    if (!EMAIL_RE.test(to)) {
      showErrorToast('Enter a valid recipient email address.')
      return
    }
    if (!smtpTestOtp.trim()) {
      showErrorToast('Enter a static OTP to include in the test email body.')
      return
    }
    setSmtpTestFeedback(null)
    setSmtpTestSending(true)
    try {
      const subject = smtpTestSubject.trim() || 'Edukify SMTP test'
      const res = await api.post('/admin/user-comm-config', {
        ...comm,
        [SMTP_TEST_MAIL_KEY]: {
          recipientEmail: to,
          subject,
          staticOtp: smtpTestOtp.trim(),
        },
      })
      const backendMsg =
        typeof res?.data?.message === 'string' && res.data.message.trim().length > 0
          ? res.data.message.trim()
          : null
      const okText =
        backendMsg ||
        'Test email sent successfully. Check the recipient inbox (and spam folder).'
      setSmtpTestFeedback({ kind: 'success', text: okText })
      showSuccessToast(okText)
    } catch (e) {
      const errText = getApiErrorMessage(e, 'Test email failed')
      setSmtpTestFeedback({ kind: 'error', text: errText })
      showErrorToast(errText)
    } finally {
      setSmtpTestSending(false)
    }
  }

  const handleTestSms = async () => {
    const phone = twilioTestPhone.trim()
    if (!isPlausiblePhone(phone)) {
      showErrorToast('Enter a valid phone number (E.164 like +9198XXXXXXXX or at least 10 digits).')
      return
    }
    if (!twilioTestOtp.trim()) {
      showErrorToast('Enter a static OTP to include in the test SMS.')
      return
    }
    setTwilioTestFeedback(null)
    setTwilioTestSending(true)
    try {
      const res = await api.post('/admin/user-comm-config', {
        ...comm,
        [TWILIO_TEST_SMS_KEY]: {
          recipientPhone: phone,
          staticOtp: twilioTestOtp.trim(),
        },
      })
      const backendMsg =
        typeof res?.data?.message === 'string' && res.data.message.trim().length > 0
          ? res.data.message.trim()
          : null
      const okText =
        backendMsg ||
        'Test SMS sent successfully. On a Twilio trial, the recipient must be a verified number in Twilio.'
      setTwilioTestFeedback({ kind: 'success', text: okText })
      showSuccessToast(okText)
    } catch (e) {
      const errText = getApiErrorMessage(e, 'Test SMS failed')
      setTwilioTestFeedback({ kind: 'error', text: errText })
      showErrorToast(errText)
    } finally {
      setTwilioTestSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="relative flex items-start justify-center">
        <h2 className="absolute left-1/2 top-0 -translate-x-1/2 text-lg font-semibold tracking-tight text-slate-900 text-center">
          Authentication Setup Options
        </h2>
      </div>

      {message ? (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{String(error)}</div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6">
        {/* <section className="rounded-xl border border-slate-200 bg-white p-5"> */}
          {/* <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Signup verification</h3>
              <p className="mt-1 text-sm text-slate-600">Choose how users verify their identity while signing up.</p>
            </div>
            {loading ? <span className="text-xs text-slate-500">Loading…</span> : <span className="text-xs text-slate-500">Current: {mode}</span>}
          </div> */}

          <div className="mt-4 grid grid-cols-1 gap-3">
            {MODES.map((m) => {
              const inputId = `signupMode-${m.id}`
              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    mode === m.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      id={inputId}
                      type="radio"
                      name="signupMode"
                      value={m.id}
                      checked={mode === m.id}
                      onChange={() => setMode(m.id)}
                      className="mt-1 h-4 w-4 accent-slate-900"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-7">
                        <label
                          htmlFor={inputId}
                          className="cursor-pointer text-sm font-semibold text-slate-900"
                        >
                          {m.label}
                        </label>
                      {mode === m.id ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            handleSave()
                          }}
                          disabled={loading || saving}
                          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ml-[600px]"
                        >
                          {saving ? 'Saving…' : 'Save changes'}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{m.help}</p>

                    {mode === m.id && (m.id === 'EMAIL' || m.id === 'BOTH') ? (
                      <details className="group mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50/60">
                        <summary className="cursor-pointer select-none list-none marker:hidden [&::-webkit-details-marker]:hidden">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <IconMail />
                              <p className="text-sm font-semibold text-slate-900">Mail Server Configration</p>
                            </div>
                            {/* <span className="text-xs text-slate-500">SMTP</span> */}
                          </div>
                        </summary>

                        <MailServerConfigInner comm={comm} setComm={setComm} />

                        <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50/90 p-4">
                          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-900 outline-none [&::-webkit-details-marker]:hidden">
                            <span className="underline decoration-slate-300 underline-offset-2 hover:decoration-slate-400">
                              Test mail configuration
                            </span>
                          </summary>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            Same as{' '}
                            <span className="font-mono">POST /admin/user-comm-config</span> test payload; nothing is saved.
                            Masked SMTP password uses the stored value.
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 sm:col-span-2">
                              Recipient email
                              <input
                                type="email"
                                autoComplete="email"
                                value={smtpTestRecipient}
                                onChange={(e) => setSmtpTestRecipient(e.target.value)}
                                placeholder="you@example.com"
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                              Subject
                              <input
                                type="text"
                                value={smtpTestSubject}
                                onChange={(e) => setSmtpTestSubject(e.target.value)}
                                placeholder="Edukify SMTP test"
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                              Static OTP (in email body)
                              <input
                                type="text"
                                value={smtpTestOtp}
                                onChange={(e) => setSmtpTestOtp(e.target.value)}
                                placeholder="e.g. 123456"
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              />
                            </label>
                            <div className="flex flex-col gap-2 sm:col-span-2">
                              <button
                                type="button"
                                onClick={() => handleTestMail()}
                                disabled={smtpTestSending}
                                className="w-fit rounded-lg border border-slate-800 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {smtpTestSending ? 'Sending…' : 'Send test email'}
                              </button>
                              {smtpTestFeedback ? (
                                <div
                                  role="status"
                                  aria-live="polite"
                                  className={
                                    smtpTestFeedback.kind === 'success'
                                      ? 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950'
                                      : 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900'
                                  }
                                >
                                  {smtpTestFeedback.text}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </details>
                      </details>
                    ) : null}

                    {mode === m.id && (m.id === 'MOBILE' || m.id === 'BOTH') ? (
                      <details className="group mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50/60">
                        <summary className="cursor-pointer select-none list-none marker:hidden [&::-webkit-details-marker]:hidden">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <IconTwilio />
                              <p className="text-sm font-semibold text-slate-900">SMS Service Configration</p>
                            </div>
                            {/* <span className="text-xs text-slate-500">Twilio</span> */}
                          </div>
                        </summary>

                        <SmsServiceConfigInner comm={comm} setComm={setComm} />

                        <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50/90 p-4">
                          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-900 outline-none [&::-webkit-details-marker]:hidden">
                            <span className="underline decoration-slate-300 underline-offset-2 hover:decoration-slate-400">
                              Test SMS configuration (Twilio)
                            </span>
                          </summary>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            Same as{' '}
                            <span className="font-mono">POST /admin/user-comm-config</span> test payload; nothing is saved.
                            Masked auth token uses the stored value.
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 sm:col-span-2">
                              Recipient phone
                              <input
                                type="tel"
                                autoComplete="tel"
                                value={twilioTestPhone}
                                onChange={(e) => setTwilioTestPhone(e.target.value)}
                                placeholder="+9198XXXXXXXX or 10-digit local"
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 sm:col-span-2">
                              Static OTP (in SMS body)
                              <input
                                type="text"
                                inputMode="numeric"
                                value={twilioTestOtp}
                                onChange={(e) => setTwilioTestOtp(e.target.value)}
                                placeholder="e.g. 123456"
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              />
                            </label>
                            <div className="flex flex-col gap-2 sm:col-span-2">
                              <button
                                type="button"
                                onClick={() => handleTestSms()}
                                disabled={twilioTestSending}
                                className="w-fit rounded-lg border border-slate-800 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {twilioTestSending ? 'Sending…' : 'Send test SMS'}
                              </button>
                              {twilioTestFeedback ? (
                                <div
                                  role="status"
                                  aria-live="polite"
                                  className={
                                    twilioTestFeedback.kind === 'success'
                                      ? 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950'
                                      : 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900'
                                  }
                                >
                                  {twilioTestFeedback.text}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </details>
                      </details>
                    ) : null}

                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        {/* </section> */}
      </div>
    </div>
  )
}

