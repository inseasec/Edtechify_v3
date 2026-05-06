import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'
import {
  HOME_HERO_TITLE_LIVE_DEFAULT,
  HOME_HERO_SUBTITLE_LIVE_DEFAULT,
  HOME_TRUST_STRIP_LIVE_DEFAULT,
  HOME_OFFERINGS_INTRO_LIVE_DEFAULT,
} from '@user-site/constants/homePageLiveDefaults.js'

const ORG_DETAILS_PATH = '/organizations/details'
const ORG_SAVE_PATH = '/organizations/addUpdateDetails'

const baseUrl =  window._CONFIG_.VITE_API_BASE_URL?.replace(/\/$/, '');

/** Let the browser set multipart boundary (do not send application/json). */
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

function unwrap(res) {
  return res.data?.data ?? res.data
}

function setByPath(obj, path, value) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {}
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = value
}

/** When CRM saved null/empty, show the same copy the public site uses (see homePageLiveDefaults). */
function coalesceHomeTextToLiveDefault(saved, liveDefault) {
  if (saved == null) return liveDefault
  if (typeof saved === 'string' && saved.trim() === '') return liveDefault
  return saved
}

/** If unchanged from built-in marketing copy, persist empty so the live site keeps template/styling. */
function normalizeOrgHomeTextsForSave(orgHome) {
  if (!orgHome) return orgHome
  const o = { ...orgHome }
  if ((o.homeHeroTitle ?? '').trim() === HOME_HERO_TITLE_LIVE_DEFAULT.trim()) {
    o.homeHeroTitle = ''
  }
  if ((o.homeHeroSubtitle ?? '').trim() === HOME_HERO_SUBTITLE_LIVE_DEFAULT.trim()) {
    o.homeHeroSubtitle = ''
  }
  if ((o.homeTrustStrip ?? '').trim() === HOME_TRUST_STRIP_LIVE_DEFAULT.trim()) {
    o.homeTrustStrip = ''
  }
  if ((o.homeOfferingsIntro ?? '').trim() === HOME_OFFERINGS_INTRO_LIVE_DEFAULT.trim()) {
    o.homeOfferingsIntro = ''
  }
  return o
}

function defaultForm() {
  return {
    id: null,
    orgName: '',
    orgAddress: '',
    orgAddresses: [],
    orgPhone: '',
    orgEmail: '',
    orgLogo: null,
    orgHome: {
      bannerVideo: null,
      videos: [],
      images: [],
      departmentType: null,
      notesDepartmentType: null,
      allCourses: null,
      noteCourse: null,
      completeCourse: null,
      videoCourse: null,
      notesHeading: null,
      comphrensiveHeading: null,
      videoHeading: null,
      completeHeading: null,
      trendingCourseHeading: null,
      termsAndConditions: null,
      homeHeroTitle: HOME_HERO_TITLE_LIVE_DEFAULT,
      homeHeroSubtitle: HOME_HERO_SUBTITLE_LIVE_DEFAULT,
      homeTrustStrip: HOME_TRUST_STRIP_LIVE_DEFAULT,
      homeOfferingsIntro: HOME_OFFERINGS_INTRO_LIVE_DEFAULT,
    },
    orgAboutUs: {
      aboutWallpaper: null,
      vision: '',
      mission: '',
      orgValues: '',
    },
    orgDirectorDetail: {
      directorName: '',
      role: '',
      aboutDirector: '',
      directorImage: null,
    },
    orgParentCompany: {
      name: '',
      websiteUrl: '',
      description: '',
    },
    orgAchievement: {
      achivementTitle: '',
      achivementImages: [],
    },
    orgGallery: {
      galleryTitle: '',
      galleryImages: [],
    },
    orgTeamGallery: {
      teamSectionTitle: '',
      teamImages: [],
    },
  }
}

