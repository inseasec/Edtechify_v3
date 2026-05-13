import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { decodeToken } from "../authConfig";
import { showErrorToast, showSuccessToast } from "../utils/toastUtils";
import { getApiErrorMessage } from "../utils/authPayload";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { portalLiveDisplay } from "../utils/portalLiveUtils";
import { describeCountryCodeError } from "../utils/phoneCountryValidation";
import { formatMobileForApi, parsePhonePrefill } from "../utils/phoneValidation";
import { deriveLaunchContactLocks, resolveLaunchOtpRequirements } from "../utils/signupChannel";
import { ensureContactAvailable } from "../utils/contactAvailability";

const BASE_DOMAIN = "edukify.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COUNTRY_CODES = [
  { code: "+1", iso: "US", label: "United States / Canada (+1)" },
  { code: "+7", iso: "RU", label: "Russia / Kazakhstan (+7)" },
  { code: "+20", label: "Egypt (+20)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+30", label: "Greece (+30)" },
  { code: "+31", label: "Netherlands (+31)" },
  { code: "+32", label: "Belgium (+32)" },
  { code: "+33", label: "France (+33)" },
  { code: "+34", label: "Spain (+34)" },
  { code: "+36", label: "Hungary (+36)" },
  { code: "+39", label: "Italy (+39)" },
  { code: "+40", label: "Romania (+40)" },
  { code: "+41", label: "Switzerland (+41)" },
  { code: "+43", label: "Austria (+43)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+45", label: "Denmark (+45)" },
  { code: "+46", label: "Sweden (+46)" },
  { code: "+47", label: "Norway (+47)" },
  { code: "+48", label: "Poland (+48)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+51", label: "Peru (+51)" },
  { code: "+52", label: "Mexico (+52)" },
  { code: "+53", label: "Cuba (+53)" },
  { code: "+54", label: "Argentina (+54)" },
  { code: "+55", label: "Brazil (+55)" },
  { code: "+56", label: "Chile (+56)" },
  { code: "+57", label: "Colombia (+57)" },
  { code: "+58", label: "Venezuela (+58)" },
  { code: "+60", label: "Malaysia (+60)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+62", label: "Indonesia (+62)" },
  { code: "+63", label: "Philippines (+63)" },
  { code: "+64", label: "New Zealand (+64)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+66", label: "Thailand (+66)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+82", label: "South Korea (+82)" },
  { code: "+84", label: "Vietnam (+84)" },
  { code: "+86", label: "China (+86)" },
  { code: "+90", label: "Turkey (+90)" },
  { code: "+91", iso: "IN", label: "India (+91)" },
  { code: "+92", label: "Pakistan (+92)" },
  { code: "+93", label: "Afghanistan (+93)" },
  { code: "+94", label: "Sri Lanka (+94)" },
  { code: "+95", label: "Myanmar (+95)" },
  { code: "+98", label: "Iran (+98)" },
  { code: "+212", label: "Morocco (+212)" },
  { code: "+213", label: "Algeria (+213)" },
  { code: "+216", label: "Tunisia (+216)" },
  { code: "+218", label: "Libya (+218)" },
  { code: "+220", label: "Gambia (+220)" },
  { code: "+221", label: "Senegal (+221)" },
  { code: "+234", label: "Nigeria (+234)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+255", label: "Tanzania (+255)" },
  { code: "+256", label: "Uganda (+256)" },
  { code: "+260", label: "Zambia (+260)" },
  { code: "+263", label: "Zimbabwe (+263)" },
  { code: "+351", label: "Portugal (+351)" },
  { code: "+352", label: "Luxembourg (+352)" },
  { code: "+353", label: "Ireland (+353)" },
  { code: "+354", label: "Iceland (+354)" },
  { code: "+355", label: "Albania (+355)" },
  { code: "+356", label: "Malta (+356)" },
  { code: "+357", label: "Cyprus (+357)" },
  { code: "+358", label: "Finland (+358)" },
  { code: "+359", label: "Bulgaria (+359)" },
  { code: "+370", label: "Lithuania (+370)" },
  { code: "+371", label: "Latvia (+371)" },
  { code: "+372", label: "Estonia (+372)" },
  { code: "+380", label: "Ukraine (+380)" },
  { code: "+385", label: "Croatia (+385)" },
  { code: "+386", label: "Slovenia (+386)" },
  { code: "+387", label: "Bosnia and Herzegovina (+387)" },
  { code: "+389", label: "North Macedonia (+389)" },
  { code: "+420", label: "Czechia (+420)" },
  { code: "+421", label: "Slovakia (+421)" },
  { code: "+852", label: "Hong Kong (+852)" },
  { code: "+880", label: "Bangladesh (+880)" },
  { code: "+971", label: "United Arab Emirates (+971)" },
  { code: "+972", label: "Israel (+972)" },
  { code: "+973", label: "Bahrain (+973)" },
  { code: "+974", label: "Qatar (+974)" },
  { code: "+975", label: "Bhutan (+975)" },
  { code: "+976", label: "Mongolia (+976)" },
  { code: "+977", label: "Nepal (+977)" },
  { code: "+994", label: "Azerbaijan (+994)" },
];

