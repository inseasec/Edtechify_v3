import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  solutionHubTabs,
  solutionInsightTiles,
} from "../data/solutionInsightsData";

const tabIds = solutionHubTabs.map((t) => t.id);

function validTab(id) {
  return tabIds.includes(id) ? id : tabIds[0];
}

export default function SolutionHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qp = searchParams.get("tab");
  const tabFromUrl = qp ? validTab(qp) : tabIds[0];
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const setTab = (id) => {
    const next = validTab(id);
    setActiveTab(next);
    setSearchParams(next === tabIds[0] ? {} : { tab: next }, { replace: true });
  };

  return (
    <div className="w-full bg-white text-[var(--text)]">
      <header className="border-b border-slate-200 bg-gradient-to-b from-sky-50/80 to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Solution</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            How Edukify fits your institute
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Your subscription centres on{" "}
            <Link to="/platform" className="font-semibold text-sky-700 hover:underline">
              two portals
            </Link>{" "}
            (learners + staff)—the topics below explain how catalogs, governance, branding, and
            merchandising work inside that product. Open any tile for detail.
          </p>

          <div
            role="tablist"
            aria-label="Solution topics"
            className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3"
          >
            {solutionHubTabs.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`solution-tab-${tab.id}`}
                  aria-controls={`solution-panel-${tab.id}`}
                  onClick={() => setTab(tab.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition sm:min-w-[14rem] ${
                    selected
                      ? "border-sky-500 bg-white text-slate-900 shadow-md shadow-sky-900/10 ring-2 ring-sky-400/30"
                      : "border-slate-200 bg-white/80 text-slate-700 hover:border-sky-300 hover:bg-white"
                  }`}
                >
                  <span className="block">{tab.label}</span>
                  <span className="mt-1 block text-xs font-normal leading-snug text-slate-500">
                    {tab.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-11 lg:px-8">
        {solutionHubTabs.map((tab) => (
          <section
            key={tab.id}
            id={`solution-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`solution-tab-${tab.id}`}
            hidden={activeTab !== tab.id}
          >
            <ul className="grid list-none gap-6 sm:grid-cols-2 lg:gap-8">
              {solutionInsightTiles
                .filter((tile) => tile.hubCategory === tab.id)
                .map((tile) => (
                <li key={tile.slug}>
                  <Link
                    to={`/solution/${tile.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/50 p-6 shadow-sm ring-1 ring-slate-100 transition hover:border-sky-300 hover:shadow-md hover:ring-sky-200/90 sm:p-7"
                  >
                    <span className="text-lg font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-sky-900">
                      {tile.title}
                    </span>
                    <div className="mt-3 flex-1">
                      <ul className="list-none space-y-2.5 text-sm leading-snug text-slate-600">
                        {tile.hubPoints.map((point, idx) => (
                          <li key={idx} className="flex gap-2.5">
                            <span
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600"
                              aria-hidden
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <span className="mt-4 text-sm font-semibold text-sky-700 group-hover:underline">
                      Read more
                    </span>
                  </Link>
                </li>
                ))}
            </ul>
          </section>
        ))}
        <p className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
          <Link to="/#solution-insights" className="font-semibold text-sky-700 hover:underline">
            Back to home overview
          </Link>
        </p>
      </div>
    </div>
  );
}
