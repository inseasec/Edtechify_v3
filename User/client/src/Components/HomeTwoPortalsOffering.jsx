import React from "react";
import { Link } from "react-router-dom";

/**
 * Major offering callout: subscription = learner portal + admin portal (not a single “feature tile”).
 */
export default function HomeTwoPortalsOffering() {
  return (
    <section
      id="two-portals"
      className="scroll-mt-16 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      aria-labelledby="two-portals-heading"
    >
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-700/55 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 text-white shadow-xl shadow-slate-900/25 sm:px-6 sm:py-14 lg:px-8">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-12 bottom-0 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl"
          aria-hidden
        />

        <div className="relative z-[1]">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/90">
            What your subscription is
          </p>
          <h2
            id="two-portals-heading"
            className="mt-2.5 text-center font-serif text-[clamp(1.65rem,1rem+2.5vw,2.5rem)] font-semibold leading-[1.12] tracking-tight text-white"
          >
            Two portals — not a patchwork of apps
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-relaxed text-slate-300 sm:text-base">
            When you subscribe to Edukify, you receive a{" "}
            <span className="font-semibold text-white">complete, branded product</span>: a portal for
            learners and families, and a separate portal for your staff.
          </p>

          <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col rounded-2xl border border-white/10 bg-white p-7 shadow-2xl shadow-black/40 sm:p-8">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700"
                  aria-hidden
                >
                  <i className="ri-group-line text-2xl" />
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Learner portal
                  </h3>
                  <p className="text-sm font-medium text-sky-800">Public-facing under your brand</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Discovery, enrollment, consuming courses, account, and support touchpoints—aligned with
                how you present your institute to students and parents.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
                <li className="flex gap-2">
                  <i className="ri-check-line mt-0.5 shrink-0 text-sky-600" aria-hidden />
                  <span>Browse and enroll in what you publish—comprehensive, notes-style, or video-led.</span>
                </li>
                <li className="flex gap-2">
                  <i className="ri-check-line mt-0.5 shrink-0 text-sky-600" aria-hidden />
                  <span>One credible, on-brand place instead of a separate marketing site plus tools.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col rounded-2xl border border-white/10 bg-white p-7 shadow-2xl shadow-black/40 sm:p-8">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"
                  aria-hidden
                >
                  <i className="ri-dashboard-3-line text-2xl" />
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Admin portal
                  </h3>
                  <p className="text-sm font-medium text-indigo-900/80">For your team’s day-to-day work</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Course creation and structure, publishing and freeze rules, departments and roles—and the
                controls your institute needs to run learning at scale.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
                <li className="flex gap-2">
                  <i className="ri-check-line mt-0.5 shrink-0 text-indigo-600" aria-hidden />
                  <span>RBAC that mirrors real orgs: instructors, HODs, super users—not one flat admin.</span>
                </li>
                <li className="flex gap-2">
                  <i className="ri-check-line mt-0.5 shrink-0 text-indigo-600" aria-hidden />
                  <span>
                    Staging and approval for live courses so improvements do not disrupt paying classes.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
            <Link
              to="/platform"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/30 transition hover:bg-sky-400"
            >
              How the two portals fit together
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/12"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