function normalizeDigits(s) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

function isValidE164CountryCode(code) {
  const c = String(code ?? "").trim();
  if (!/^\+\d{1,4}$/.test(c)) return false;
  return true;
}

function isoForCountryCode(code) {
  const c = String(code ?? "").trim();
  const row = COUNTRY_CODES.find((x) => x.code === c && x.iso);
  return row?.iso || null;
}

function isValidPhoneForCountry(code, digits) {
  const cc = String(code ?? "").trim();
  const d = normalizeDigits(digits);
  if (!isValidE164CountryCode(cc)) return false;
  if (!d) return false;

  // Use libphonenumber when it can parse — its rules are country-specific.
  try {
    const pn = parsePhoneNumberFromString(`${cc}${d}`, isoForCountryCode(cc) || undefined);
    if (pn) return pn.isValid();
  } catch {
    // ignore
  }

  // Fallback: basic E.164 national significant number length bounds.
  return d.length >= 6 && d.length <= 15;
}

function createContactVerificationState() {
  return {
    email: { verified: false, locked: false, otpSent: false, otp: "", busy: false },
    mobile: { verified: false, locked: false, otpSent: false, otp: "", busy: false },
  };
}

function ContactFieldLabel({ label, verified, showVerify, onVerify, verifyBusy, verifyDisabled }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {verified ? (
        <span className="text-[11px] font-medium text-emerald-600">Verified</span>
      ) : showVerify ? (
        <button
          type="button"
          onClick={onVerify}
          disabled={verifyBusy || verifyDisabled}
          className="text-sm font-semibold text-blue-600 underline decoration-blue-600 underline-offset-2 hover:text-blue-700 hover:decoration-blue-700 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
        >
          {verifyBusy ? "Sending…" : "Verify"}
        </button>
      ) : null}
    </div>
  );
}

