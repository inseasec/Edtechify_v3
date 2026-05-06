import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { orgMediaUrl } from "../utils/orgMediaUrl";

export default function Contact() {
  const [organisation, setOrganisation] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const userApiBaseUrl = window._CONFIG_.VITE_API_BASE_URL;
  const adminApiBaseUrl = window._CONFIG_.VITE_ADMIN_PROJECT_URL;
  const apiBase = adminApiBaseUrl || userApiBaseUrl;

  useEffect(() => {
    if (!apiBase) {
      setLoadError(true);
      return;
    }
    const token = localStorage.getItem("authToken");
    axios
      .get(`${apiBase}/organizations/details`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setOrganisation(res.data ?? null))
      .catch(() => setLoadError(true));
  }, [apiBase]);

  const email = (organisation?.orgEmail ?? "").trim();
  const phone = (organisation?.orgPhone ?? "").trim();
  const addressRows = Array.isArray(organisation?.orgAddresses)
    ? organisation.orgAddresses
    : [];
  const fallbackAddress = (organisation?.orgAddress ?? "").trim();
  const orgName =
    typeof organisation?.orgName === "string" && organisation.orgName.trim()
      ? organisation.orgName.trim()
      : "Edukify";
  const parentCompanyName =
    typeof organisation?.orgParentCompany?.name === "string" &&
    organisation.orgParentCompany.name.trim()
      ? organisation.orgParentCompany.name.trim()
      : "";

  const mailto =
    email &&
    `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Inquiry — ${orgName}`)}`;

  return (
    <div className="w-full">
      <header className="border-b border-sky-100 bg-gradient-to-b from-sky-50/80 to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--text-h)]">Contact us</h1>
          <p className="mt-3 text-[var(--text)] leading-relaxed">
            Questions about launching your portal, plans, or partnerships—use the details from
            your organization profile (editable in admin CRM) or send us an email.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          {!organisation && !loadError ? (
            <p className="mt-4 text-sm text-slate-500">Loading contact details…</p>
          ) : null}
          {loadError && !organisation ? (
            <p className="mt-4 text-sm text-[var(--text)]">
              We couldn&apos;t load organization details. Check API configuration, or sign in and
              try again.
            </p>
          ) : null}
          {organisation ? (
            <ul className="mt-2 space-y-4 text-[var(--text)]">
              {organisation.orgLogo ? (
                <li>
                  <img
                    src={orgMediaUrl(organisation.orgLogo, apiBase)}
                    alt=""
                    className="h-12 w-auto object-contain"
                  />
                </li>
              ) : null}
              {parentCompanyName ? (
                <li>
                  <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Parent company
                  </span>
                  <span className="text-[var(--text-h)] font-medium">{parentCompanyName}</span>
                </li>
              ) : null}
              {addressRows.length ? (
                <li>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {addressRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                      >
                        {row?.label ? (
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                            {row.label}
                          </div>
                        ) : null}
                        <div className="mt-1 whitespace-pre-line leading-relaxed">
                          {row?.address ?? ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </li>
              ) : fallbackAddress ? (
                <li>
                  <span className="whitespace-pre-line">{fallbackAddress}</span>
                </li>
              ) : null}
              {phone ? (
                <li>
                  <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Phone
                  </span>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-sky-700 hover:underline">
                    {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li>
                  <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Email
                  </span>
                  <a href={mailto} className="text-sky-700 hover:underline break-all">
                    {email}
                  </a>
                </li>
              ) : null}
              {!fallbackAddress && !addressRows.length && !phone && !email ? (
                <li className="text-sm text-slate-500">
                  Add address, phone, and email in <strong>User Panel → Home</strong> (footer
                  section) or organization settings—they sync to this page.
                </li>
              ) : null}
            </ul>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-h)]">Quick actions</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--text)]">
            <li>
              {mailto ? (
                <a
                  href={mailto}
                  className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-800"
                >
                  Send an email
                </a>
              ) : (
                <span className="text-slate-500">Configure org email in admin to enable mailto.</span>
              )}
            </li>
            <li className="pt-2 border-t border-slate-200/80">
              <Link to="/signin" className="font-medium text-sky-700 hover:underline">
                Sign in
              </Link>{" "}
              for account and billing.
            </li>
            <li>
              <Link to="/signup" className="font-medium text-sky-700 hover:underline">
                Create your portal
              </Link>
              .
            </li>
          </ul>
          <p className="mt-6 text-xs text-slate-500 leading-relaxed">
            Contact fields are read from the same organization record as the public site footer—
            update once in admin, reflected everywhere.
          </p>
        </section>
      </div>
    </div>
  );
}
