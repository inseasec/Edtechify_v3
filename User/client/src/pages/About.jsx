import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { orgMediaUrl } from "../utils/orgMediaUrl";

/** Shown when org has not filled “About the owner” text in admin (User Panel → About). */
const DEFAULT_DIRECTOR_BIO = `Earlier, Mr Jaspreet began his career as a Software Engineer in India and subsequently transferred to Europe and Australia as a Security Consultant. He established Seasec in 2020 from a small home setup. The company now boasts a well-established team across India and Europe and conducts its operations from self-owned offices in Mohali.

Alongside his responsibilities in Security Consultancy services in Europe, Mr. Jaspreet is establishing new business ventures.

His latest initiative is Edukify—a subscription platform for training institutions that combines a branded learner portal with staff-side catalog governance so institutes can run a serious web presence without building software from scratch.

He has been instrumental in shaping Edukify—not only as the initiative’s vision holder but also through direct involvement across delivery: solution architecture, business analysis, project leadership, and creative direction, working closely with Seasec’s team to turn the product into reality.`;

const OWNER_INSTAGRAM_URL =
  "https://www.instagram.com/jsbedi95?igsh=MWo4M2E3ZjVsaG93Zg%3D%3D&utm_source=qr";

const DEFAULT_PARENT_COMPANY_NAME = "Seasec Pvt Ltd";
const DEFAULT_PARENT_COMPANY_WEBSITE_URL = "https://seasec.in/";
const DEFAULT_PARENT_COMPANY_DESCRIPTION =
  "Seasec Pvt Ltd is the parent company behind Edukify. It carries product strategy, engineering, and long-term investment in the platform so schools, coaching brands, and training businesses get a stable partner—not a one-off project or anonymous vendor. The company focuses on practical software for education and training: secure operations, clear governance, and delivery you can run year after year.";

