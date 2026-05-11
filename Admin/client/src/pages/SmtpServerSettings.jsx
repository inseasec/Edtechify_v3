import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import MailServerConfigInner from '@/components/MailServerConfigInner'
import { DEFAULT_SMTP_INSTRUCTIONS } from '@/constants/userCommMailConstants'
import { showErrorToast, showSuccessToast, getApiErrorMessage } from '@/utils/toastUtils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Same POST path as saves so reverse proxies only allowlisting `/admin/user-comm-config` still work. */
const SMTP_TEST_MAIL_KEY = 'SMTP_TEST_MAIL'

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

export default function SmtpServerSettings() {
  const [comm, setComm] = useState(emptyComm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testRecipient, setTestRecipient] = useState('')
  const [testSubject, setTestSubject] = useState('Edukify SMTP test')
  const [testStaticOtp, setTestStaticOtp] = useState('')
  const [testSending, setTestSending] = useState(false)
  /** Inline feedback in the test section (toast can be easy to miss). */
  const [testMailFeedback, setTestMailFeedback] = useState(null)

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
          USER_TWILIO_INSTRUCTIONS: String(commRes?.data?.USER_TWILIO_INSTRUCTIONS || ''),
        }))
      })
      .catch((e) => {
        showErrorToast(e?.response?.data?.message || e?.message || 'Failed to load SMTP settings')
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
      showSuccessToast('SMTP settings saved.')
    } catch (e) {
      showErrorToast(e?.response?.data?.message || e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleTestMail = async () => {
    const to = testRecipient.trim()
    if (!EMAIL_RE.test(to)) {
      showErrorToast('Enter a valid recipient email address.')
      return
    }
    if (!testStaticOtp.trim()) {
      showErrorToast('Enter a static OTP to include in the test email body.')
      return
    }
    setTestMailFeedback(null)
    setTestSending(true)
    try {
      const subject = testSubject.trim() || 'Edukify SMTP test'
      const res = await api.post('/admin/user-comm-config', {
        ...comm,
        [SMTP_TEST_MAIL_KEY]: {
          recipientEmail: to,
          subject,
          staticOtp: testStaticOtp.trim(),
        },
      })
      const backendMsg =
        typeof res?.data?.message === 'string' && res.data.message.trim().length > 0
          ? res.data.message.trim()
          : null
      const okText =
        backendMsg ||
        'Test email sent successfully. Check the recipient inbox (and spam folder).'
      setTestMailFeedback({ kind: 'success', text: okText })
      showSuccessToast(okText)
    } catch (e) {
      const errText = getApiErrorMessage(e, 'Test email failed')
      setTestMailFeedback({ kind: 'error', text: errText })
      showErrorToast(errText)
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">SMTP Server Settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Same mail server configuration as{' '}
          <span className="font-medium text-slate-800">User Panel → Authentication → OTP Based → Mail Server</span>.
          Changes here appear there and vice versa (
          <span className="font-mono text-xs">GET/POST /admin/user-comm-config</span>
          ).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Mail server configuration</h2>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          <MailServerConfigInner comm={comm} setComm={setComm} />

          <details className="mt-6 rounded-lg border border-slate-200 bg-slate-50/90 p-4">
            <summary className="cursor-pointer select-none text-sm font-semibold text-slate-900 outline-none [&::-webkit-details-marker]:hidden">
              <span className="underline decoration-slate-300 underline-offset-2 hover:decoration-slate-400">
                Test mail configuration
              </span>
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Sends one message via the same <span className="font-mono">POST /admin/user-comm-config</span> endpoint as saves
              (test payload only; nothing is persisted). SMTP fields are merged with saved settings on the server; leaving
              the password masked uses the saved password.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 sm:col-span-2">
                Recipient email
                <input
                  type="email"
                  autoComplete="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                Subject
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  placeholder="Edukify SMTP test"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                Static OTP (in email body)
                <input
                  type="text"
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
                    onClick={() => handleTestMail()}
                    disabled={testSending}
                    className="rounded-lg border border-slate-800 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {testSending ? 'Sending…' : 'Send test email'}
                  </button>
                </div>
                {testMailFeedback ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className={
                      testMailFeedback.kind === 'success'
                        ? 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950'
                        : 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900'
                    }
                  >
                    {testMailFeedback.text}
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
