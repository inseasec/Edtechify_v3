import React from "react";

export default function PlatformOffering() {
  return (
    <div className="w-full bg-white text-[var(--text)]">
      <header className="border-b border-slate-200 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300/90">
            The core offering
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-[clamp(2rem,1.2rem+2.8vw,3.25rem)] font-semibold leading-tight tracking-tight text-white">
            Two branded portals — everything else builds on them
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Subscribing to Edukify means your institute runs on{" "}
            <span className="font-semibold text-white">two connected experiences</span>: one for
            learners and the public face of your programs, and one for your staff to author, govern,
            and operate. You are not licensing a loose bag of disconnected features—you are getting a
            product shaped for schools and training companies.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <section className="rounded-2xl border border-slate-200 bg-sky-50/50 p-8 shadow-sm sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-200/80 text-sky-900">
                <i className="ri-group-line text-xl" aria-hidden />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Learner portal</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              The experience students and families actually use: aligned with your brand, scoped to what
              you choose to publish, and designed for discovery through completion—not a bolt-on brochure
              site that sends people elsewhere to learn.
            </p>
            <ul className="mt-5 list-none space-y-3 text-sm leading-relaxed text-slate-700 sm:text-[0.9375rem]">
              <li className="flex gap-3">
                <i className="ri-arrow-right-s-line mt-0.5 shrink-0 text-sky-600" aria-hidden />
                <span>Find and enroll in courses; consume structured content your team approves.</span>
              </li>
              <li className="flex gap-3">
                <i className="ri-arrow-right-s-line mt-0.5 shrink-0 text-sky-600" aria-hidden />
                <span>Account, progress, and support touchpoints in one coherent place.</span>
              </li>
              <li className="flex gap-3">
                <i className="ri-arrow-right-s-line mt-0.5 shrink-0 text-sky-600" aria-hidden />
                <span>Homepage and merchandising you control—so the first screen sells your programs.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-indigo-50/40 p-8 shadow-sm sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-200/70 text-indigo-900">
                <i className="ri-dashboard-3-line text-xl" aria-hidden />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Admin portal</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Where your institute does the real work: building and maintaining the catalog under rules
              that protect live learners—departments, roles, publish/freeze, and staging for big updates.
            </p>
            <ul className="mt-5 list-none space-y-3 text-sm leading-relaxed text-slate-700 sm:text-[0.9375rem]">
              <li className="flex gap-3">
                <i className="ri-arrow-right-s-line mt-0.5 shrink-0 text-indigo-600" aria-hidden />
                <span>Course structure, media, notes, and formats that match how you teach.</span>
              </li>
              <li className="flex gap-3">
                <i className="ri-arrow-right-s-line mt-0.5 shrink-0 text-indigo-600" aria-hidden />
                <span>Organizational model: instructors, heads of department, super users—with clear scope.</span>
              </li>
              <li className="flex gap-3">
                <i className="ri-arrow-right-s-line mt-0.5 shrink-0 text-indigo-600" aria-hidden />
                <span>Governance so production content is not edited in place without control.</span>
              </li>
            </ul>
          </section>
        </div>

        <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 sm:px-8 sm:py-10">
          <h2 className="font-serif text-xl font-semibold text-slate-900 sm:text-2xl">
            What this replaces — in plain language
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Many institutes today juggle a marketing website, an LMS or video host, shared drives,
            spreadsheets, and ad hoc messages. Edukify is built so your subscription covers the Learner
            portal and Admin portal together—reducing that fragmentation for both your team and your
            audience.
          </p>
        </section>
      </div>
    </div>
  );
}
