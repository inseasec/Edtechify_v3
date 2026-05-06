import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import api from '@/lib/api'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'

const TEAM_ADD_PATH = '/organizations/team/add'
const TEAM_DELETE_PATH = '/organizations/team'
const OWNER_ADD_PATH = '/organizations/owner/add'
const OWNER_DELETE_PATH = '/organizations/owner'
const OWNER_SELECT_PATH = '/organizations/owner/select'

const baseUrl = window._CONFIG_.VITE_API_BASE_URL

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

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  )
}

export default function UserPanelAboutV2() {
  const ctx = useOutletContext()
  const {
    formData = {},
    handleTextChange,
    setFiles,
    files = {},
    isLoading,
    saving,
    fetchAllData,
    baseUrl: ctxBaseUrl,
  } = ctx ?? {}

  const effectiveBaseUrl = (ctxBaseUrl ?? baseUrl)?.replace(/\/$/, '') ?? ''

  const teamFileInputRef = useRef(null)
  const directorImgInputRef = useRef(null)
  const ownerFileInputRef = useRef(null)

  const [teamBusy, setTeamBusy] = useState(false)
  const [directorPreviewUrl, setDirectorPreviewUrl] = useState(null)
  const [selectedDirectorFile, setSelectedDirectorFile] = useState(null)
  const [ownerBusy, setOwnerBusy] = useState(false)
  const [ownerPhotoModalOpen, setOwnerPhotoModalOpen] = useState(false)

  const teamImages = useMemo(() => {
    const raw = formData?.orgTeamGallery?.teamImages
    return Array.isArray(raw) ? raw : []
  }, [formData?.orgTeamGallery?.teamImages])

  const ownerImages = useMemo(() => {
    const raw = formData?.orgDirectorDetail?.ownerImages
    return Array.isArray(raw) ? raw : []
  }, [formData?.orgDirectorDetail?.ownerImages])

  const directorImagePath = formData?.orgDirectorDetail?.directorImage ?? null
  useEffect(() => {
    if (!selectedDirectorFile) {
      setDirectorPreviewUrl(directorImagePath ? orgAssetUrl(directorImagePath, effectiveBaseUrl) : null)
      return
    }
    const name = String(selectedDirectorFile?.name ?? '').toLowerCase()
    const isHeif = name.endsWith('.heic') || name.endsWith('.heif') || name.endsWith('.avif')
    // Browsers typically can't preview HEIC locally. Keep showing the saved image until after upload+save.
    if (isHeif) {
      setDirectorPreviewUrl(directorImagePath ? orgAssetUrl(directorImagePath, effectiveBaseUrl) : null)
      return
    }
    const url = URL.createObjectURL(selectedDirectorFile)
    setDirectorPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedDirectorFile, directorImagePath, effectiveBaseUrl])

  const onText = useCallback(
    (name) => (e) => handleTextChange?.({ target: { name, value: e.target.value } }),
    [handleTextChange],
  )

  const onDirectorImage = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const isImageMime = Boolean(f.type?.startsWith?.('image/'))
    // Some browsers (esp. on Windows) may not report a mime for HEIC/HEIF; allow by extension.
    const name = String(f.name ?? '').toLowerCase()
    const hasImageExt = /\.(png|jpe?g|webp|gif|bmp|tiff?|heic|heif|avif|svg)$/i.test(name)
    if (!isImageMime && !hasImageExt) {
      showErrorToast('Please upload an image file.')
      return
    }
    if (name.endsWith('.heic') || name.endsWith('.heif') || name.endsWith('.avif')) {
      showSuccessToast('Selected HEIC/HEIF. Preview will update after you click Update (server converts it to JPG/PNG).')
    }
    setSelectedDirectorFile(f)
    setFiles?.((prev) => ({ ...prev, directorImage: f }))
  }

  const uploadOwnerImage = async (file) => {
    if (!file) return false
    const fd = new FormData()
    fd.append('image', file)
    try {
      await api.post(OWNER_ADD_PATH, fd, multipartConfig())
      return true
    } catch (err) {
      console.error(err)
      showErrorToast(err?.response?.data?.message ?? 'Upload failed')
      return false
    }
  }

  const handleOwnerFiles = async (e) => {
    const list = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!list.length) return
    setOwnerBusy(true)
    let ok = 0
    for (const f of list) {
      // eslint-disable-next-line no-await-in-loop
      const did = await uploadOwnerImage(f)
      if (did) ok += 1
    }
    await fetchAllData?.()
    setOwnerBusy(false)
    if (ok) showSuccessToast(`${ok} owner photo(s) added`)
  }

  const removeOwnerImage = async (imagePath) => {
    if (!imagePath) return
    if (!window.confirm('Remove this owner photo?')) return
    try {
      await api.delete(OWNER_DELETE_PATH, { params: { imagePath } })
      await fetchAllData?.()
      showSuccessToast('Owner photo removed')
    } catch (err) {
      console.error(err)
      showErrorToast(err?.response?.data?.message ?? 'Could not remove photo')
    }
  }

  const selectOwnerImage = async (imagePath) => {
    if (!imagePath) return
    try {
      await api.put(OWNER_SELECT_PATH, null, { params: { imagePath } })
      await fetchAllData?.()
      showSuccessToast('Owner photo selected')
    } catch (err) {
      console.error(err)
      showErrorToast(err?.response?.data?.message ?? 'Could not select photo')
    }
  }

  const uploadTeamImage = async (file) => {
    if (!file || !file.type?.startsWith?.('image/')) return false
    const fd = new FormData()
    fd.append('image', file)
    try {
      await api.post(TEAM_ADD_PATH, fd, multipartConfig())
      return true
    } catch (err) {
      console.error(err)
      showErrorToast(err?.response?.data?.message ?? 'Upload failed')
      return false
    }
  }

  const handleTeamFiles = async (e) => {
    const list = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!list.length) return

    setTeamBusy(true)
    let ok = 0
    for (const f of list) {
      // sequential prevents backend serial collisions
      // eslint-disable-next-line no-await-in-loop
      const did = await uploadTeamImage(f)
      if (did) ok += 1
    }
    await fetchAllData?.()
    setTeamBusy(false)
    if (ok) showSuccessToast(`${ok} team photo(s) added`)
  }

  const removeTeamImage = async (imagePath) => {
    if (!imagePath) return
    if (!window.confirm('Remove this team photo?')) return
    try {
      await api.delete(TEAM_DELETE_PATH, { params: { imagePath } })
      await fetchAllData?.()
      showSuccessToast('Photo removed')
    } catch (err) {
      console.error(err)
      showErrorToast(err?.response?.data?.message ?? 'Could not remove photo')
    }
  }

  if (!ctx) {
    return (
      <div className="px-4 py-8 text-center text-sm text-amber-800">
        Open <strong>User Panel → About</strong> so this page loads inside the User Panel layout.
      </div>
    )
  }

  return (
    <div className="px-4 py-8 md:px-6">
      {(isLoading || saving) && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {saving ? 'Saving…' : 'Loading…'}
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-8">
        {/* Company & leadership */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">Company & leadership</h2>
          <p className="mt-1 text-sm text-slate-600">Owner + parent company blocks as shown on the public About page.</p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">About the owner</p>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <Input label="Name" name="orgDirectorDetail.directorName" value={formData?.orgDirectorDetail?.directorName ?? ''} onChange={onText('orgDirectorDetail.directorName')} />
                <Input label="Role" name="orgDirectorDetail.role" value={formData?.orgDirectorDetail?.role ?? ''} onChange={onText('orgDirectorDetail.role')} />
                <Input
                  label="Social profile URL"
                  name="orgDirectorDetail.socialUrl"
                  value={formData?.orgDirectorDetail?.socialUrl ?? ''}
                  onChange={onText('orgDirectorDetail.socialUrl')}
                  placeholder="https://instagram.com/..."
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Director image</label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {directorPreviewUrl ? (
                        <img src={directorPreviewUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOwnerPhotoModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      <Upload className="h-4 w-4" />
                      Edit photo
                    </button>
                    <input
                      ref={directorImgInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onDirectorImage}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Owner photo library</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={ownerBusy}
                      onClick={() => ownerFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Add owner photos
                    </button>
                    <input
                      ref={ownerFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleOwnerFiles}
                    />
                    <span className="text-xs text-slate-500">
                      Uploads are stored under <code className="rounded bg-slate-100 px-1">OrgData/Owner</code>.
                    </span>
                  </div>
                  {ownerImages.length ? (
                    <ul className="mt-3 grid list-none grid-cols-4 gap-2">
                      {ownerImages.map((p, idx) => {
                        const src = orgAssetUrl(p, effectiveBaseUrl)
                        const active = p === directorImagePath
                        return (
                          <li key={`${p}-${idx}`} className="relative">
                            <button
                              type="button"
                              onClick={() => selectOwnerImage(p)}
                              title={active ? 'Active' : 'Set as active'}
                              className={`block w-full overflow-hidden rounded-xl border ${active ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-sky-300'} bg-white`}
                            >
                              <img src={src} alt="" className="aspect-square w-full object-cover" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeOwnerImage(p)}
                              className="absolute right-1 top-1 rounded-full bg-white/95 p-1 text-red-600 shadow ring-1 ring-red-100 hover:bg-red-50"
                              title="Remove"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No saved owner photos yet.</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Owner bio</label>
                  <textarea
                    name="orgDirectorDetail.aboutDirector"
                    value={formData?.orgDirectorDetail?.aboutDirector ?? ''}
                    onChange={onText('orgDirectorDetail.aboutDirector')}
                    rows={8}
                    className="w-full rounded-2xl border-2 border-gray-300 p-4 outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Write owner bio..."
                  />
                </div>

                {ownerPhotoModalOpen ? (
                  <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={() => setOwnerPhotoModalOpen(false)}
                  >
                    <div
                      className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-semibold text-slate-900">Edit owner photo</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Upload a new photo, or choose from previously uploaded ones.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOwnerPhotoModalOpen(false)
                            directorImgInputRef.current?.click()
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                        >
                          <Upload className="h-4 w-4" />
                          Upload new (active)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOwnerPhotoModalOpen(false)
                            // library is right below; scroll into view
                            setTimeout(() => {
                              ownerFileInputRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
                            }, 0)
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Choose existing
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOwnerPhotoModalOpen(false)}
                        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Parent company</p>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <Input label="Company name" name="orgParentCompany.name" value={formData?.orgParentCompany?.name ?? ''} onChange={onText('orgParentCompany.name')} />
                <Input label="Website URL" name="orgParentCompany.websiteUrl" value={formData?.orgParentCompany?.websiteUrl ?? ''} onChange={onText('orgParentCompany.websiteUrl')} />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="orgParentCompany.description"
                    value={formData?.orgParentCompany?.description ?? ''}
                    onChange={onText('orgParentCompany.description')}
                    rows={8}
                    className="w-full rounded-2xl border-2 border-gray-300 p-4 outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Write parent company description..."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">What your organization stands for</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Vision</p>
              <textarea
                name="orgAboutUs.vision"
                value={formData?.orgAboutUs?.vision ?? ''}
                onChange={onText('orgAboutUs.vision')}
                rows={6}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Mission</p>
              <textarea
                name="orgAboutUs.mission"
                value={formData?.orgAboutUs?.mission ?? ''}
                onChange={onText('orgAboutUs.mission')}
                rows={6}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Values</p>
              <textarea
                name="orgAboutUs.orgValues"
                value={formData?.orgAboutUs?.orgValues ?? ''}
                onChange={onText('orgAboutUs.orgValues')}
                rows={6}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Our Team</h2>
              <p className="mt-1 text-sm text-slate-600">Uploads appear on public About + Our Team page.</p>
            </div>
            <button
              type="button"
              disabled={teamBusy}
              onClick={() => teamFileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
            >
              <ImagePlus className="h-4 w-4" />
              Add photos
            </button>
            <input ref={teamFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleTeamFiles} />
          </div>

          {teamImages.length ? (
            <ul className="mt-6 grid list-none grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {teamImages.map((imgPath, i) => (
                <li key={`${imgPath}-${i}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img src={orgAssetUrl(imgPath, effectiveBaseUrl)} alt="" className="aspect-[4/3] w-full object-cover" />
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
            <p className="mt-6 text-sm text-slate-500">No team photos yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

