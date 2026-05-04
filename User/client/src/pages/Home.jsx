import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { orgMediaUrl } from "../utils/orgMediaUrl";
import { solutionInsightTiles } from "../data/solutionInsightsData";
import HomeTwoPortalsOffering from "../Components/HomeTwoPortalsOffering.jsx";

/**
 * Banner accent: 'sky' (matches site chrome) or 'gold' (marketing pop).
 * 1) Set BANNER_VARIANT_MANUAL to 'gold' or 'sky' to preview in code, or
 * 2) Set VITE_HOME_BANNER_VARIANT=gold in .env (overridden when MANUAL is non-null).
 */
const BANNER_VARIANT_MANUAL = /** @type {'sky' | 'gold' | null} */ (null);
const BANNER_VARIANT =
  BANNER_VARIANT_MANUAL ??
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_HOME_BANNER_VARIANT === "gold"
    ? "gold"
    : "sky");

const SLIDE_INTERVAL_MS = 7500;

const BANNER_SLIDES = [
  {
    id: "portal",
    headline: "Your EdTech portal, live in minutes—Edukify gets you there.",
    useOrgBanner: true,
  },
  {
    id: "web",
    headline: "Your institute belongs on the web—not limited to tuition centre.",
    useOrgBanner: false,
  },
  {
    id: "subscribe",
    headline: "No tech skills. No two-year wait. No huge bill—subscribe with Edukify.",
    useOrgBanner: false,
  },
];

/**
 * Bright, naturally lit education photography (Unsplash). Swap for your own assets in /public if needed.
 */
const BANNER_STOCK_PHOTOS = {
  portal:
    "https://images.unsplash.com/photo-1580582932707-52065688608e?auto=format&fit=crop&w=1920&q=88",
  web: "https://images.unsplash.com/photo-1517245385007-47915363048e?auto=format&fit=crop&w=1920&q=88",
  subscribe:
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1920&q=88",
};

/** Narrow veil + soft bottom fade so the photo stays visible (not a full-screen “movie” black wash). */
function HeroPhotoVeil() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.5)_0%,rgba(15,23,42,0.22)_min(42%,22rem),rgba(15,23,42,0.08)_min(58%,32rem),transparent_82%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-slate-900/10"
        aria-hidden
      />
    </>
  );
}

/** Stock fallback slides: bright photo first, very light tint, veil keeps most of frame viewable. */
function BannerArtBackdrop({ variant, priority }) {
  const src = BANNER_STOCK_PHOTOS[variant] ?? BANNER_STOCK_PHOTOS.portal;

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-200" aria-hidden>
      <img
        src={src}
        alt=""
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover brightness-[1.04] saturate-[1.06]"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
      />
      {/* Hint of brand colour — low so the image still reads as “real life” */}
      <div
        className={
          variant === "portal"
            ? "absolute inset-0 bg-gradient-to-tr from-sky-600/12 via-transparent to-indigo-600/14"
            : variant === "web"
              ? "absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-700/12"
              : "absolute inset-0 bg-gradient-to-tr from-violet-600/12 via-transparent to-amber-400/10"
        }
      />

      {variant === "web" ? (
        <p className="pointer-events-none absolute right-[6%] top-[14%] select-none text-[clamp(4.5rem,16vw,11rem)] font-black leading-none text-slate-900/[0.07]">
          WEB
        </p>
      ) : null}
      {variant === "subscribe" ? (
        <p className="pointer-events-none absolute bottom-[18%] left-[5%] select-none text-[clamp(3.25rem,11vw,7.5rem)] font-black leading-none text-slate-900/[0.08]">
          EDUKIFY
        </p>
      ) : null}

      <HeroPhotoVeil />
    </div>
  );
}

function mediaTypeFromName(name) {
  if (!name || typeof name !== "string") return "image";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  return "image";
}

function fileUrl(filename, base) {
  return orgMediaUrl(filename, base);
}

/** Four marketing headlines + short explanations (titles echo carousel / spine lines). */
const homeShowcaseSpineLines = [
  {
    title: "1. Your EdTech portal, live in minutes",
    hint: "Public pages families see, plus the staff screens your office needs—online fast, instead of waiting on a bespoke build.",
  },
  {
    title: "Teachers? Content? You've got both. You only need the platform.",
    hint: "Your teaching and notes already exist. Edukify is the credible web layer so that work shows up online, clearly and under your brand.",
  },
  {
    title: "Your notes and courses, finally in one digital library.",
    hint: "Fewer stray files and message threads—learners reach everything in one organised, institute-branded place.",
  },
  {
    title: "One city or the world—Edukify backs your choice.",
    hint: "Teach locally or reach far-off students with the same setup; grow without ripping up what you launched first.",
  },
];