function ContactOtpRow({ value, onChange, onConfirm, onResend, busy, error, disabled }) {
  return (
    <div className="mt-2 space-y-2">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Enter 6-digit OTP"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm tracking-[0.35em] shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:bg-slate-50"
        value={value}
        onChange={onChange}
        disabled={disabled || busy}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || busy || !/^\d{6}$/.test(String(value ?? "").replace(/\s+/g, ""))}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Checking…" : "Confirm OTP"}
        </button>
        {onResend ? (
          <button
            type="button"
            onClick={onResend}
            disabled={disabled || busy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending…" : "Resend OTP"}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function LaunchMobileContactField({
  form,
  errors,
  contactVerification,
  requireMobileOtp,
  setField,
  patchContactVerification,
  validateStep1,
  handleSendMobileOtp,
  handleConfirmMobileOtp,
  setErrors,
}) {
  const mobileLocked = contactVerification.mobile.locked;
  const cc = String(form.phoneCountryCode ?? "").trim();
  const phone = String(form.phoneNumber ?? "").trim();
  const ccMsg = describeCountryCodeError(cc, COUNTRY_CODES);
  const canVerifyMobile = !ccMsg && Boolean(phone) && isValidPhoneForCountry(cc, phone);

  const resetMobileVerification = () => {
    if (!mobileLocked) {
      patchContactVerification("mobile", { verified: false, otpSent: false, otp: "" });
    }
  };

  return (
    <div className="block">
      <ContactFieldLabel
        label="Mobile"
        verified={
          contactVerification.mobile.verified &&
          (requireMobileOtp || contactVerification.mobile.locked)
        }
        showVerify={requireMobileOtp && !contactVerification.mobile.verified && !mobileLocked}
        onVerify={() => handleSendMobileOtp(false)}
        verifyBusy={contactVerification.mobile.busy}
        verifyDisabled={!canVerifyMobile || mobileLocked}
      />
      <div className="mt-1.5 flex gap-2">
        <select
          className={`w-[180px] rounded-xl border bg-white px-3 py-3 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2 ${
            errors.phoneCountryCode
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-200 focus:border-sky-500 focus:ring-sky-200"
          } ${mobileLocked ? "bg-slate-50 text-slate-700" : ""}`}
          value={form.phoneCountryCode}
          onChange={(e) => {
            setField("phoneCountryCode", e.target.value);
            resetMobileVerification();
          }}
          onBlur={() => setErrors(validateStep1(form, contactVerification))}
          required
          disabled={mobileLocked}
          aria-label="Country code"
          aria-invalid={Boolean(errors.phoneCountryCode)}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Mobile number"
          className={`flex-1 rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2 ${
            errors.phoneNumber
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-200 focus:border-sky-500 focus:ring-sky-200"
          } ${mobileLocked ? "bg-slate-50 text-slate-700" : ""}`}
          value={form.phoneNumber}
          onChange={(e) => {
            setField("phoneNumber", normalizeDigits(e.target.value));
            resetMobileVerification();
          }}
          onBlur={() => setErrors(validateStep1(form, contactVerification))}
          required
          readOnly={mobileLocked}
          aria-label="Mobile number"
          aria-invalid={Boolean(errors.phoneNumber)}
        />
      </div>
      {errors.phoneCountryCode ? (
        <p className="mt-1 text-xs font-medium text-red-600">{errors.phoneCountryCode}</p>
      ) : null}
      {errors.phoneNumber ? (
        <p className="mt-1 text-xs font-medium text-red-600">{errors.phoneNumber}</p>
      ) : (
        <p className="mt-1 text-[11px] text-slate-500">
          Digits only. We validate by country.
        </p>
      )}
      {requireMobileOtp && contactVerification.mobile.otpSent && !contactVerification.mobile.verified ? (
        <ContactOtpRow
          value={contactVerification.mobile.otp}
          onChange={(e) => {
            patchContactVerification("mobile", { otp: e.target.value });
            if (errors.mobileVerification) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.mobileVerification;
                return next;
              });
            }
          }}
          onConfirm={handleConfirmMobileOtp}
          onResend={() => handleSendMobileOtp(true)}
          busy={contactVerification.mobile.busy}
          error={errors.mobileVerification}
        />
      ) : null}
      {requireMobileOtp &&
      !contactVerification.mobile.verified &&
      errors.mobileVerification &&
      !contactVerification.mobile.otpSent ? (
        <p className="mt-1 text-xs font-medium text-red-600">{errors.mobileVerification}</p>
      ) : null}
    </div>
  );
}

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
      ? "text-[12px] font-bold leading-snug text-white sm:text-[13px]"
      : tightSplit
        ? "text-[13px] font-bold leading-snug text-white sm:text-[14px]"
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
          className={`mx-auto max-w-sm text-white/95 ${celebration ? "mt-1.5 text-xs leading-relaxed sm:mt-2 sm:text-sm sm:text-base" : xsSplit ? "mt-1 text-[10px] leading-relaxed sm:text-[11px]" : tightSplit ? "mt-1 text-[11px] leading-relaxed sm:text-[12px]" : "mt-1.5 text-xs leading-relaxed sm:mt-2 sm:text-sm"}`}
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
  const [launchGateRequired, setLaunchGateRequired] = useState(false);
  const [launchCode, setLaunchCode] = useState("");
  const [launchCodeError, setLaunchCodeError] = useState("");
  const [gateSubmitting, setGateSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [contactVerification, setContactVerification] = useState(createContactVerificationState);
  const [signupMode, setSignupMode] = useState("BOTH");

  const [form, setForm] = useState({
    contactPersonName: "",
    companyName: "",
    roleInCompany: "",
    address: "",
    phoneCountryCode: "+91",
    phoneNumber: "",
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
        try {
          const gRes = await api.get("/clients/launch-gate");
          const req = Boolean(gRes.data?.launchGateRequired);
          setLaunchGateRequired(req);
          setStep(req ? 0 : 1);
        } catch {
          setLaunchGateRequired(false);
          setStep(1);
        }
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
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/users/signup-mode");
        if (!cancelled) {
          setSignupMode(String(res.data?.mode || "BOTH").toUpperCase());
        }
      } catch {
        if (!cancelled) setSignupMode("BOTH");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (userId == null || portal) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/users/getUser/${userId}`);
        const u = res.data ?? {};
        if (cancelled) return;
        const parsed = parsePhonePrefill(u.mobileNo || "");
        const emailFromAccount = String(u.email ?? "").trim();
        const mobileFromAccount = Boolean(parsed?.number);
        const emailVerifiedFlag = Boolean(u.emailVerified);
        const mobileVerifiedFlag = Boolean(u.mobileVerified);
        const emailVerified =
          emailVerifiedFlag || (emailFromAccount && !mobileFromAccount && !mobileVerifiedFlag);
        const mobileVerified =
          mobileVerifiedFlag || (mobileFromAccount && !emailFromAccount && !emailVerifiedFlag);
        const contactLocks = deriveLaunchContactLocks(userId, u, parsed);
        setForm((f) => ({
          ...f,
          contactPersonName: u.userName || f.contactPersonName,
          phoneCountryCode: parsed?.countryCode || f.phoneCountryCode,
          phoneNumber: parsed?.number || f.phoneNumber,
          email: emailFromAccount || f.email,
        }));
        setContactVerification({
          email: {
            verified: emailVerified,
            locked: contactLocks.emailLocked,
            otpSent: false,
            otp: "",
            busy: false,
          },
          mobile: {
            verified: mobileVerified,
            locked: contactLocks.mobileLocked,
            otpSent: false,
            otp: "",
            busy: false,
          },
        });
        if (userId != null) {
          if (!emailVerifiedFlag && emailVerified) {
            void api
              .put(`/users/contact-verification/${userId}`, {
                emailVerified: true,
                email: emailFromAccount,
              })
              .catch(() => {});
          } else if (!mobileVerifiedFlag && mobileVerified && parsed?.number) {
            void api
              .put(`/users/contact-verification/${userId}`, {
                mobileVerified: true,
                mobileNo: formatMobileForApi(parsed.countryCode, parsed.number),
              })
              .catch(() => {});
          }
        }
      } catch {
        /* optional prefill */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, portal]);

  const launchOtpRequirements = useMemo(
    () =>
      resolveLaunchOtpRequirements(signupMode, {
        emailLocked: contactVerification.email.locked,
        mobileLocked: contactVerification.mobile.locked,
      }),
    [signupMode, contactVerification.email.locked, contactVerification.mobile.locked],
  );

  const validateStep1 = (nextForm = form, nextVerification = contactVerification) => {
    const e = {};
    const name = String(nextForm.contactPersonName ?? "").trim();
    const company = String(nextForm.companyName ?? "").trim();
    const role = String(nextForm.roleInCompany ?? "").trim();
    const address = String(nextForm.address ?? "").trim();
    const email = String(nextForm.email ?? "").trim();
    const cc = String(nextForm.phoneCountryCode ?? "").trim();
    const phone = String(nextForm.phoneNumber ?? "").trim();

    if (!company) e.companyName = "Organization name is required.";
    if (!address) e.address = "Address is required.";
    if (!name) e.contactPersonName = "Your name is required.";
    if (!role) e.roleInCompany = "Your role in company is required.";
    if (!email) e.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) e.email = "Please enter a valid email address.";
    const ccMsg = describeCountryCodeError(cc, COUNTRY_CODES);
    if (ccMsg) e.phoneCountryCode = ccMsg;
    if (!phone) e.phoneNumber = "Mobile number is required.";
    else if (!ccMsg && !isValidPhoneForCountry(cc, phone)) {
      e.phoneNumber =
        "This mobile number doesn’t look valid for the selected country calling code. Check the number length and digits, or verify you picked the right country.";
    }

    const otpReq = resolveLaunchOtpRequirements(signupMode, {
      emailLocked: nextVerification.email.locked,
      mobileLocked: nextVerification.mobile.locked,
    });

    if (otpReq.requireEmailOtp && !nextVerification.email.verified) {
      e.emailVerification = "Verify your email to continue.";
    }
    if (otpReq.requireMobileOtp && !nextVerification.mobile.verified) {
      e.mobileVerification = "Verify your mobile number to continue.";
    }

    return e;
  };

  const patchContactVerification = (channel, patch) => {
    setContactVerification((v) => ({ ...v, [channel]: { ...v[channel], ...patch } }));
  };

  const persistContactVerification = async (channel, payload) => {
    if (userId == null) return;
    await api.put(`/users/contact-verification/${userId}`, payload);
  };

  const ensureContactAvailableForUser = async (params) => {
    await ensureContactAvailable(userId, params);
  };

  const handleSendEmailOtp = async (isResend = false) => {
    const email = String(form.email ?? "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
      return;
    }
    patchContactVerification("email", { busy: true });
    try {
      await ensureContactAvailableForUser({ email });
      await api.post("/users/otp/send", { email });
      patchContactVerification("email", { busy: false, otpSent: true, otp: "" });
      showSuccessToast(isResend ? "OTP resent to your email." : "OTP sent to your email.");
    } catch (err) {
      patchContactVerification("email", { busy: false });
      const msg = err?.fieldMessage || getApiErrorMessage(err);
      setErrors((prev) => ({ ...prev, email: msg }));
    }
  };

  const handleConfirmEmailOtp = async () => {
    const email = String(form.email ?? "").trim().toLowerCase();
    const otp = String(contactVerification.email.otp ?? "").replace(/\s+/g, "");
    if (!/^\d{6}$/.test(otp)) {
      setErrors((prev) => ({ ...prev, emailVerification: "Enter a valid 6-digit OTP." }));
      return;
    }
    patchContactVerification("email", { busy: true });
    try {
      await ensureContactAvailableForUser({ email });
      await api.post("/users/otp/verify", { email, otp });
    } catch (err) {
      patchContactVerification("email", { busy: false });
      const msg = err?.fieldMessage || getApiErrorMessage(err);
      setErrors((prev) => ({ ...prev, emailVerification: msg, email: err?.fieldMessage ? msg : prev.email }));
      return;
    }

    patchContactVerification("email", {
      busy: false,
      verified: true,
      otpSent: false,
      otp: "",
    });
    setErrors((prev) => {
      if (!prev?.emailVerification) return prev;
      const next = { ...prev };
      delete next.emailVerification;
      return next;
    });
    showSuccessToast("Email verified.");

    try {
      await persistContactVerification("email", { emailVerified: true, email });
    } catch (err) {
      const msg = getApiErrorMessage(err);
      patchContactVerification("email", { verified: false, otpSent: false, busy: false, otp: "" });
      setErrors((prev) => ({ ...prev, email: msg }));
      showErrorToast(
        msg || "Email was verified, but we could not save it to your profile. Try again or sign in again."
      );
    }
  };

  const handleSendMobileOtp = async (isResend = false) => {
    const cc = String(form.phoneCountryCode ?? "").trim();
    const phone = String(form.phoneNumber ?? "").trim();
    const ccMsg = describeCountryCodeError(cc, COUNTRY_CODES);
    if (ccMsg) {
      setErrors((prev) => ({ ...prev, phoneCountryCode: ccMsg }));
      return;
    }
    if (!phone) {
      setErrors((prev) => ({ ...prev, phoneNumber: "Mobile number is required." }));
      return;
    }
    if (!isValidPhoneForCountry(cc, phone)) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber:
          "This mobile number doesn’t look valid for the selected country calling code. Check the number length and digits, or verify you picked the right country.",
      }));
      return;
    }
    const mobileNo = formatMobileForApi(cc, phone);
    patchContactVerification("mobile", { busy: true });
    try {
      await ensureContactAvailableForUser({ mobileNo });
      await api.post("/users/otp/mobile/send", { mobileNo });
      patchContactVerification("mobile", { busy: false, otpSent: true, otp: "" });
      showSuccessToast(isResend ? "OTP resent to your mobile." : "OTP sent to your mobile.");
    } catch (err) {
      patchContactVerification("mobile", { busy: false });
      const msg = err?.fieldMessage || getApiErrorMessage(err);
      setErrors((prev) => ({ ...prev, phoneNumber: msg }));
    }
  };

  const handleConfirmMobileOtp = async () => {
    const cc = String(form.phoneCountryCode ?? "").trim();
    const phone = String(form.phoneNumber ?? "").trim();
    const mobileNo = formatMobileForApi(cc, phone);
    const otp = String(contactVerification.mobile.otp ?? "").replace(/\s+/g, "");
    if (!/^\d{6}$/.test(otp)) {
      setErrors((prev) => ({ ...prev, mobileVerification: "Enter a valid 6-digit OTP." }));
      return;
    }
    patchContactVerification("mobile", { busy: true });
    try {
      await ensureContactAvailableForUser({ mobileNo });
      await api.post("/users/otp/mobile/verify", { mobileNo, otp });
    } catch (err) {
      patchContactVerification("mobile", { busy: false });
      const msg = err?.fieldMessage || getApiErrorMessage(err);
      setErrors((prev) => ({
        ...prev,
        mobileVerification: msg,
        phoneNumber: err?.fieldMessage ? msg : prev.phoneNumber,
      }));
      return;
    }

    patchContactVerification("mobile", {
      busy: false,
      verified: true,
      otpSent: false,
      otp: "",
    });
    setErrors((prev) => {
      if (!prev?.mobileVerification) return prev;
      const next = { ...prev };
      delete next.mobileVerification;
      return next;
    });
    showSuccessToast("Mobile verified.");

    try {
      await persistContactVerification("mobile", { mobileVerified: true, mobileNo });
    } catch (err) {
      const msg = getApiErrorMessage(err);
      patchContactVerification("mobile", { verified: false, otpSent: false, busy: false, otp: "" });
      setErrors((prev) => ({ ...prev, phoneNumber: msg }));
      showErrorToast(
        msg || "Mobile was verified, but we could not save it to your profile. Try again or sign in again."
      );
    }
  };

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear existing error as the user edits (final validation still runs on Next).
    setErrors((prev) => {
      if (!prev?.[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleLaunchGateContinue = async () => {
    const trimmed = launchCode.trim();
    if (!trimmed) {
      setLaunchCodeError("Enter the launch code your Edukify administrator shared with you.");
      return;
    }
    setLaunchCodeError("");
    setGateSubmitting(true);
    try {
      await api.post("/clients/launch-gate/verify", { launchCode: trimmed });
      setLaunchCodeError("");
      setStep(1);
    } catch (err) {
      const st = err?.response?.status;
      const msg = getApiErrorMessage(err);
      setLaunchCodeError(
        st === 403 || /^incorrect launch code/i.test(msg) ? "Incorrect launch code." : msg,
      );
    } finally {
      setGateSubmitting(false);
    }
  };

  const handleFormNext = async () => {
    const e = validateStep1(form, contactVerification);
    setErrors(e);
    if (Object.keys(e).length) return;
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
      const email = String(form.email ?? "").trim();
      const phone = `${String(form.phoneCountryCode ?? "").trim()} ${normalizeDigits(form.phoneNumber)}`.trim();
      const launchPayload = {
        contactPersonName: form.contactPersonName.trim(),
        companyName: form.companyName.trim(),
        roleInCompany: form.roleInCompany.trim(),
        address: form.address.trim(),
        phone,
        email,
        subdomain: subdomain.trim(),
      };
      if (launchGateRequired) {
        launchPayload.launchCode = launchCode.trim();
      }
      const res = await api.post("/clients/launch", launchPayload);
      setPortal(res.data);
      onPortalPresenceChange?.(true);
      showSuccessToast("You're live on Edukify — welcome aboard!");
      setStep(3);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      const st = err?.response?.status;
      if (launchGateRequired && (st === 403 || /launch code/i.test(msg))) {
        setLaunchCode("");
        setStep(0);
        setLaunchCodeError(
          st === 403 || /^incorrect launch code/i.test(msg) ? "Incorrect launch code." : msg,
        );
      } else {
        showErrorToast(msg);
      }
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

    const planLabel = portal.planStatus || portal.subscription || "Trial"
    const planLc = String(planLabel).toLowerCase()
    const planBadgeClass = planLc.endsWith("expired")
      ? "bg-gray-200 text-gray-800"
      : planLc === "trial" ||
          planLc.startsWith("trial_") ||
          planLc.startsWith("trial ") ||
          planLc.startsWith("trial-")
        ? "bg-sky-500 text-white"
        : "bg-amber-100 text-amber-900"
    const expiryDisplay =
      portal.trialExpiresOn ? formatTrialExpiryIso(portal.trialExpiresOn) : "—";

    const spaceLeft = formatSpaceLeftMb(allocatedMb, portal.storageUsedBytes)
    const { on: liveOn, text: liveText } = portalLiveDisplay(portal)

    return (
      <div className="mx-auto w-full max-w-none overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-sky-900/10">
        <div className="min-w-0 overflow-x-auto border-b border-gray-200">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "38%" }} />
            </colgroup>
            <thead className="border-b border-gray-200 bg-[#f9fafb] text-left text-gray-600">
              <tr>
                <th className="py-2.5 pl-3 pr-2 font-semibold">Company</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">Expiration</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">Allocated</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">Free</th>
                <th className="py-2.5 pr-6 pl-2 font-semibold whitespace-nowrap">Plan</th>
                <th
                  className="py-2.5 px-1 text-center font-semibold whitespace-nowrap border-l border-gray-200 text-slate-500"
                  title="Portal live (YES/NO), set by Edukify admin only. Shown for your information."
                >
                  Live
                </th>
                <th className="py-2.5 pr-3 pl-6 font-semibold border-l border-gray-100">Links</th>
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
                <td className="py-5 pr-8 pl-2 align-top whitespace-nowrap">
                  <div className="flex flex-col items-start gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${planBadgeClass}`}
                    >
                      {planLabel}
                    </span>
                    <Link
                      to="/account/upgrade-plans"
                      className="inline-flex items-center gap-0.5 text-xs font-semibold text-sky-600 underline-offset-2 hover:text-sky-800 hover:underline"
                    >
                      <i className="ri-shopping-bag-3-line text-sm" aria-hidden />
                      Upgrade Plan
                    </Link>
                  </div>
                </td>
                <td className="py-5 px-1 text-center align-middle border-l border-gray-200 bg-slate-50/90">
                  <div
                    className="pointer-events-none mx-auto flex max-w-[5.5rem] select-none flex-col items-center gap-1 opacity-65"
                    aria-disabled="true"
                    role="group"
                    aria-label={liveOn ? "Live on (YES), read-only" : "Live off (NO), read-only"}
                    title="Set by Edukify admin only. You cannot change this here."
                  >
                    <div
                      className={`relative h-7 w-11 rounded-full ${
                        liveOn ? "bg-slate-400" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm ${
                          liveOn ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums tracking-wide text-slate-500">
                      {liveText}
                    </span>
                  </div>
                </td>
                <td className="py-5 pr-3 pl-6 align-top md:pl-8 border-l border-gray-100">
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
      {step === 0 && launchGateRequired && (
        <div className="flex flex-col overflow-hidden rounded-3xl border border-sky-100/80 bg-white shadow-xl shadow-sky-900/10 md:flex-row md:items-stretch">
          <div className="flex shrink-0 flex-col md:w-[38%] md:min-w-[220px] md:max-w-[280px] md:self-stretch">
            <LaunchHero
              splitLayout
              extraCompactSplit
              step={0}
              highlight="Access"
              title="Launch code required"
              subtitle="Edukify is not open for self-serve launches yet, or your account needs a code. Enter the code you were given, then continue."
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-4 border-t border-sky-100/60 bg-white px-5 py-6 md:border-l md:border-t-0 md:px-6 md:py-7 rounded-b-3xl md:rounded-bl-none md:rounded-br-3xl md:rounded-tr-3xl">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Launch code</span>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                  launchCodeError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-sky-500 focus:ring-sky-200"
                }`}
                value={launchCode}
                onChange={(e) => {
                  setLaunchCode(e.target.value)
                  if (launchCodeError) setLaunchCodeError("")
                }}
                placeholder="Paste or type the code from your administrator"
                disabled={gateSubmitting}
                aria-invalid={Boolean(launchCodeError)}
                aria-describedby={launchCodeError ? "launch-code-error" : undefined}
              />
              {launchCodeError ? (
                <p id="launch-code-error" className="mt-2 text-sm font-medium text-red-600">
                  {launchCodeError}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">
                  Use the exact code shown in your Edukify admin under Settings → Launch code.
                </p>
              )}
            </label>
            <button
              type="button"
              onClick={handleLaunchGateContinue}
              disabled={gateSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:px-8"
            >
              {gateSubmitting ? "Checking…" : "Continue"}
            </button>
          </div>
        </div>
      )}
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
              <span className="text-sm font-semibold text-slate-700">Organization name</span>
              <input
                type="text"
                placeholder="School or company name"
                className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2 ${
                  errors.companyName
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-sky-500 focus:ring-sky-200"
                }`}
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                onBlur={() => setErrors(validateStep1(form))}
                required
                aria-invalid={Boolean(errors.companyName)}
              />
              {errors.companyName ? (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.companyName}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Address</span>
              <textarea
                placeholder="Street, city, state, country"
                className={`mt-1.5 w-full min-h-[88px] resize-y rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2 ${
                  errors.address
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-sky-500 focus:ring-sky-200"
                }`}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                onBlur={() => setErrors(validateStep1(form))}
                required
                aria-invalid={Boolean(errors.address)}
              />
              {errors.address ? <p className="mt-1 text-xs font-medium text-red-600">{errors.address}</p> : null}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Your name</span>
              <input
                type="text"
                placeholder="How should we greet you?"
                className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2 ${
                  errors.contactPersonName
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-sky-500 focus:ring-sky-200"
                }`}
                value={form.contactPersonName}
                onChange={(e) => setField("contactPersonName", e.target.value)}
                onBlur={() => setErrors(validateStep1(form))}
                required
                aria-invalid={Boolean(errors.contactPersonName)}
              />
              {errors.contactPersonName ? (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.contactPersonName}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Your role in company</span>
              <input
                type="text"
                placeholder="e.g. Owner, Principal, HR, Admin"
                className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2 ${
                  errors.roleInCompany
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-sky-500 focus:ring-sky-200"
                }`}
                value={form.roleInCompany}
                onChange={(e) => setField("roleInCompany", e.target.value)}
                onBlur={() => setErrors(validateStep1(form))}
                required
                aria-invalid={Boolean(errors.roleInCompany)}
              />
              {errors.roleInCompany ? (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.roleInCompany}</p>
              ) : null}
            </label>
            <label className="block">
              <ContactFieldLabel
                label="Email"
                verified={
                  contactVerification.email.verified &&
                  (launchOtpRequirements.requireEmailOtp || contactVerification.email.locked)
                }
                showVerify={
                  launchOtpRequirements.requireEmailOtp &&
                  !contactVerification.email.verified &&
                  !contactVerification.email.locked
                }
                onVerify={() => handleSendEmailOtp(false)}
                verifyBusy={contactVerification.email.busy}
                verifyDisabled={
                  !EMAIL_RE.test(String(form.email ?? "").trim()) || contactVerification.email.locked
                }
              />
              <input
                type="email"
                placeholder="name@company.com"
                className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2 ${
                  errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-sky-500 focus:ring-sky-200"
                } ${contactVerification.email.locked ? "bg-slate-50 text-slate-700" : ""}`}
                value={form.email}
                onChange={(e) => {
                  setField("email", e.target.value);
                  if (!contactVerification.email.locked) {
                    patchContactVerification("email", { verified: false, otpSent: false, otp: "" });
                  }
                }}
                onBlur={() => setErrors(validateStep1(form, contactVerification))}
                required
                readOnly={contactVerification.email.locked}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p> : null}
              {launchOtpRequirements.requireEmailOtp &&
              contactVerification.email.otpSent &&
              !contactVerification.email.verified ? (
                <ContactOtpRow
                  value={contactVerification.email.otp}
                  onChange={(e) => {
                    patchContactVerification("email", { otp: e.target.value });
                    if (errors.emailVerification) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.emailVerification;
                        return next;
                      });
                    }
                  }}
                  onConfirm={handleConfirmEmailOtp}
                  onResend={() => handleSendEmailOtp(true)}
                  busy={contactVerification.email.busy}
                  error={errors.emailVerification}
                />
              ) : null}
              {launchOtpRequirements.requireEmailOtp &&
              !contactVerification.email.verified &&
              errors.emailVerification &&
              !contactVerification.email.otpSent ? (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.emailVerification}</p>
              ) : null}
            </label>
            <LaunchMobileContactField
              form={form}
              errors={errors}
              contactVerification={contactVerification}
              requireMobileOtp={launchOtpRequirements.requireMobileOtp}
              setField={setField}
              patchContactVerification={patchContactVerification}
              validateStep1={validateStep1}
              handleSendMobileOtp={handleSendMobileOtp}
              handleConfirmMobileOtp={handleConfirmMobileOtp}
              setErrors={setErrors}
            />
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