function mapDetailsToForm(raw) {
  if (!raw) return defaultForm()
  const d = raw
  const next = defaultForm()
  next.id = d.id ?? null
  next.orgName = d.orgName ?? ''
  const rawAddrList = Array.isArray(d.orgAddresses) ? d.orgAddresses : []
  // Support both formats:
  // - old: ["addr1", "addr2"]
  // - new: [{ label, address }]
  const normalized = rawAddrList
    .map((a) => {
      if (typeof a === 'string') return { label: '', address: a }
      if (a && typeof a === 'object') return { label: a.label ?? '', address: a.address ?? '' }
      return null
    })
    .filter(Boolean)
    .filter((a) => String(a.address ?? '').trim() !== '')

  if (normalized.length) {
    next.orgAddresses = normalized
    next.orgAddress = normalized[0]?.address ?? d.orgAddress ?? ''
  } else {
    next.orgAddress = d.orgAddress ?? ''
    next.orgAddresses = next.orgAddress ? [{ label: '', address: next.orgAddress }] : [{ label: '', address: '' }]
  }
  next.orgPhone = d.orgPhone ?? ''
  next.orgEmail = d.orgEmail ?? ''
  next.orgLogo = d.orgLogo ?? null

  if (d.orgHome) {
    const oh = d.orgHome
    next.orgHome = {
      ...next.orgHome,
      ...oh,
      videos: oh.videos ?? [],
      images: oh.images ?? [],
      notesDepartmentType: oh.notesDepartmentType ?? oh.NotesDepartmentType ?? null,
    }
  }
  if (d.orgAboutUs) {
    next.orgAboutUs = { ...next.orgAboutUs, ...d.orgAboutUs }
  }
  if (d.orgDirectorDetail) {
    next.orgDirectorDetail = { ...next.orgDirectorDetail, ...d.orgDirectorDetail }
  }
  if (d.orgParentCompany) {
    next.orgParentCompany = { ...next.orgParentCompany, ...d.orgParentCompany }
  }
  if (d.orgAchievement) {
    next.orgAchievement = {
      ...next.orgAchievement,
      ...d.orgAchievement,
      achivementImages: [...(d.orgAchievement.achivementImages ?? [])],
    }
  }
  if (d.orgGallery) {
    next.orgGallery = {
      galleryTitle: d.orgGallery.galleryTitle ?? '',
      galleryImages: [...(d.orgGallery.galleryImages ?? [])],
    }
  }
  if (d.orgTeamGallery) {
    next.orgTeamGallery = {
      teamSectionTitle: d.orgTeamGallery.teamSectionTitle ?? '',
      teamImages: [...(d.orgTeamGallery.teamImages ?? [])],
    }
  }

  next.orgHome.homeHeroTitle = coalesceHomeTextToLiveDefault(
    next.orgHome.homeHeroTitle,
    HOME_HERO_TITLE_LIVE_DEFAULT,
  )
  next.orgHome.homeHeroSubtitle = coalesceHomeTextToLiveDefault(
    next.orgHome.homeHeroSubtitle,
    HOME_HERO_SUBTITLE_LIVE_DEFAULT,
  )
  next.orgHome.homeTrustStrip = coalesceHomeTextToLiveDefault(
    next.orgHome.homeTrustStrip,
    HOME_TRUST_STRIP_LIVE_DEFAULT,
  )
  next.orgHome.homeOfferingsIntro = coalesceHomeTextToLiveDefault(
    next.orgHome.homeOfferingsIntro,
    HOME_OFFERINGS_INTRO_LIVE_DEFAULT,
  )

  return next
}

/**
 * Shared layout for User Panel (Home / About): one GET, one save to
 * `POST /organizations/addUpdateDetails` with `organization` JSON + files.
 * Child routes can use `useOutletContext()` for `formData`, `setFormData`, etc.
 */
