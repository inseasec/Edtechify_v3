import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import TwoColTable from "../components/TwoColTable";
import {
  courseGovernanceRows,
  homepageMerchandisingRows,
  learningCatalogTypes,
  rbacConcepts,
  solutionInsightSlugSet,
  solutionInsightTiles,
} from "../data/solutionInsightsData";

function InsightShell({ eyebrow, title, children }) {
  const { slug: currentSlug } = useParams();
  const otherTiles = solutionInsightTiles.filter((t) => t.slug !== currentSlug);

  return (
    <div className="w-full bg-white text-[var(--text)]">
      <article className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <div className="mt-10">{children}</div>
        <div className="mt-14 border-t border-slate-200 pt-10">
          <p className="text-sm font-medium text-slate-700">More in this series</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {otherTiles.map((t) => (
              <li key={t.slug}>
                <Link
                  to={`/solution/${t.slug}`}
                  className="block rounded-lg border border-slate-200 bg-sky-50/40 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link to="/solution" className="font-semibold text-sky-700 underline-offset-4 hover:underline">
              Solution hub (tabs)
            </Link>
            <Link to="/#solution-insights" className="font-medium text-slate-600 underline-offset-4 hover:underline">
              Home overview
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function LearningCatalogInsight() {
  return (
    <InsightShell eyebrow="Solution insight" title="Learning catalog — three course types">
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
        You can run comprehensive programs, notes-led material, or video-first courses—or combine
        them. Adopt one, two, or all three depending on how your institute teaches and sells.
      </p>
      <div className="mt-8">
        <TwoColTable
          leftHeader="Type"
          rightHeader="Positioning"
          rows={learningCatalogTypes.map((r) => ({ left: r.type, right: r.positioning }))}
        />
      </div>
    </InsightShell>
  );
}

function RbacInsight() {
  return (
    <InsightShell
      eyebrow="Solution insight"
      title="Organizational structure and access control (RBAC)"
    >
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
        The admin experience reflects real institutes: departments, roles, and scoped permissions—not
        a single “admin sees everything” model.
      </p>
      <div className="mt-8">
        <TwoColTable
          leftHeader="Concept"
          rightHeader="Offering"
          rows={rbacConcepts.map((r) => ({ left: r.concept, right: r.offering }))}
        />
      </div>
      <p className="mt-6 text-sm leading-relaxed text-slate-600">
        Internally you may see labels such as Team Admin and Sub Admin; for business and training
        materials we standardize on <span className="font-medium text-slate-800">HOD</span> and{" "}
        <span className="font-medium text-slate-800">instructor</span> where clarity matters.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Permissions combine role-based access with data scope (department plus course ownership), so
        access stays predictable and auditable.
      </p>
    </InsightShell>
  );
}

function GovernanceInsight() {
  return (
    <InsightShell eyebrow="Solution insight" title="Course governance — publish, freeze, and safe editing">
      <TwoColTable
        leftHeader="Offering"
        rightHeader="Description"
        rows={courseGovernanceRows.map((r) => ({ left: r.offering, right: r.description }))}
      />
      <p className="mt-6 text-sm leading-relaxed text-slate-600">
        This model supports quality, compliance, and operational safety for production catalogs.
      </p>
    </InsightShell>
  );
}

function StagingInsight() {
  return (
    <InsightShell
      eyebrow="Solution insight"
      title="Live courses and long-running enhancements (staging and approval)"
    >
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="rounded-xl border border-slate-200 bg-sky-50/50 p-6 shadow-sm sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">
            Problem addressed
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Large catalogs may need substantial updates across many courses over months. Editing live
            content in place would confuse active subscribers and is unsafe operationally; taking the
            whole site offline for months is not acceptable either.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-sky-50/50 p-6 shadow-sm sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">Offering</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            A super user can start course update mode: the system creates a working copy of the course
            content. Learners stay on the unchanged live version while HOD or instructors work on the
            copy.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-sky-50/50 p-6 shadow-sm sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">
            Publish pipeline
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            When the draft is ready, changes are submitted for publication. The super user accepts—then
            changes replace or merge into the live experience per product rules—or may reject the update
            and revert.
          </p>
        </div>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-slate-600">
        That delivers parallel improvement cycles without breaking subscriptions or active progress on
        the current live course.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Policy for learners mid-course when structure changes—for example pinning to an older outline
        versus migrating—can be documented separately for your rollout.
      </p>
    </InsightShell>
  );
}

function BrandingInsight() {
  return (
    <InsightShell eyebrow="Solution insight" title="Branding & content surfaces">
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
        You can tailor visual and narrative identity to a large extent while staying inside the
        design system the platform provides—so each portal is clearly your institute, not an anonymous
        template.
      </p>
      <ul className="mt-6 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 sm:text-base">
        <li>
          <span className="font-semibold text-slate-800">Logo</span> — your mark on the experience
          learners and families recognize.
        </li>
        <li>
          <span className="font-semibold text-slate-800">About Us (and related pages)</span> — mission,
          trust, and institutional story on pages you control.
        </li>
        <li>
          <span className="font-semibold text-slate-800">Homepage and other banners</span> — hero and
          promotional media that set the tone when someone lands on your portal.
        </li>
      </ul>
    </InsightShell>
  );
}

function MerchandisingInsight() {
  return (
    <InsightShell eyebrow="Solution insight" title="Homepage & merchandising control">
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
        Together with branding, the first screen of the portal becomes a merchandising surface you
        control—without redeploying custom front-end code for every layout tweak.
      </p>
      <div className="mt-8">
        <TwoColTable
          leftHeader="Offering"
          rightHeader="Description"
          rows={homepageMerchandisingRows.map((r) => ({ left: r.offering, right: r.description }))}
        />
      </div>
    </InsightShell>
  );
}

export default function SolutionInsightDetail() {
  const { slug } = useParams();

  if (!slug || !solutionInsightSlugSet.has(slug)) {
    return <Navigate to="/solution" replace />;
  }

  switch (slug) {
    case "learning-catalog":
      return <LearningCatalogInsight />;
    case "organization-rbac":
      return <RbacInsight />;
    case "course-governance":
      return <GovernanceInsight />;
    case "live-course-staging":
      return <StagingInsight />;
    case "branding-content-surfaces":
      return <BrandingInsight />;
    case "homepage-merchandising":
      return <MerchandisingInsight />;
    default:
      return <Navigate to="/solution" replace />;
  }
}
