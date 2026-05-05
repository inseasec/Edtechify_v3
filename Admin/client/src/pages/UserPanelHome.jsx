import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useOutletContext } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  Facebook,
  Home as HomeIcon,
  Image,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Phone,
  FileText,
  Upload,
  User,
} from 'lucide-react'
import ImageTemplates from '@/Components/ImageTemplates'
import HomeTemplates from '../Components/HomeTemplates'
import MarketingHomePage from '@user-site/Components/marketing/MarketingHomePage.jsx'
import {
  HOME_OFFERINGS_INTRO_LIVE_DEFAULT,
  HOME_HERO_TITLE_LIVE_DEFAULT,
  HOME_HERO_SUBTITLE_LIVE_DEFAULT,
  HOME_TRUST_STRIP_LIVE_DEFAULT,
} from '@user-site/constants/homePageLiveDefaults.js'
function courseImageUrl(filename, base) {
  const baseUrl = base?.replace(/\/$/, '') ?? ''
  if (!filename || typeof filename !== 'string') return ''
  const path = filename.replace(/^\//, '')
  // Org uploads are stored as relative paths like "OrgData/HomePage/images/logo_1.png"
  if (path.startsWith('OrgData/')) return `${baseUrl}/${path}`
  if (path.includes('course-images')) return `${baseUrl}/${path}`
  return `${baseUrl}/course-images/${path}`
}

function bannerTypeFromName(name) {
  if (!name || typeof name !== 'string') return 'image'
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
  return 'image'
}


export default function UserPanelHome() {
  const ctx = useOutletContext()
  const {
    formData = {},
    handleTextChange,
    handleFileChange,
    handleGalleryFiles,
    files = {},
    isLoading,
    baseUrl = '',
  } = ctx ?? {}

  const logoInputRef = useRef(null)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalStep, setModalStep] = useState("main");
  const [customVideoTemplateOpen, setVideoCustomTemplateOpen] = useState(false)
  const [customImgTemplateOpen, setImgCustomTemplateOpen] = useState(false)
  const [logoObjectUrl, setLogoObjectUrl] = useState(null)
  const [bannerObjectUrl, setBannerObjectUrl] = useState(null)
  useEffect(() => {
    if (!files.logo) {
      setLogoObjectUrl(null)
      return
    }
    const u = URL.createObjectURL(files.logo)
    setLogoObjectUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [files.logo])

  useEffect(() => {
    if (!files.bannerVideo) {
      setBannerObjectUrl(null)
      return
    }
    const u = URL.createObjectURL(files.bannerVideo)
    setBannerObjectUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [files.bannerVideo])

  const logoPreview = useMemo(() => {
    if (logoObjectUrl) return logoObjectUrl
    if (formData.orgLogo) return courseImageUrl(formData.orgLogo, baseUrl)
    return null
  }, [logoObjectUrl, formData.orgLogo, baseUrl])

  const bannerDisplay = useMemo(() => {
    if (bannerObjectUrl && files.bannerVideo) {
      const isVid = files.bannerVideo.type.startsWith('video/')
      return { type: isVid ? 'video' : 'image', src: bannerObjectUrl }
    }
    const bannerName = formData.orgHome?.bannerVideo
    if (bannerName) {
      return {
        type: bannerTypeFromName(bannerName),
        src: courseImageUrl(bannerName, baseUrl),
      }
    }
    return null
  }, [bannerObjectUrl, files.bannerVideo, formData.orgHome?.bannerVideo, baseUrl])

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    handleFileChange?.('logo', file)
    e.target.value = ''
  }

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleFileChange?.('bannerVideo', file)
    e.target.value = ''
    setShowUploadModal(false)
  }

  const handleHomeBannerTemplateFile = (file) => {
    if (!file) {
      handleFileChange?.('bannerVideo', null)
      setImgCustomTemplateOpen(false)
      setVideoCustomTemplateOpen(false)
      return
    }
    handleFileChange?.('bannerVideo', file)
    setImgCustomTemplateOpen(false)
    setVideoCustomTemplateOpen(false)
  }



  if (!ctx) {
    return (
      <div className="px-4 py-8 text-center text-sm text-amber-800">
        Open <strong>User Panel → Home</strong> from the sidebar so this page loads inside the User Panel layout.
      </div>
    )
  }

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading organization…
        </div>
      ) : null}

      {!isLoading && (
        <>
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm md:px-6">
              <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <FileText className="h-5 w-5 shrink-0 text-sky-600" />
                    <h2 className="text-lg font-semibold">Home page content</h2>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    Matches the public <strong className="font-medium text-slate-800">Home</strong> layout.
                    Use <strong className="font-medium text-slate-800">Update</strong> in the panel header to publish (logo, banner, and fields below).
                    The hero uses <strong className="font-medium text-slate-800">one</strong> banner image or video behind all three slides—the carousel only rotates the headlines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
                >
                  <Upload className="h-4 w-4" />
                  Change homepage banner
                </button>
              </div>

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Logo</span>
                <div className="flex items-center gap-4">
                  <div className="group relative">
                    {logoPreview ? (
                      <div className="relative h-14 w-14">
                        <img
                          src={logoPreview}
                          alt="Company logo"
                          className="h-full w-full rounded-lg border border-slate-200 bg-white object-contain p-1"
                        />
                        <label
                          htmlFor="user-panel-logo-upload"
                          className="absolute -right-2 -top-2 cursor-pointer rounded-full bg-sky-600 p-1.5 text-white shadow-md transition hover:bg-sky-700"
                        >
                          <Upload size={14} />
                        </label>
                      </div>
                    ) : (
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                        <label
                          htmlFor="user-panel-logo-upload"
                          className="cursor-pointer rounded-md bg-slate-800 px-2 py-1 text-xs text-white hover:bg-slate-900"
                        >
                          Upload
                        </label>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      id="user-panel-logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Shown in the hero panel and footer on the live site.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Hero title
                  </span>
                  <p className="mb-2 text-xs leading-relaxed text-slate-500">
                    Main headline for <strong className="font-medium text-slate-600">carousel slide 1</strong> (the hero rotates three headlines).
                  </p>
                  <textarea
                    name="orgHome.homeHeroTitle"
                    rows={3}
                    value={formData.orgHome?.homeHeroTitle ?? ''}
                    onChange={handleTextChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder={HOME_HERO_TITLE_LIVE_DEFAULT}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Hero carousel — slide 2 headline
                  </span>
                  <p className="mb-2 text-xs leading-relaxed text-slate-500">
                    Same field as before (<code className="rounded bg-slate-100 px-1 py-px text-[11px]">homeHeroSubtitle</code>
                    ). Controls the <strong className="font-medium text-slate-600">second</strong> rotating hero headline only.
                  </p>
                  <textarea
                    name="orgHome.homeHeroSubtitle"
                    rows={3}
                    value={formData.orgHome?.homeHeroSubtitle ?? ''}
                    onChange={handleTextChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder={HOME_HERO_SUBTITLE_LIVE_DEFAULT}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Hero carousel — slide 3 headline
                  </span>
                  <p className="mb-2 text-xs leading-relaxed text-slate-500">
                    Same field as before (<code className="rounded bg-slate-100 px-1 py-px text-[11px]">homeTrustStrip</code>
                    ). Controls the <strong className="font-medium text-slate-600">third</strong> rotating hero headline only.
                  </p>
                  <textarea
                    name="orgHome.homeTrustStrip"
                    rows={3}
                    value={formData.orgHome?.homeTrustStrip ?? ''}
                    onChange={handleTextChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder={HOME_TRUST_STRIP_LIVE_DEFAULT}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Offerings section intro
                  </span>
                  <textarea
                    name="orgHome.homeOfferingsIntro"
                    rows={3}
                    value={formData.orgHome?.homeOfferingsIntro ?? ''}
                    onChange={handleTextChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder={HOME_OFFERINGS_INTRO_LIVE_DEFAULT}
                  />
                </label>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex justify-center px-3 py-2">
                <span className="rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                  Preview — same layout as public Home; one shared banner, rotating text (links disabled)
                </span>
              </div>
              <div className="pointer-events-none absolute right-3 top-12 z-10 sm:top-10">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur-sm hover:bg-white"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Banner
                </button>
              </div>
              <div className="pt-10">
                <MarketingHomePage
                  bannerDisplay={bannerDisplay}
                  orgHome={formData.orgHome ?? {}}
                  previewMode
                />
              </div>
            </div>
          </div>

          {/* ===== PUBLIC GALLERY PAGE (title + images) ===== */}
          <div className="border-b border-slate-200 bg-white px-4 py-8 md:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-2 flex items-center gap-2 text-slate-800">
                <Image className="h-5 w-5 shrink-0 text-sky-600" />
                <h2 className="text-lg font-semibold">Product gallery (public site)</h2>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                Heading and <strong className="font-semibold text-slate-800">product</strong> images for{" "}
                <strong>/gallery</strong>. Choosing new images here and clicking <strong>Update</strong>{" "}
                replaces the previous set on the server. Team photos are managed under User Panel →
                About → Team photos (<strong>/our-team</strong>).
              </p>
              <label className="block max-w-xl">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Product gallery page title
                </span>
                <input
                  type="text"
                  name="orgGallery.galleryTitle"
                  value={formData.orgGallery?.galleryTitle ?? ''}
                  onChange={handleTextChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="e.g. Product gallery"
                />
              </label>
              <div className="mt-4">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Replace product gallery images
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full max-w-xl text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-sky-700"
                  onChange={(e) => {
                    handleGalleryFiles?.(e.target.files)
                    e.target.value = ''
                  }}
                />
                {Array.isArray(formData.orgGallery?.galleryImages) &&
                formData.orgGallery.galleryImages.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Currently {formData.orgGallery.galleryImages.length} image(s) on file. Select
                    new files only when you want to replace them all.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No images saved yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="bg-gray-900 py-8 text-white">
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-center md:justify-start">
                    {logoPreview ? (
                      <div className="h-24 w-24">
                        <img
                          src={logoPreview}
                          alt="Company logo"
                          className="h-full w-full rounded-xl bg-white object-contain p-3 shadow-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-600 bg-gray-800">
                        <Image className="h-12 w-12 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-center text-xs text-gray-400 md:text-left">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      name="orgName"
                      value={formData.orgName ?? ''}
                      onChange={handleTextChange}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      placeholder="Enter organization name"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="mb-2 flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white">Contact Us</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs text-gray-400">Address</label>
                      <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5">
                        <MapPin className="h-5 w-5 shrink-0 text-gray-400" />
                        <input
                          type="text"
                          name="orgAddress"
                          value={formData.orgAddress ?? ''}
                          onChange={handleTextChange}
                          className="w-full bg-transparent text-sm text-white focus:outline-none"
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-gray-400">Phone Number</label>
                      <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5">
                        <Phone className="h-5 w-5 shrink-0 text-gray-400" />
                        <input
                          type="text"
                          name="orgPhone"
                          value={formData.orgPhone ?? ''}
                          onChange={handleTextChange}
                          className="w-full bg-transparent text-sm text-white focus:outline-none"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-gray-400">Email Address</label>
                      <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5">
                        <Mail className="h-5 w-5 shrink-0 text-gray-400" />
                        <input
                          type="email"
                          name="orgEmail"
                          value={formData.orgEmail ?? ''}
                          onChange={handleTextChange}
                          className="w-full bg-transparent text-sm text-white focus:outline-none"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="mb-4 text-xl font-bold text-white">Quick Links</h3>
                  <ul className="space-y-3">
                    <li>
                      <span className="flex cursor-pointer items-center gap-2 py-1 text-sm text-gray-300 transition-colors hover:text-white">
                        <HomeIcon className="h-4 w-4" /> Home
                      </span>
                    </li>
                    <li>
                      <NavLink
                        to="../about"
                        className="flex items-center gap-2 py-1 text-sm text-gray-300 transition-colors hover:text-white"
                      >
                        <User className="h-4 w-4" /> About Us
                      </NavLink>
                    </li>
                    <li>
                      <span className="flex cursor-pointer items-center gap-2 py-1 text-sm text-gray-300 transition-colors hover:text-white">
                        <BookOpen className="h-4 w-4" /> All Courses
                      </span>
                    </li>
                    <li>
                      <span className="flex cursor-pointer items-center gap-2 py-1 text-sm text-gray-300 transition-colors hover:text-white">
                        <Briefcase className="h-4 w-4" /> Careers
                      </span>
                    </li>
                    <li>
                      <span className="flex cursor-pointer items-center gap-2 py-1 text-sm text-gray-300 transition-colors hover:text-white">
                        <Image className="h-4 w-4" /> Gallery
                      </span>
                    </li>
                    <li>
                      <span className="flex cursor-pointer items-center gap-2 py-1 text-sm text-gray-300 transition-colors hover:text-white">
                        <Mail className="h-4 w-4" /> Contact Us
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="mb-4 text-xl font-bold text-white">Follow Us</h3>
                  <div className="space-y-3">
                    <span className="group flex cursor-pointer items-center gap-3 py-1 text-gray-300 transition-colors hover:text-white">
                      <Facebook className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                      <span className="text-sm">Facebook</span>
                    </span>
                    <span className="group flex cursor-pointer items-center gap-3 py-1 text-gray-300 transition-colors hover:text-white">
                      <Instagram className="h-5 w-5 text-gray-400 group-hover:text-pink-500" />
                      <span className="text-sm">Instagram</span>
                    </span>
                    <span className="group flex cursor-pointer items-center gap-3 py-1 text-gray-300 transition-colors hover:text-white">
                      <Linkedin className="h-5 w-5 text-gray-400 group-hover:text-blue-700" />
                      <span className="text-sm">LinkedIn</span>
                    </span>
                  </div>
                </div>

                <div className="hidden md:block" aria-hidden />
              </div>
            </div>
          </div>

          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">

              {/* Blur Background */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => {
                  setShowUploadModal(false);
                  setModalStep("main");
                }}
              />

              {/* Modal Box */}
              <div className="relative bg-white rounded-xl shadow-xl p-8 ">

                {/* ===== MAIN STEP ===== */}
                {modalStep === "main" && (
                  <div className="flex  gap-6 w-[570px]">

                    {/* Custom Templates */}
                    <div
                      onClick={() => setModalStep("custom")}
                      className="border rounded p-6 flex flex-col items-center cursor-pointer hover:shadow-md"
                    >
                      <Upload className="w-6 h-6 mb-2" />
                      <p>Upload From Custom Templates</p>
                    </div>


                    <div className="rounded border p-6 text-gray-800">
                      <label
                        htmlFor="home-banner-local-upload"
                        className="flex cursor-pointer flex-col items-center gap-2"
                      >
                        <Upload className="h-6 w-6" />
                        <span>Upload from Local System</span>
                      </label>
                    </div>
                    <input
                      id="home-banner-local-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                    <input
                      id="home-banner-custom-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </div>
                )}

                {/* ===== CUSTOM TEMPLATE STEP ===== */}
                {modalStep === "custom" && (
                  <div className="flex  gap-8 w-[480px]">

                    <div
                      onClick={() => {
                        setVideoCustomTemplateOpen(true);
                        setShowUploadModal(false);
                        setModalStep("main");
                      }}
                      className="border rounded p-6 flex flex-col items-center cursor-pointer hover:shadow-md"
                    >
                      <Upload className="w-6 h-6 mb-2" />
                      <p>Choose Video Template</p>
                    </div>

                    <div
                      onClick={() => {
                        setImgCustomTemplateOpen(true);
                        setShowUploadModal(false);
                        setModalStep("main");
                      }}
                      className="border rounded p-6 flex flex-col items-center cursor-pointer hover:shadow-md"
                    >
                      <Upload className="w-6 h-6 mb-2" />
                      <p>Choose Image Template</p>
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}
        </>
      )}
      {customVideoTemplateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">

          {/* Blur Background */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setVideoCustomTemplateOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-[95%] max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Close Button */}
            <button
              onClick={() => setVideoCustomTemplateOpen(false)}
              className="absolute top-4 right-4 z-20 bg-red-500 shadow-lg rounded-full p-2 hover:bg-gray-100"
            >
              ✕
            </button>

            {/* Template Component */}
            <div className="h-full overflow-y-auto">
              <HomeTemplates onVideoSelect={handleHomeBannerTemplateFile} />
            </div>

          </div>
        </div>
      )}
      {customImgTemplateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Blur Background */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setImgCustomTemplateOpen(false)}
          />
          {/* Modal Container */}
          <div className="relative w-[95%] max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setImgCustomTemplateOpen(false)}
              className="absolute top-4 right-4 z-20 bg-red-500 shadow-lg rounded-full p-2 hover:bg-gray-100"
            >
              ✕
            </button>
            {/* Template Component */}
            <div className="h-full overflow-y-auto">
              <ImageTemplates onImageSelect={handleHomeBannerTemplateFile} />
            </div>

          </div>
        </div>
      )}
    </>
  )
}
