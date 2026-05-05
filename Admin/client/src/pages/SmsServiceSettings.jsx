import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import SmsServiceConfigInner from '@/components/SmsServiceConfigInner'
import { DEFAULT_SMTP_INSTRUCTIONS } from '@/constants/userCommMailConstants'
import { DEFAULT_TWILIO_INSTRUCTIONS } from '@/constants/userCommTwilioConstants'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'

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
        </div>
      )}
    </div>
  )
}