const whyChooseEdukify = [
  {
    title: "Nothing else gets you live this fast",
    body: "In about five minutes you can move from decision to a branded presence—no procurement cycle, no sprint plan, and no waiting for someone to “finish the framework first.”",
  },
  {
    title: "No servers, hosting, or domains on your plate",
    body: "We carry the operational layer: staying online, certificates, and the nuts and bolts of DNS and hosting—you are not renewing panels and chasing alerts in your spare time.",
  },
  {
    title: "No programmers to build or maintain the portal",
    body: "You do not commission a dev shop for launch, then keep people on retainer for every tweak. The portal is a product we improve and run so your team focuses on teaching—not pull requests.",
  },
  {
    title: "Subscriptions, not mystery IT spend",
    body: "Replace open-ended build-and-bill projects with a predictable subscription: the platform, updates, and uptime are on us—so leadership can budget and move on.",
  },
];

function HomeBannerCarousel({ bannerDisplay, orgName }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = BANNER_SLIDES.length;

  const go = useCallback(
    (dir) => {
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (paused || n <= 1) return undefined;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [paused, n]);

  const isGold = BANNER_VARIANT === "gold";
  /* Marketing cyan (#00aeef) on hero for high contrast on dark; gold path unchanged */
  const primaryCta =
    isGold
      ? "rounded-full bg-amber-400 px-8 py-3.5 text-[0.9375rem] font-semibold text-slate-900 shadow-lg transition hover:bg-amber-300"
      : "rounded-full bg-[#00aeef] px-8 py-3.5 text-[0.9375rem] font-semibold text-white shadow-lg shadow-black/25 transition hover:bg-[#33c4f5]";
  const secondaryCta =
    isGold
      ? "rounded-full border border-white/35 bg-white/5 px-7 py-3.5 text-[0.9375rem] font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
      : "rounded-full border border-white/40 bg-white/5 px-7 py-3.5 text-[0.9375rem] font-semibold text-white backdrop-blur-sm transition hover:bg-white/12";
  const navBtn =
    isGold
      ? "flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/90 text-slate-900 shadow-md transition hover:bg-amber-300"
      : "flex h-11 w-11 items-center justify-center rounded-full border border-slate-800/25 bg-white/90 text-slate-800 shadow-lg shadow-black/15 backdrop-blur-sm transition hover:bg-white";
  const dotActive = isGold ? "bg-amber-400 w-8" : "bg-[#00aeef] w-8";
  const dotIdle = isGold ? "bg-white/35 hover:bg-white/50" : "bg-slate-900/30 ring-1 ring-slate-900/20 hover:bg-slate-900/45";

  return (
    <section
      className="relative w-full border-b border-slate-200/80 px-4 pb-4 sm:px-6 sm:pb-5 lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Edukify highlights"
    >
      <div className="relative mx-auto w-full max-w-[104.544rem] overflow-hidden">
        <div className="relative min-h-[min(72vh,640px)] w-full md:min-h-[min(78vh,720px)]">
        {BANNER_SLIDES.map((slide, i) => {
          const active = i === index;
          const showMedia = slide.useOrgBanner && bannerDisplay;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                active ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
              }`}
              aria-hidden={!active}
            >
              {/* Background — only mount CRM video/image when this slide is active (saves decode / autoplay) */}
              {showMedia && active ? (
                <div className="absolute inset-0">
                  <img
                    src={BANNER_STOCK_PHOTOS.portal}
                    alt=""
                    width={1920}
                    height={1080}
                    className="absolute inset-0 h-full w-full object-cover brightness-[1.04] saturate-[1.05]"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                  {bannerDisplay.type === "video" ? (
                    <video
                      src={bannerDisplay.src}
                      className="absolute inset-0 z-[1] h-full w-full object-cover brightness-110 contrast-[1.02] saturate-[1.05]"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={bannerDisplay.src}
                      alt=""
                      className="absolute inset-0 z-[1] h-full w-full object-cover brightness-110 contrast-[1.02] saturate-[1.05]"
                    />
                  )}
                  <div className="absolute inset-0 z-[2]">
                    <HeroPhotoVeil />
                  </div>
                </div>
              ) : (
                <BannerArtBackdrop variant={slide.id} priority={active} />
              )}

              {/* Copy sits on frosted panel so the photo can stay bright across the frame */}
              <div className="relative z-[3] flex h-full min-h-[inherit] flex-col justify-end pb-20 pt-28 sm:justify-center sm:pb-24 sm:pt-20 md:pb-28">
                <div className="mx-auto w-full max-w-[104.544rem] px-4 sm:px-6 lg:px-8">
                  <div className="max-w-xl rounded-2xl border border-white/25 bg-slate-950/45 p-6 shadow-2xl shadow-black/20 backdrop-blur-md sm:max-w-2xl sm:p-8 md:max-w-3xl md:bg-slate-950/50 lg:max-w-[44rem]">
                    <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.22em] text-slate-200">
                      {orgName}
                    </p>
                    {slide.id === "portal" && slide.headline.includes("—") ? (
                      <h2 className="mt-4 max-w-2xl text-balance font-serif text-[clamp(1.75rem,1rem+3.4vw,3rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white lg:max-w-3xl">
                        {(() => {
                          const [lead, tail] = slide.headline.split("—");
                          return (
                            <>
                              <span className="block">{`${lead.trim()}—`}</span>
                              <span className="mt-2 block text-[0.94em] font-semibold tracking-[-0.018em] text-sky-100">
                                {tail?.trim()}
                              </span>
                            </>
                          );
                        })()}
                      </h2>
                    ) : (
                      <h2 className="mt-4 max-w-2xl text-balance font-serif text-[clamp(1.75rem,1rem+3.4vw,3rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:max-w-3xl lg:max-w-4xl">
                        {slide.headline}
                      </h2>
                    )}
                    <div className="mt-8 flex flex-wrap gap-3 sm:mt-9">
                      <Link to="/signup" className={primaryCta}>
                        Get started
                      </Link>
                      <Link to="/contact" className={secondaryCta}>
                        Contact us
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ground carousel controls on a soft band so dots/arrows read on bright photos */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-36 bg-gradient-to-t from-slate-950/75 via-slate-950/35 to-transparent sm:h-40"
        aria-hidden
      />

      {/* Controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[3] flex flex-col items-center gap-4 sm:bottom-6">
        <div className="pointer-events-auto flex items-center gap-2">
          {BANNER_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${i === index ? `${dotActive}` : `w-2.5 ${dotIdle}`}`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
        <div className="pointer-events-auto flex w-full max-w-[104.544rem] justify-end px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <button type="button" className={navBtn} onClick={() => go(-1)} aria-label="Previous slide">
              <i className="ri-arrow-left-s-line text-xl" aria-hidden />
            </button>
            <button type="button" className={navBtn} onClick={() => go(1)} aria-label="Next slide">
              <i className="ri-arrow-right-s-line text-xl" aria-hidden />
            </button>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [organisation, setOrganisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const adminApiBaseUrl = window._CONFIG_.VITE_ADMIN_PROJECT_URL;

  useEffect(() => {
    if (!adminApiBaseUrl) {
      setOrganisation(null);
      setLoading(false);
      return;
    }
    const fetchOrganisation = async () => {
      try {
        const res = await axios.get(`${adminApiBaseUrl}/organizations/details`);
        setOrganisation(res.data ?? null);
      } catch {
        setOrganisation(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganisation();
  }, [adminApiBaseUrl]);

  useEffect(() => {
    if (loading) return;
    const anchorId =
      location.hash === "#solution-insights"
        ? "solution-insights"
        : location.hash === "#two-portals"
          ? "two-portals"
          : null;
    if (!anchorId) return;
    const el = document.getElementById(anchorId);
    if (!el) return;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [loading, location.pathname, location.hash]);

  const assetBase = adminApiBaseUrl || window._CONFIG_.VITE_API_BASE_URL;

  const bannerDisplay = useMemo(() => {
    const bannerName = organisation?.orgHome?.bannerVideo;
    if (!bannerName) return null;
    return {
      type: mediaTypeFromName(bannerName),
      src: fileUrl(bannerName, assetBase),
    };
  }, [organisation?.orgHome?.bannerVideo, assetBase]);

  const orgName =
    typeof organisation?.orgName === "string" && organisation.orgName.trim()
      ? organisation.orgName.trim()
      : "Edukify";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 text-[var(--text)]">
      <HomeBannerCarousel bannerDisplay={bannerDisplay} orgName={orgName} />

      {/* Value strip — subscribe pitch + spine cards (slate band bridges into navy two-portals) */}
      <section className="border-b border-slate-200/60 bg-slate-100 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12 lg:gap-x-14">
            <div className="lg:col-span-4">
              <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.45rem] sm:leading-snug lg:text-2xl">
                No tech skills. No two-year wait. No huge bill—subscribe with Edukify.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Putting a real EdTech footprint on the web normally calls for software-development
                expertise, a long runway of time and effort, and serious money—custom builds, servers,
                hosting, security patches, and keeping everything online when students are depending
                on it.
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                Edukify is built as a managed cloud platform: that whole technical layer is handled
                under the hood for you, so your institute is not running a mini IT department just to
                stay on the internet.
              </p>
            </div>
            <div className="lg:col-span-8">
              <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                {homeShowcaseSpineLines.map((item, idx) => (
                  <li key={`showcase-${idx}`}>
                    <div className="flex min-h-[11rem] flex-col rounded-xl border border-slate-200/90 border-l-4 border-l-sky-500 bg-gradient-to-br from-white to-slate-50/90 px-5 py-5 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200/60 sm:min-h-[10.5rem] sm:px-6 sm:py-6">
                      <p className="text-balance font-sans text-[1.05rem] font-semibold leading-snug tracking-tight text-slate-900 selection:bg-sky-200/90 selection:text-slate-950 sm:text-lg md:text-[1.125rem] md:leading-snug">
                        {item.title}
                      </p>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 selection:bg-sky-100/90 selection:text-slate-900">
                        {item.hint}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <HomeTwoPortalsOffering />

      {/* Why choose — same slate family as value strip for symmetry around navy block */}
      <section className="border-t border-slate-200/50 bg-slate-100 px-4 pt-10 pb-14 sm:px-6 sm:pt-11 sm:pb-16 lg:px-8 lg:pt-12 lg:pb-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Why choose Edukify
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:mt-7">
            {whyChooseEdukify.map((item, idx) => (
              <li key={`why-edukify-${idx}`}>
                <div className="h-full rounded-xl border border-slate-200/90 border-l-4 border-l-sky-500 bg-gradient-to-br from-white to-slate-50/90 p-6 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200/60 sm:p-7">
                  <h3 className="text-lg font-semibold leading-snug tracking-tight text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Solution insights — navy inset panel (same width as two-portals) */}
      <section id="solution-insights" className="scroll-mt-16 px-4 pb-12 pt-4 sm:px-6 sm:pb-14 sm:pt-6 lg:px-8">
        <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-700/55 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 text-white shadow-xl shadow-slate-900/25 sm:px-6 sm:py-14 lg:px-8">
          <div
            className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-12 bottom-0 h-64 w-64 rounded-full bg-indigo-500/12 blur-3xl"
            aria-hidden
          />
          <div className="relative z-[1]">
            <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Our insight into the solution
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-relaxed text-slate-300 sm:text-base">
              These topics describe how the{" "}
              <Link
                to="/platform"
                className="font-semibold text-sky-300 underline-offset-4 hover:text-sky-200 hover:underline"
              >
                two portals
              </Link>{" "}
              behave—catalogs and governance, branding, and homepage merchandising. Browse by theme on
              the{" "}
              <Link
                to="/solution"
                className="font-semibold text-sky-300 underline-offset-4 hover:text-sky-200 hover:underline"
              >
                Solution hub (tabs)
              </Link>
              , or tap any tile below for the full write-up on that topic.
            </p>
            <ul className="mt-10 grid list-none gap-6 sm:grid-cols-2 sm:gap-8">
              {solutionInsightTiles.map((tile) => (
                <li key={tile.slug}>
                  <Link
                    to={`/solution/${tile.slug}`}
                    className="group flex h-full min-h-[9.5rem] flex-col rounded-2xl border border-white/10 border-l-4 border-l-sky-500 bg-white p-6 shadow-xl shadow-black/35 transition hover:border-sky-400/50 hover:shadow-2xl sm:min-h-[10rem] sm:p-7"
                  >
                    <span className="text-lg font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-sky-900">
                      {tile.title}
                    </span>
                    <span className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                      {tile.teaser}
                    </span>
                    <span className="mt-4 text-sm font-semibold text-sky-700 group-hover:underline">
                      Read more
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
