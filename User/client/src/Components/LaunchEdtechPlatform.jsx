import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { decodeToken } from "../authConfig";
import { showErrorToast, showSuccessToast } from "../utils/toastUtils";

const BASE_DOMAIN = "edukify.com";

function formatTrialExpiryIso(isoDate) {
  if (!isoDate || typeof isoDate !== "string") return "—";
  const s = isoDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function mbFromBytes(bytes) {
  const b = bytes == null ? 0 : Number(bytes);
  if (!Number.isFinite(b) || b < 0) return 0;
  return b / (1024 * 1024);
}

function formatSpaceLeftMb(capMb, usedBytes) {
  if (capMb == null || !Number.isFinite(Number(capMb)) || Number(capMb) <= 0) return "—";
  const cap = Number(capMb);
  const used = mbFromBytes(usedBytes);
  const left = Math.max(0, cap - used);
  const rounded = Math.round(left * 10) / 10;
  const disp = rounded % 1 === 0 ? `${Math.round(left)} MB` : `${rounded.toFixed(1)} MB`;
  return disp;
}

function StepDots({ step, compact = false, ultraCompact = false }) {
  const items = [
    { n: 1, label: "About you" },
    { n: 2, label: "Your link" },
    { n: 3, label: "Go live" },
  ];
  const done = (n) => step === 3 || step > n;
  const dot =
    ultraCompact
      ? "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold sm:h-5 sm:w-5 sm:text-[9px]"
      : compact
        ? "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold sm:h-6 sm:w-6 sm:text-[10px]"
        : "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 sm:h-8 sm:w-8 sm:text-sm";
  const chk = ultraCompact
    ? "ri-check-line text-[9px] sm:text-[10px]"
    : compact
      ? "ri-check-line text-[10px] sm:text-xs"
      : "ri-check-line text-sm sm:text-base";
  const lbl = ultraCompact
    ? "max-w-[3.25rem] text-center text-[6px] font-medium leading-tight sm:text-[7px]"
    : compact
      ? "max-w-[4rem] text-center text-[7px] font-medium leading-tight sm:text-[8px]"
      : "max-w-[4.5rem] text-center text-[9px] font-medium leading-tight sm:max-w-none sm:text-[10px]";

  return (
    <div
      className={`flex justify-center ${ultraCompact ? "gap-0.5 sm:gap-1" : compact ? "gap-1 sm:gap-2" : "gap-1.5 sm:gap-3"}`}
    >
      {items.map(({ n, label }) => (
        <div
          key={n}
          className={`flex flex-col items-center ${ultraCompact || compact ? "gap-0" : "gap-0.5"}`}
        >
          <div
            className={`${dot} transition-all duration-300 ${
              step >= n
                ? "bg-white text-sky-800 shadow-sm ring-1 ring-white/80"
                : "bg-white/25 text-white/90"
            }`}
          >
            {done(n) ? <i className={chk} /> : n}
          </div>
          <span className={`${lbl} ${step >= n ? "text-white" : "text-white/70"}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * variant compact: short hero (default).
 * variant celebration: success screen — slightly larger icon/title.
 * splitLayout: left column beside form on md+ (rounded corners handled per breakpoint).
 * splitBelowBanner: hero sits under full-width row (step 2) — no top rounding, tighter (~30% less height).
 * extraCompactSplit: steps 1 & 2 — further ~30% shorter banner + centered stack (pairs with justify-center on right column).
 */
function LaunchHero({
  step,
  title,
  subtitle,
  highlight,
  variant = "compact",
  splitLayout = false,
  splitBelowBanner = false,
  /** Step 2 only: ~30% shorter split banner vs default tight split */
  extraCompactSplit = false,
  /** When true (e.g. hero sits under a top table card), hero has no top rounding — outer wrapper supplies corners. */
  flatTop = false,
}) {
  const celebration = variant === "celebration";
  const tightSplit = splitLayout && !celebration;
  const xsSplit = tightSplit && extraCompactSplit;

  const pad = celebration
    ? "px-5 py-6 sm:py-7"
    : xsSplit
      ? splitBelowBanner
        ? "px-2 py-1 sm:px-2.5 sm:py-1.5 md:py-1.5"
        : "px-2 py-1 sm:px-2.5 sm:py-1.5"
      : tightSplit
        ? splitBelowBanner
          ? "px-2.5 py-1.5 sm:px-3 sm:py-2 md:py-2"
          : "px-2.5 py-1.5 sm:px-3 sm:py-2"
        : "px-4 py-4 sm:px-5 sm:py-5";

  const iconBox = celebration
    ? "h-16 w-16 rounded-2xl"
    : xsSplit
      ? "h-6 w-6 rounded sm:h-7 sm:w-7"
      : tightSplit
        ? "h-7 w-7 rounded-md sm:h-8 sm:w-8"
        : "h-11 w-11 rounded-xl sm:h-12 sm:w-12";

  const iconSz = celebration
    ? "text-4xl"
    : xsSplit
      ? "text-base sm:text-lg"
      : tightSplit
        ? "text-lg sm:text-xl"
        : "text-2xl sm:text-3xl";

  const titleCls = celebration
    ? "text-xl font-bold leading-snug text-white sm:text-2xl"
    : xsSplit
      ? "text-[11px] font-bold leading-tight text-white sm:text-[12px]"
      : tightSplit
        ? "text-[12px] font-bold leading-tight text-white sm:text-[13px]"
        : "text-base font-bold leading-snug text-white sm:text-lg";

  let roundHero = flatTop ? "rounded-none" : "rounded-t-3xl";
  if (splitLayout && splitBelowBanner) {
    roundHero = "rounded-none md:rounded-bl-3xl md:border-l md:border-white/10";
  } else if (splitLayout) {
    roundHero = flatTop ? "rounded-none md:rounded-none md:rounded-tl-3xl md:rounded-bl-3xl" : "rounded-t-3xl md:rounded-none md:rounded-tl-3xl md:rounded-bl-3xl";
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-cyan-500 text-center text-white shadow-inner ${roundHero} ${tightSplit ? `flex min-h-0 flex-1 flex-col ${xsSplit ? "justify-center" : "justify-start"}` : splitLayout ? "flex min-h-0 flex-1 flex-col justify-center md:py-6" : ""} ${splitBelowBanner ? "border-t border-white/15 md:border-t-0" : ""} ${pad}`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-sky-400/15 blur-2xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-md">
        <p
          className={`inline-flex items-center gap-1 rounded-full bg-white/20 font-semibold uppercase tracking-wider backdrop-blur-sm ${xsSplit ? "mb-0 px-1.5 py-px text-[7px] sm:text-[8px]" : tightSplit ? "mb-0.5 px-1.5 py-px text-[8px] sm:mb-0.5 sm:px-2 sm:py-0.5 sm:text-[9px]" : "mb-2 px-2.5 py-0.5 text-[10px] sm:mb-2.5 sm:text-[11px]"}`}
        >
          <span
            className={`inline-flex animate-pulse rounded-full bg-white ${tightSplit ? "h-0.5 w-0.5 sm:h-0.5 sm:w-0.5" : "h-1 w-1 sm:h-1.5 sm:w-1.5"}`}
          />
          {highlight}
        </p>

        <div className={`flex justify-center ${celebration ? "mb-3" : xsSplit ? "mb-0" : tightSplit ? "mb-0.5" : "mb-2"}`}>
          <div className="relative">
            <div
              className={`flex items-center justify-center bg-white/15 shadow-md ring-2 ring-white/20 backdrop-blur-sm ${iconBox}`}
            >
              <i className={`ri-rocket-2-fill text-white drop-shadow-sm ${iconSz}`} />
            </div>
            {!celebration ? (
              <span
                className={`absolute flex items-center justify-center rounded-full bg-sky-200 text-slate-800 shadow ${xsSplit ? "-right-0 -top-0 h-3 w-3 text-[8px] sm:h-3.5 sm:w-3.5 sm:text-[9px]" : tightSplit ? "-right-0 -top-0 h-3.5 w-3.5 text-[9px] sm:h-4 sm:w-4 sm:text-[10px]" : "-right-0.5 -top-0.5 h-5 w-5 text-xs sm:h-6 sm:w-6"}`}
              >
                ✨
              </span>
            ) : (
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-sky-200 text-base text-slate-800 shadow-md">
                ✨
              </span>
            )}
          </div>
        </div>

        <h1 className={titleCls}>{title}</h1>
        <p
          className={`mx-auto max-w-sm text-white/95 ${celebration ? "mt-1.5 text-xs leading-relaxed sm:mt-2 sm:text-sm sm:text-base" : xsSplit ? "mt-0 line-clamp-2 text-[9px] leading-snug sm:text-[10px]" : tightSplit ? "mt-0.5 line-clamp-2 text-[10px] leading-snug sm:text-[11px]" : "mt-1.5 text-xs leading-relaxed sm:mt-2 sm:text-sm"}`}
        >
          {subtitle}
        </p>
        <div className={celebration ? "mt-4" : xsSplit ? "mt-0.5" : tightSplit ? "mt-1" : "mt-3"}>
          <StepDots compact={tightSplit} ultraCompact={xsSplit} step={step} />
        </div>
      </div>
    </div>
  );
}

export default function LaunchEdtechPlatform({ onPortalPresenceChange }) {
  const userId = decodeToken();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [portal, setPortal] = useState(null);

  const [form, setForm] = useState({
    contactPersonName: "",
    companyName: "",
    address: "",
    phone: "",
    email: "",
  });

  const [subdomain, setSubdomain] = useState("");

  const loadPortal = useCallback(async () => {
    if (userId == null) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/clients/me");
      setPortal(res.data);
      setStep(3);
      onPortalPresenceChange?.(true);
    } catch (err) {
      if (err?.response?.status === 404) {
        setPortal(null);
        onPortalPresenceChange?.(false);
      } else {
        showErrorToast(err?.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, onPortalPresenceChange]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  useEffect(() => {
    if (userId == null || portal) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/users/getUser/${userId}`);
        const u = res.data ?? {};
        if (cancelled) return;
        setForm((f) => ({
          ...f,
          contactPersonName: u.userName || f.contactPersonName,
          phone: u.mobileNo || f.phone,
          email: u.email || f.email,
        }));
      } catch {
        /* optional prefill */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, portal]);

  const handleFormNext = async () => {
    if (!form.contactPersonName?.trim()) {
      showErrorToast("Please add your name so we know who to cheer for.");
      return;
    }
    if (!form.companyName?.trim()) {
      showErrorToast("Please add your organization name.");
      return;
    }
    try {
      const res = await api.get("/clients/suggest-subdomain", {
        params: { company: form.companyName.trim() },
      });
      const sug = res.data?.subdomain || "portal";
      setSubdomain(sug);
      setStep(2);
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "Could not prepare your link. Try again.");
    }
  };

  const handleLaunch = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/clients/launch", {
        contactPersonName: form.contactPersonName.trim(),
        companyName: form.companyName.trim(),
        address: form.address?.trim() || "",
        phone: form.phone?.trim() || "",
        email: form.email?.trim() || "",
        subdomain: subdomain.trim(),
      });
      setPortal(res.data);
      onPortalPresenceChange?.(true);
      showSuccessToast("You're live on Edukify — welcome aboard!");
      setStep(3);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Something went wrong. Try again or pick a different site name.";
      showErrorToast(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (userId == null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <i className="ri-lock-2-line mb-3 text-4xl text-sky-500" />
        <p className="text-slate-600">Sign in first — then your launch pad will appear here.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white py-12 shadow-sm">
        <div
          className="h-14 w-14 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500"
          aria-hidden
        />
        <p className="mt-6 text-base font-medium text-slate-600">Getting things ready for you…</p>
      </div>
    );
  }

  if (step === 3 && portal) {
    const dash = (v) => (v != null && String(v).trim() !== "" ? String(v).trim() : "—");
    const allocatedMb =
      portal.storageAllocatedMb != null && Number.isFinite(Number(portal.storageAllocatedMb))
        ? Number(portal.storageAllocatedMb)
        : null;
    const allocatedLabel = allocatedMb != null ? `${Math.round(allocatedMb)} MB` : "—";

    const subNormalized = String(portal.subscription || "Trial").trim();
    const isTrial =
      !subNormalized || subNormalized.toLowerCase() === "trial";
    const expiryDisplay =
      isTrial && portal.trialExpiresOn ? formatTrialExpiryIso(portal.trialExpiresOn) : "—";

    const spaceLeft = formatSpaceLeftMb(allocatedMb, portal.storageUsedBytes);

    return (
      <div className="mx-auto w-full max-w-none overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-sky-900/10">
        <div className="min-w-0 overflow-x-auto border-b border-gray-200">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "40%" }} />
            </colgroup>
            <thead className="border-b border-gray-200 bg-[#f9fafb] text-left text-gray-600">
              <tr>
                <th className="py-2.5 pl-3 pr-2 font-semibold">Company</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">Expiration</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">Space assigned</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">Space left</th>
                <th className="py-2.5 pr-8 pl-2 font-semibold whitespace-nowrap">Plan</th>
                <th className="py-2.5 pr-3 pl-8 font-semibold">Links</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 bg-white align-top text-gray-800">
                <td className="py-5 pl-3 pr-2 align-top font-medium">{dash(portal.companyName)}</td>
                <td className="py-5 px-2 align-top text-xs whitespace-nowrap sm:text-sm">{expiryDisplay}</td>
                <td className="py-5 px-2 align-top whitespace-nowrap font-medium text-slate-800 text-xs sm:text-sm">
                  {allocatedLabel}
                </td>
                <td className="py-5 px-2 align-top whitespace-nowrap font-medium text-slate-800 text-xs sm:text-sm">
                  {spaceLeft}
                </td>
                <td className="py-5 pr-10 pl-2 align-top whitespace-nowrap">
                  <div className="flex flex-col items-start gap-2">
                    <span className="inline-flex rounded-full bg-sky-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      {portal.subscription || "Trial"}
                    </span>
                    {isTrial ? (
                      <Link
                        to="/account/buynow"
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-sky-600 underline-offset-2 hover:text-sky-800 hover:underline"
                      >
                        <i className="ri-shopping-bag-3-line text-sm" aria-hidden />
                        Upgrade Plan
                      </Link>
                    ) : null}
                  </div>
                </td>
                <td className="py-5 pr-3 pl-8 align-top md:pl-10">
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Website</p>
                      {portal.siteUrl ? (
                        <a
                          href={portal.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex max-w-max items-center gap-1.5 whitespace-nowrap text-sm font-medium text-sky-700 hover:underline"
                        >
                          <span>{portal.siteUrl}</span>
                          <i className="ri-external-link-line shrink-0 text-slate-400" aria-hidden />
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Admin Panel</p>
                      {portal.adminUrl ? (
                        <a
                          href={portal.adminUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex max-w-max items-center gap-1.5 whitespace-nowrap text-sm font-medium text-sky-700 hover:underline"
                        >
                          <span>{portal.adminUrl}</span>
                          <i className="ri-external-link-line shrink-0 text-slate-400" aria-hidden />
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">—</p>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <LaunchHero
          variant="celebration"
          step={3}
          flatTop
          highlight="You're in"
          title="Your Edukify space is ready"
          subtitle="Bookmark these links — open them anytime to welcome learners and run your school. Explore more as you grow."
        />

        <div className="border-t border-sky-100/60 bg-slate-50/50 px-5 py-4 text-center text-xs text-slate-500 sm:px-6">
          Company contact (person, phone, mail, address) is in <span className="font-medium text-slate-600">My Account → Profile</span>.
          Links may take a moment to open everywhere — that&apos;s normal while we finish setup behind the scenes.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {step === 1 && (
        <div className="flex flex-col overflow-hidden rounded-3xl border border-sky-100/80 bg-white shadow-xl shadow-sky-900/10 md:flex-row md:items-stretch">
          <div className="flex shrink-0 flex-col md:w-[38%] md:min-w-[220px] md:max-w-[280px] md:self-stretch">
            <LaunchHero
              splitLayout
              extraCompactSplit
              step={1}
              highlight="Quick setup"
              title="You're one step away from launch"
              subtitle="A friendly hello and your organization name — then we'll reserve your space on Edukify. It only takes a minute."
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-3 border-t border-sky-100/60 bg-white px-5 py-5 md:border-l md:border-t-0 md:px-6 md:py-6 lg:px-7 rounded-b-3xl md:rounded-bl-none md:rounded-br-3xl md:rounded-tr-3xl">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Your name</span>
              <input
                type="text"
                placeholder="How should we greet you?"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                value={form.contactPersonName}
                onChange={(e) => setForm((f) => ({ ...f, contactPersonName: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Organization name</span>
              <input
                type="text"
                placeholder="School or company name"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Address</span>
              <textarea
                placeholder="Optional — helps us keep your records tidy"
                className="mt-1.5 w-full min-h-[88px] resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <input
                type="tel"
                placeholder="So we can reach you if needed"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                placeholder="We'll send helpful updates here"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <button
              type="button"
              onClick={handleFormNext}
              className="group relative mt-1 w-full overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-xl hover:shadow-sky-500/30 sm:py-3.5 sm:text-base"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Next — pick your website link
                <i className="ri-arrow-right-line text-lg transition-transform group-hover:translate-x-1 sm:text-xl" />
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col overflow-hidden rounded-3xl border border-sky-100/80 bg-white shadow-xl shadow-sky-900/10 md:flex-row md:items-stretch">
          <div className="flex shrink-0 flex-col md:w-[38%] md:min-w-[220px] md:max-w-[280px] md:self-stretch">
            <LaunchHero
              splitLayout
              extraCompactSplit
              step={2}
              highlight="Almost there"
              title="Choose how your website looks in the browser"
              subtitle="Pick the short name in front of Edukify — that's how students will find you. Tap it if you want to change it."
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-4 border-t border-sky-100/60 bg-white px-5 py-5 md:border-l md:border-t-0 md:px-6 md:py-6 lg:px-7 rounded-b-3xl md:rounded-bl-none md:rounded-br-3xl md:rounded-tr-3xl">
            <div className="rounded-xl border-2 border-dashed border-sky-200 bg-gradient-to-b from-slate-50/80 to-white p-4 sm:p-5">
              <p className="mb-2 text-center text-sm font-medium text-slate-600">
                Your website will look like this
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-base sm:text-lg">
                <span className="font-medium text-slate-400">https://</span>
                <input
                  type="text"
                  className="min-w-[100px] max-w-[180px] rounded-lg border-2 border-sky-500 bg-white px-3 py-2 text-center font-bold text-sky-800 shadow-inner outline-none focus:ring-2 focus:ring-sky-400"
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  autoComplete="off"
                  aria-label="Your site name"
                />
                <span className="font-medium text-slate-500">.{BASE_DOMAIN}</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
              <span className="font-medium text-slate-700">Public site</span>
              <div className="mt-1 break-all font-mono text-xs text-slate-500 sm:text-sm">
                https://{subdomain || "your-site"}.{BASE_DOMAIN}/
              </div>
              <span className="mt-3 inline-block font-medium text-slate-700">Admin Panel</span>
              <div className="mt-1 break-all font-mono text-xs text-slate-500 sm:text-sm">
                https://{subdomain || "your-site"}.{BASE_DOMAIN}/admin
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50 sm:py-3.5"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting || !subdomain.trim()}
                onClick={handleLaunch}
                className="flex-[1.2] rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 py-3 font-bold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Launching…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-rocket-line text-lg" />
                    Launch my website
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