export default function About() {
  const [organisation, setOrganisation] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminApiBaseUrl = window._CONFIG_.VITE_ADMIN_PROJECT_URL;
  const userApiBaseUrl = window._CONFIG_.VITE_API_BASE_URL;
  const apiBase = adminApiBaseUrl || userApiBaseUrl;

  useEffect(() => {
    if (!apiBase) {
      setOrganisation(null);
      setLoading(false);
      return;
    }
    axios
      .get(`${apiBase}/organizations/details`)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setOrganisation(raw ?? null);
      })
      .catch(() => setOrganisation(null))
      .finally(() => setLoading(false));
  }, [apiBase]);

  const about = organisation?.orgAboutUs ?? {};
  const mission = typeof about.mission === "string" ? about.mission.trim() : "";
  const vision = typeof about.vision === "string" ? about.vision.trim() : "";
  const orgValues = typeof about.orgValues === "string" ? about.orgValues.trim() : "";
  const orgName =
    typeof organisation?.orgName === "string" && organisation.orgName.trim()
      ? organisation.orgName.trim()
      : "Edukify";

  const hasCmsBody = Boolean(mission || vision || orgValues);

  const director = organisation?.orgDirectorDetail ?? null;
  const directorPhotoRaw =
    typeof director?.directorImage === "string" ? director.directorImage.trim() : "";
  const directorPhotoUrl = directorPhotoRaw ? orgMediaUrl(directorPhotoRaw, apiBase) : "";
  const aboutDirectorCms =
    typeof director?.aboutDirector === "string" ? director.aboutDirector.trim() : "";
  const directorName =
    typeof director?.directorName === "string" && director.directorName.trim()
      ? director.directorName.trim()
      : "Jaspreet Bedi";
  const directorRole =
    typeof director?.role === "string" && director.role.trim() ? director.role.trim() : "";
  const directorBio = aboutDirectorCms || DEFAULT_DIRECTOR_BIO;
  const ownerSocialUrl =
    typeof director?.socialUrl === "string" && director.socialUrl.trim()
      ? director.socialUrl.trim()
      : OWNER_INSTAGRAM_URL;

  const parentCompany = organisation?.orgParentCompany ?? {};
  const parentCompanyName =
    typeof parentCompany?.name === "string" && parentCompany.name.trim()
      ? parentCompany.name.trim()
      : DEFAULT_PARENT_COMPANY_NAME;
  const parentCompanyWebsiteUrl =
    typeof parentCompany?.websiteUrl === "string" && parentCompany.websiteUrl.trim()
      ? parentCompany.websiteUrl.trim()
      : DEFAULT_PARENT_COMPANY_WEBSITE_URL;
  const parentCompanyDescription =
    typeof parentCompany?.description === "string" && parentCompany.description.trim()
      ? parentCompany.description.trim()
      : DEFAULT_PARENT_COMPANY_DESCRIPTION;

  const teamGallery = organisation?.orgTeamGallery ?? {};
  const teamRaw = teamGallery.teamImages;
  const teamGalleryImages = Array.isArray(teamRaw)
    ? teamRaw.map((p) => (typeof p === "string" ? p.trim() : "")).filter(Boolean)
    : [];
  const ourTeamHeading =
    typeof teamGallery.teamSectionTitle === "string" && teamGallery.teamSectionTitle.trim()
      ? teamGallery.teamSectionTitle.trim()
      : "Our Team";

  if (loading) {
    return (
      <div className="flex min-h-[45vh] w-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="w-full bg-white text-[var(--text)]">
      {/* Short intro, then owner block and company block stacked */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            About us
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-snug text-slate-500 sm:text-sm">
            <span className="font-medium text-slate-600">Edukify</span> is developed under{" "}
            <span className="text-slate-700">{parentCompanyName}</span>. Below: the owner, then the parent
            company. Below that: optional mission and values, then{" "}
            <span className="font-medium text-slate-600">Our Team</span> at the end—the same photo set
            as the <Link to="/our-team" className="font-medium text-sky-700 hover:underline">Our Team</Link>{" "}
            page.
          </p>
        </div>
      </header>

      {/* Company & leadership — navy inset panel (matches Home solution-insights) */}
      <section className="px-4 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8">
        <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-700/55 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white shadow-xl shadow-slate-900/25 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <div
            className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-12 bottom-0 h-64 w-64 rounded-full bg-indigo-500/12 blur-3xl"
            aria-hidden
          />
          <div className="relative z-[1]">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Company &amp; leadership
            </h2>
            <p className="mt-1 max-w-5xl text-sm leading-snug text-slate-300">
              Owner first, then the parent company—the people behind Edukify.
            </p>

            <div className="mt-6 flex w-full flex-col gap-5 sm:mt-8 sm:gap-6">
              <div className="rounded-2xl border border-white/10 border-l-4 border-l-sky-500 bg-white p-5 shadow-xl shadow-black/35 sm:p-6">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                      About the owner
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{directorName}</h3>
                    {directorRole ? (
                      <p className="mt-1 text-sm text-slate-500">{directorRole}</p>
                    ) : null}
                  </div>
                  <a
                    href={ownerSocialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-2.5 self-start rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-300/80 hover:bg-sky-50 hover:text-sky-900 sm:mt-0.5"
                  >
                    <i className="ri-instagram-line shrink-0 text-[1.15rem] text-sky-600" aria-hidden />
                    <span className="max-w-[14rem] text-left leading-snug sm:max-w-none">
                      Jaspreet Social Profile
                    </span>
                  </a>
                </div>

                <div
                  className={
                    directorPhotoUrl
                      ? "mt-5 flex flex-col gap-6 sm:flex-row sm:items-start"
                      : "mt-4"
                  }
                >
                  {directorPhotoUrl ? (
                    <div className="shrink-0 sm:max-w-[220px]">
                      <img
                        src={directorPhotoUrl}
                        alt=""
                        className="mx-auto aspect-[3/4] w-full max-w-[280px] rounded-2xl border border-slate-200 object-cover object-top shadow-md sm:mx-0 sm:max-w-none"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 text-lg leading-8 text-slate-700">
                    {directorBio.split(/\n\n+/).map((para, i) => (
                      <p key={i} className={i > 0 ? "mt-4" : undefined}>
                        {para.trim()}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 border-l-4 border-l-sky-500 bg-white p-5 shadow-xl shadow-black/35 sm:p-6">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Parent company
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{parentCompanyName}</h3>
                  </div>
                  <a
                    href={parentCompanyWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-2.5 self-start rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-300/80 hover:bg-sky-50 hover:text-sky-900 sm:mt-0.5"
                  >
                    <i className="ri-global-line shrink-0 text-[1.15rem] text-sky-600" aria-hidden />
                    <span className="max-w-[14rem] text-left leading-snug sm:max-w-none">
                      Seasec company website
                    </span>
                  </a>
                </div>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  {parentCompanyDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Org-owned copy from admin — optional */}
      {hasCmsBody ? (
        <section className="border-t border-slate-200 bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              What {orgName} stands for
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Edited in admin under User Panel → About.
            </p>
            <div className="mt-6 space-y-8 text-[var(--text)] leading-relaxed">
              {mission ? (
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-h)]">Mission</h3>
                  <div className="mt-3 whitespace-pre-line text-slate-600">{mission}</div>
                </div>
              ) : null}
              {vision ? (
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-h)]">Vision</h3>
                  <div className="mt-3 whitespace-pre-line text-slate-600">{vision}</div>
                </div>
              ) : null}
              {orgValues ? (
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-h)]">Values</h3>
                  <div className="mt-3 whitespace-pre-line text-slate-600">{orgValues}</div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Our Team — same photos as /our-team (admin → org team gallery) */}
      <section className="border-t border-slate-200 bg-slate-50 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-serif text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {ourTeamHeading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600">
            {teamGalleryImages.length > 0
              ? "Office and team photos from your admin (User Panel → About → Team photos). This is the same gallery as the dedicated Our Team page."
              : "Add team photos from the admin module under User Panel → About → Team photos. They will appear here and on the Our Team page."}
          </p>

          {teamGalleryImages.length > 0 ? (
            <ul className="mt-8 grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teamGalleryImages.map((path, idx) => (
                <li
                  key={`${path}-${idx}`}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                >
                  <img
                    src={orgMediaUrl(path, apiBase)}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-center text-sm text-slate-600">
              No team photos yet. Upload them in{" "}
              <strong className="font-semibold text-slate-800">
                admin → User Panel → About → Team photos
              </strong>
              .
            </p>
          )}

          <p className="mt-8 text-center">
            <Link
              to="/our-team"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 underline-offset-4 transition hover:text-sky-900 hover:underline"
            >
              <i className="ri-group-line text-lg" aria-hidden />
              Open dedicated Our Team page
            </Link>
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-3xl px-4 py-8 text-center sm:px-6 sm:py-10 lg:px-8">
        <h2 className="font-serif text-lg font-semibold text-slate-900 sm:text-xl">
          Questions or next steps
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Explore the product pages, then get in touch when you are ready.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/contact"
            className="inline-flex rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Contact us
          </Link>
          <Link
            to="/signup"
            className="inline-flex rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Create portal
          </Link>
        </div>
      </section>
    </div>
  );
}