export default function Frontend() {
  const location = useLocation()
  const [formData, setFormData] = useState(defaultForm)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [files, setFiles] = useState({
    logo: null,
    wallpaper: null,
    directorImage: null,
    bannerVideo: null,
    achievementImages: [],
    galleryImages: [],
    courseVideos: [],
  })

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.get(ORG_DETAILS_PATH)
      const data = unwrap(res)
      setFormData(mapDetailsToForm(data))
    } catch (err) {
      console.error(err)
      showErrorToast(
        err?.response?.data?.message ?? err?.response?.data ?? 'Could not load organization',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const handleTextChange = useCallback((e) => {
    const { name, value } = e.target
    if (!name) return
    setFormData((prev) => {
      const next = JSON.parse(JSON.stringify(prev))
      setByPath(next, name, value)
      return next
    })
  }, [])

  const handleFileChange = useCallback((field, file) => {
    setFiles((prev) => ({ ...prev, [field]: file }))
  }, [])

  const handleAchievementFiles = useCallback((fileList) => {
    const arr = fileList ? Array.from(fileList) : []
    setFiles((prev) => ({ ...prev, achievementImages: arr }))
  }, [])

  const handleGalleryFiles = useCallback((fileList) => {
    const arr = fileList ? Array.from(fileList) : []
    setFiles((prev) => ({ ...prev, galleryImages: arr }))
  }, [])

  const buildOrganizationJson = useCallback(() => {
    const payload = JSON.parse(JSON.stringify(formData))
    if (payload.orgHome) {
      payload.orgHome = normalizeOrgHomeTextsForSave(payload.orgHome)
      payload.orgHome.videos = payload.orgHome.videos ?? []
      payload.orgHome.images = payload.orgHome.images ?? []
    }
    if (payload.orgAchievement?.achivementImages) {
      payload.orgAchievement.achivementImages = [...payload.orgAchievement.achivementImages]
    }
    if (payload.orgGallery?.galleryImages) {
      payload.orgGallery.galleryImages = [...payload.orgGallery.galleryImages]
    }
    return JSON.stringify(payload)
  }, [formData])

  const handleSubmit = useCallback(async () => {
    try {
      setSaving(true)
      const fd = new FormData()
      fd.append('organization', buildOrganizationJson())
      if (files.logo) fd.append('logo', files.logo)
      if (files.wallpaper) fd.append('wallpaper', files.wallpaper)
      if (files.directorImage) fd.append('directorImage', files.directorImage)
      if (files.bannerVideo) fd.append('BannerVideo', files.bannerVideo)
      files.achievementImages.forEach((f) => fd.append('achievementImages', f))
      files.galleryImages.forEach((f) => fd.append('galleryImages', f))
      files.courseVideos.forEach((f) => fd.append('courseVideos', f))

      const response = await api.post(ORG_SAVE_PATH, fd, multipartConfig())
      if (response.status === 200 || response.status === 201) {
        showSuccessToast('Organization saved successfully')
        setFiles({
          logo: null,
          wallpaper: null,
          directorImage: null,
          bannerVideo: null,
          achievementImages: [],
          galleryImages: [],
          courseVideos: [],
        })
        await fetchAllData()
      }
    } catch (err) {
      console.error(err)
      const msg =
        err?.response?.data?.message ??
        (typeof err?.response?.data === 'string' ? err.response.data : null) ??
        err?.message ??
        'Save failed'
      showErrorToast(msg)
    } finally {
      setSaving(false)
    }
  }, [buildOrganizationJson, fetchAllData, files])

  const pageLabel = location.pathname.includes('my-team')
    ? 'MY TEAM'
    : location.pathname.includes('about')
      ? 'ABOUT US'
      : 'HOME PAGE'

  const outletContext = useMemo(
    () => ({
      formData,
      setFormData,
      handleTextChange,
      handleFileChange,
      handleAchievementFiles,
      handleGalleryFiles,
      files,
      setFiles,
      isLoading,
      saving,
      fetchAllData,
      baseUrl,
      handleSubmit,
      refetchData: fetchAllData,
    }),
    [
      formData,
      handleTextChange,
      handleFileChange,
      handleAchievementFiles,
      handleGalleryFiles,
      files,
      isLoading,
      saving,
      fetchAllData,
      handleSubmit,
    ],
  )

  return (
    <div className="-mx-6 -mb-6 min-h-0 bg-white text-gray-900">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm font-medium text-slate-600">{pageLabel}</p>
          <nav className="flex gap-2 text-sm">
            <NavLink
              to="home"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 ${isActive ? 'bg-orange-100 text-orange-800' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="about"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 ${isActive ? 'bg-orange-100 text-orange-800' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              About
            </NavLink>
            <NavLink
              to="my-team"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 ${isActive ? 'bg-orange-100 text-orange-800' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              My Team
            </NavLink>
          </nav>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || isLoading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {saving ? 'Saving…' : 'Update'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 border-b border-slate-100 bg-slate-50 py-3 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading organization…
        </div>
      ) : null}
      <Outlet context={outletContext} />
    </div>
  )
}
