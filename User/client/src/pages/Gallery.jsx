import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { orgMediaUrl } from "../utils/orgMediaUrl";

const placeholderTiles = [
  {
    title: "Learner home",
    caption: "Branded hero, course rows by type and department—only what you sell.",
    gradient: "from-violet-600/90 to-indigo-800/90",
  },
  {
    title: "Admin course grid",
    caption: "Publish, freeze, and coordinated updates for production catalogs.",
    gradient: "from-sky-600/90 to-cyan-800/90",
  },
  {
    title: "Comprehensive courses",
    caption: "Chapters, topics, media, notes, and engagement in one structured path.",
    gradient: "from-emerald-600/90 to-teal-900/90",
  },
];

export default function Gallery() {
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

  const gallery = organisation?.orgGallery ?? {};
  const title =
    typeof gallery.galleryTitle === "string" && gallery.galleryTitle.trim()
      ? gallery.galleryTitle.trim()
      : "Gallery";
  const images = Array.isArray(gallery.galleryImages) ? gallery.galleryImages : [];

  return (
    <div className="w-full">
      <header className="border-b border-sky-100 bg-gradient-to-b from-sky-50/80 to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--text-h)]">{title}</h1>
          <p className="mt-3 text-[var(--text)] leading-relaxed">
            {images.length > 0
              ? "Product and marketing images below are managed from the admin (User Panel → Home → Gallery)."
              : "Upload product images from the admin under User Panel → Home → Gallery. Until then, here are layout placeholders."}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-center text-sm text-slate-500">Loading…</p>
        ) : images.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((path, idx) => (
              <li
                key={`${path}-${idx}`}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <img
                  src={orgMediaUrl(path, apiBase)}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {placeholderTiles.map((tile) => (
              <li
                key={tile.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md"
              >
                <div
                  className={`relative aspect-[4/3] bg-gradient-to-br ${tile.gradient} flex items-end p-5`}
                >
                  <div
                    className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-80"
                    aria-hidden
                  />
                  <p className="relative text-lg font-semibold text-white">{tile.title}</p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-[var(--text)] leading-relaxed">{tile.caption}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Placeholder — add product images in admin
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 rounded-2xl border border-sky-100 bg-sky-50/50 px-6 py-8 text-center">
          <p className="text-[var(--text)] max-w-xl mx-auto">
            This page is for <strong className="font-semibold text-slate-800">product</strong> imagery.
            Team photos are on{" "}
            <Link to="/our-team" className="font-semibold text-sky-700 underline-offset-4 hover:underline">
              Our Team
            </Link>
            .
          </p>
          <Link
            to="/signup"
            className="mt-5 inline-flex rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Launch your preview portal
          </Link>
        </div>
      </section>
    </div>
  );
}
