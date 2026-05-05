import React, { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'
import { CommField } from '@/components/MailServerConfigInner'
import { USER_COMM_MASK } from '@/constants/userCommMailConstants'
import { DEFAULT_TWILIO_INSTRUCTIONS } from '@/constants/userCommTwilioConstants'

export { DEFAULT_TWILIO_INSTRUCTIONS }

function TwilioInstructionsEditor({ comm, setComm }) {
  const value = comm.USER_TWILIO_INSTRUCTIONS
  const defaultValue = DEFAULT_TWILIO_INSTRUCTIONS
  const [editing, setEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [instructionsDirty, setInstructionsDirty] = useState(false)
  const [savingInstructions, setSavingInstructions] = useState(false)
  const textareaRef = useRef(null)
  const [draft, setDraft] = useState(value || '')

  useEffect(() => {
    if (!editing) setDraft(value || '')
  }, [editing, value])

  const effectiveValue = editing ? draft : value || ''

  const setCommField = (key) => (eOrValue) => {
    const v = typeof eOrValue === 'string' ? eOrValue : eOrValue?.target?.value ?? ''
    setComm((p) => ({ ...p, [key]: v }))
  }

  const commitDraft = () => {
    const next = String(draft ?? '')
    if (next !== String(value ?? '')) {
      setCommField('USER_TWILIO_INSTRUCTIONS')(next)
      setInstructionsDirty(true)
    }
  }

  const resetDraftToSaved = () => {
    setDraft(String(value ?? ''))
  }

  const loadTemplate = () => {
    setDraft(String(defaultValue ?? ''))
  }

  const toggleEdit = () => {
    if (editing) {
      commitDraft()
      setEditing(false)
      return
    }
    setEditing(true)
    queueMicrotask(() => textareaRef.current?.focus?.())
  }

  const handleSaveInstructions = async () => {
    setSavingInstructions(true)
    try {
      const patch = { USER_TWILIO_INSTRUCTIONS: String(comm.USER_TWILIO_INSTRUCTIONS ?? '') }
      const res = await api.post('/admin/user-comm-config', { ...comm, ...patch })
      setComm((prev) => ({
        ...prev,
        USER_MAIL_INSTRUCTIONS: String(res?.data?.USER_MAIL_INSTRUCTIONS ?? prev.USER_MAIL_INSTRUCTIONS ?? ''),
        USER_TWILIO_INSTRUCTIONS: String(res?.data?.USER_TWILIO_INSTRUCTIONS ?? prev.USER_TWILIO_INSTRUCTIONS ?? ''),
      }))
      setInstructionsDirty(false)
      showSuccessToast('Instructions saved.')
    } catch (e) {
      showErrorToast(e?.response?.data?.message || e?.message || 'Failed to save instructions')
    } finally {
      setSavingInstructions(false)
    }
  }

  return (
    <details className="group mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4" open={isOpen}>
      <summary
        className="cursor-pointer select-none list-none marker:hidden [&::-webkit-details-marker]:hidden"
        onClick={(e) => {
          e.preventDefault()
          setIsOpen((o) => !o)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen((o) => !o)
          }
        }}
      >
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
            <p className="text-sm font-medium text-slate-800">Twilio instructions (editable)</p>
          </div>
          <p className="text-xs text-slate-500">Click to {`open / close`}</p>
        </div>
      </summary>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleEdit()
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSaveInstructions()
            }}
            disabled={editing || savingInstructions}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
              instructionsDirty
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
            title="Save only the instructions text"
          >
            {savingInstructions ? 'Saving…' : 'Save instructions'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              resetDraftToSaved()
            }}
            disabled={!editing}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset changes
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              loadTemplate()
            }}
            disabled={!editing}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load template
          </button>
        </div>

        <textarea
          value={effectiveValue}
          ref={textareaRef}
          onChange={editing ? (e) => setDraft(e?.target?.value ?? '') : undefined}
          readOnly={!editing}
          spellCheck={false}
          className={`mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 ${
            editing ? 'bg-white focus:border-slate-400' : 'bg-slate-100/60'
          }`}
          rows={12}
        />
        <p className="mt-2 text-xs text-slate-600">
          Tip: click <span className="font-medium">Done</span> to apply edits, then{' '}
          <span className="font-medium">Save instructions</span> to persist.
        </p>
      </div>
    </details>
  )
}

/**
 * Twilio / SMS fields + instructions — same `/admin/user-comm-config` as Authentication → OTP Based.
 */
export default function SmsServiceConfigInner({ comm, setComm }) {
  const setCommField = (key) => (eOrValue) => {
    const v = typeof eOrValue === 'string' ? eOrValue : eOrValue?.target?.value ?? ''
    setComm((p) => ({ ...p, [key]: v }))
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommField
          label="USER_TWILIO_ENABLED"
          value={comm.USER_TWILIO_ENABLED}
          onChange={setCommField('USER_TWILIO_ENABLED')}
          placeholder="true"
        />
        <CommField
          label="USER_TWILIO_ACCOUNT_SID"
          value={comm.USER_TWILIO_ACCOUNT_SID}
          onChange={setCommField('USER_TWILIO_ACCOUNT_SID')}
          placeholder="AC..."
        />
        <CommField
          label="USER_TWILIO_AUTH_TOKEN"
          value={comm.USER_TWILIO_AUTH_TOKEN}
          onChange={setCommField('USER_TWILIO_AUTH_TOKEN')}
          placeholder={USER_COMM_MASK}
          sensitive
        />
        <CommField
          label="USER_TWILIO_FROM_NUMBER"
          value={comm.USER_TWILIO_FROM_NUMBER}
          onChange={setCommField('USER_TWILIO_FROM_NUMBER')}
          placeholder="+12184004870"
        />
        <CommField
          label="USER_TWILIO_DEFAULT_COUNTRY_CODE"
          value={comm.USER_TWILIO_DEFAULT_COUNTRY_CODE}
          onChange={setCommField('USER_TWILIO_DEFAULT_COUNTRY_CODE')}
          placeholder="+91"
        />
      </div>
      <TwilioInstructionsEditor comm={comm} setComm={setComm} />
    </>
  )
}
