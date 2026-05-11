import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { orgMediaUrl } from "../utils/orgMediaUrl";

export default function OurTeam() {
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

  const team = organisation?.orgTeamGallery ?? {};
  const title =
    typeof team.teamSectionTitle === "string" && team.teamSectionTitle.trim()
      ? team.teamSectionTitle.trim()
      : "Our Team";
  const images = Array.isArray(team.teamImages) ? team.teamImages : [];

  return (
    <div className="w-full">
      <header className="border-b border-sky-100 bg-gradient-to-b from-sky-50/80 to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold text-[var(--text-h)] sm:text-4xl">{title}</h1>
          <p className="mt-3 text-[var(--text)] leading-relaxed">
            {images.length > 0
              ? "Office and team photos managed from your admin (User Panel → About → Team photos)."
              : "Add team photos from the admin module under User Panel → About. They also appear at the end of the About us page."}
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
          <p className="text-center text-sm text-slate-600">
            No team photos yet. Upload them in{" "}
            <strong className="font-semibold text-slate-800">admin → User Panel → About → Team photos</strong>.
          </p>
        )}

        <div className="mt-12 rounded-2xl border border-sky-100 bg-sky-50/50 px-6 py-8 text-center">
          <p className="mx-auto max-w-xl text-[var(--text)]">
            Product and marketing imagery lives on the{" "}
            <Link to="/gallery" className="font-semibold text-sky-700 underline-offset-4 hover:underline">
              Gallery
            </Link>{" "}
            page.
          </p>
        </div>
      </section>
    </div>
  );
}
