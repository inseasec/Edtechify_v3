import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'

const TEAM_ADD_PATH = '/organizations/team/add'
const TEAM_DELETE_PATH = '/organizations/team'

const baseUrl = window._CONFIG_.VITE_API_BASE_URL

/** Stored paths are usually `OrgData/...`; match public site `orgMediaUrl` behaviour. */
function orgAssetUrl(filename, apiBase) {
  const b = String(apiBase ?? baseUrl ?? '').replace(/\/$/, '')
  if (!filename || typeof filename !== 'string') return ''
  const path = filename.replace(/^\/+/, '')
  if (path.startsWith('OrgData/')) return `${b}/${path}`
  if (path.includes('course-images')) return `${b}/${path}`
  return `${b}/course-images/${path}`
}

function multipartConfig() {
  return {
    transformRequest: [
      (body, headers) => {
        if (body instanceof FormData) {
          delete headers['Content-Type']
        }
        return body
      },
    ],
  }
}

export default function UserPanelMyTeam() {
  const teamFileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [existingTeamImages, setExistingTeamImages] = useState([])

  const effectiveBaseUrl = String(baseUrl ?? '').replace(/\/$/, '')

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/organizations/details')
      const data = res.data?.data ?? res.data
      const oteam = data?.orgTeamGallery ?? {}
      const tImgs = oteam.teamImages ?? []
      setExistingTeamImages(Array.isArray(tImgs) ? [...tImgs] : [])
    } catch (err) {
      console.error(err)
      showErrorToast(err?.response?.data?.message ?? err?.response?.data ?? 'Could not load organization')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  const uploadTeamImage = async (file) => {
    if (!file || !file.type?.startsWith?.('image/')) return
    const fd = new FormData()
    fd.append('image', file)
    try {
      await api.post(TEAM_ADD_PATH, fd, multipartConfig())
      return true
    } catch (error) {
      console.error(error)
      showErrorToast(error?.response?.data?.message ?? 'Upload failed')
      return false
    }
  }

  const handleTeamFileChange = async (e) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setLoading(true)
    let ok = 0
    for (const f of files) {
      // Sequential uploads prevent duplicate serial assignment on backend.
      // (Backend currently picks nextSerial based on current DB list.)
      // eslint-disable-next-line no-await-in-loop
      const did = await uploadTeamImage(f)
      if (did) ok += 1
    }
    await loadDetails()
    setLoading(false)
    if (ok > 0) showSuccessToast(`${ok} team photo(s) added`)
  }

  const removeTeamImage = async (imagePath) => {
    if (!imagePath) return
    if (!window.confirm('Remove this team photo (About page and public /our-team)?')) return
    try {
      await api.delete(TEAM_DELETE_PATH, { params: { imagePath } })
      showSuccessToast('Photo removed')
      await loadDetails()
    } catch (error) {
      console.error(error)
      showErrorToast(error?.response?.data?.message ?? 'Could not remove photo')
    }
  }

  return (
    <div className="-mx-6 -mb-6 min-h-0 bg-white text-gray-900">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-10">
          <input
            ref={teamFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleTeamFileChange}
          />

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team photos</h1>
              <p className="mt-2 text-sm text-slate-600">
                Upload multiple images. These show on public <strong>Our Team</strong> and the end of the{' '}
                <strong>About us</strong> page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => teamFileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              <ImagePlus className="h-4 w-4" aria-hidden />
              Add photos
            </button>
          </div>

          {existingTeamImages.length > 0 ? (
            <ul className="mt-8 grid list-none grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {existingTeamImages.map((imgPath, i) => (
                <li
                  key={`${imgPath}-${i}`}
                  className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
                >
                  <img
                    src={orgAssetUrl(imgPath, effectiveBaseUrl)}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => removeTeamImage(imgPath)}
                    className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-red-600 shadow-md ring-1 ring-red-100 transition hover:bg-red-50"
                    title="Remove photo"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-center text-sm text-gray-500">No team photos yet—add some above.</p>
          )}
        </div>
      )}
    </div>
  )
}

