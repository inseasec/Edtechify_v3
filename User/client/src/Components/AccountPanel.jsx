import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { decodeToken } from "../authConfig";
import axios from "axios";
import EditUser from "./EditUser";
import UserImagePopUp from "./UserImagePopUp";
import api from "../api";
import ProgressBar from "../utils/ProgressBar";
import { showErrorToast, showSuccessToast } from "../utils/toastUtils";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COUNTRY_CODES = [
  { code: "+1", label: "United States / Canada (+1)" },
  { code: "+7", label: "Russia / Kazakhstan (+7)" },
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
  { code: "+91", label: "India (+91)" },
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

function parsePhoneParts(rawPhone) {
  const raw = String(rawPhone ?? "").trim();
  if (!raw) return { phoneCountryCode: "+91", phoneNumber: "" };
  const m = raw.match(/^\+(\d{1,4})\s*(.*)$/);
  if (!m) return { phoneCountryCode: "+91", phoneNumber: normalizeDigits(raw) };
  const cc = `+${m[1]}`;
  const known = COUNTRY_CODES.some((c) => c.code === cc) ? cc : "+91";
  return { phoneCountryCode: known, phoneNumber: normalizeDigits(m[2]) };
}

function isValidPhoneForCountry(code, digits) {
  const cc = String(code ?? "").trim();
  const d = normalizeDigits(digits);
  if (!/^\+\d{1,4}$/.test(cc)) return false;
  if (!d) return false;
  try {
    const pn = parsePhoneNumberFromString(`${cc}${d}`);
    if (pn) return pn.isValid();
  } catch {
    // ignore
  }
  return d.length >= 6 && d.length <= 15;
}

function accountImageUrl(userImg, baseUrl) {
  if (!userImg) return null;
  // If backend already returns an absolute URL, use it as-is.
  if (/^https?:\/\//i.test(String(userImg))) return String(userImg);
  const p = String(userImg).replaceAll("\\", "/").replace(/^\/+/, "");
  const trimmedBase = String(baseUrl || "").replace(/\/+$/, "");
  if (!trimmedBase) return null;
  // Encode each segment so emails/spaces don't break the URL.
  const encodedPath = p
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${trimmedBase}/${encodedPath}`;
}

export default function AccountPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompanyEditOpen, setIsCompanyEditOpen] = useState(false);
  const [companySubmitting, setCompanySubmitting] = useState(false);
  const [companyErrors, setCompanyErrors] = useState({});
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    contactPersonName: "",
    roleInCompany: "",
    phoneCountryCode: "+91",
    phoneNumber: "",
    email: "",
    address: "",
  });
  const [userData, setUserData] = useState({});
  const [openImagePopUp, setOpenImagePopUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileImgBroken, setIsProfileImgBroken] = useState(false);
  const [portalInfo, setPortalInfo] = useState(null);
  const [billingInfo, setBillingInfo] = useState(null);
  const fileInputRef = useRef(null);

  const user_ID = decodeToken();
  const baseUrl = window._CONFIG_.VITE_API_BASE_URL;
  const mediaBaseUrl = window._CONFIG_.VITE_MEDIA_BASE_URL || baseUrl;

  const userInfo = useCallback(async () => {
    if (user_ID == null) return;
    try {
      const response = await api.get(`/users/getUser/${user_ID}`);
      setUserData(response.data ?? {});
    } catch (error) {
      console.error("Error fetching user data:", error);
      showErrorToast(error?.response?.data || "Could not load profile");
    }
  }, [user_ID]);

  useEffect(() => {
    userInfo();
  }, [userInfo]);

  const loadPortalInfo = useCallback(async () => {
    if (user_ID == null) return;
    try {
      const res = await api.get("/clients/me");
      setPortalInfo(res.data ?? null);
    } catch (err) {
      if (err?.response?.status === 404) {
        setPortalInfo(null);
      }
    }
  }, [user_ID]);

  const loadBillingInfo = useCallback(async () => {
    if (user_ID == null) return;
    try {
      const res = await api.get("/billing/me");
      setBillingInfo(res.data ?? null);
    } catch {
      setBillingInfo(null);
    }
  }, [user_ID]);

  const openCompanyEdit = () => {
    if (!portalInfo) return;
    setCompanyErrors({});
    const parts = parsePhoneParts(portalInfo.phone || "");
    setCompanyForm({
      companyName: portalInfo.companyName || "",
      contactPersonName: portalInfo.contactPersonName || "",
      roleInCompany: portalInfo.roleInCompany || "",
      phoneCountryCode: parts.phoneCountryCode,
      phoneNumber: parts.phoneNumber,
      email: portalInfo.email || "",
      address: portalInfo.address || "",
    });
    setIsCompanyEditOpen(true);
  };

  const validateCompany = (f = companyForm) => {
    const e = {};
    const companyName = String(f.companyName ?? "").trim();
    const contactPersonName = String(f.contactPersonName ?? "").trim();
    const roleInCompany = String(f.roleInCompany ?? "").trim();
    const email = String(f.email ?? "").trim();
    const phoneCountryCode = String(f.phoneCountryCode ?? "").trim();
    const phoneNumber = String(f.phoneNumber ?? "").trim();
    const address = String(f.address ?? "").trim();

    if (!companyName) e.companyName = "Company name is required.";
    if (!contactPersonName) e.contactPersonName = "Contact person is required.";
    if (!roleInCompany) e.roleInCompany = "Role in company is required.";
    if (!address) e.address = "Address is required.";
    if (!email) e.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address.";

    if (!phoneCountryCode || !/^\+\d{1,4}$/.test(phoneCountryCode)) e.phoneCountryCode = "Select a country code.";
    if (!phoneNumber) e.phoneNumber = "Mobile number is required.";
    else if (!isValidPhoneForCountry(phoneCountryCode, phoneNumber))
      e.phoneNumber = "Enter a valid mobile number for the selected country.";

    return e;
  };

  const saveCompany = async () => {
    const e = validateCompany(companyForm);
    setCompanyErrors(e);
    if (Object.keys(e).length) return;
    setCompanySubmitting(true);
    try {
      const payload = {
        // companyName is immutable after launch
        contactPersonName: String(companyForm.contactPersonName).trim(),
        roleInCompany: String(companyForm.roleInCompany).trim(),
        address: String(companyForm.address).trim(),
        phone: `${String(companyForm.phoneCountryCode).trim()} ${normalizeDigits(companyForm.phoneNumber)}`.trim(),
        email: String(companyForm.email).trim(),
      };
      const res = await api.put("/clients/me", payload);
      setPortalInfo(res.data ?? null);
      showSuccessToast("Company details updated.");
      setIsCompanyEditOpen(false);
    } catch (err) {
      showErrorToast(err?.response?.data?.message || err?.response?.data || "Update failed");
    } finally {
      setCompanySubmitting(false);
    }
  };

  useEffect(() => {
    loadPortalInfo();
    loadBillingInfo();
  }, [loadPortalInfo]);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (file && user_ID != null) uploadImage(user_ID, file);
    // allow re-selecting the same file
    if (e.target) e.target.value = "";
  };

  const uploadImage = async (UserId, file) => {
    setIsUploading(true);
    setProgress(20);
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(50);
      await axios.put(`${baseUrl}/users/uploadImage/${UserId}`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setProgress(100);
      showSuccessToast("Image uploaded successfully");
      await userInfo();
    } catch (error) {
      showErrorToast(error.response?.data || error.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    await userInfo();
  };

  const profileImgSrc = isProfileImgBroken
    ? null
    : accountImageUrl(userData.userImg, baseUrl) || accountImageUrl(userData.userImg, mediaBaseUrl);

  /**
   * Account contact (used for login). This should NOT change when company contact is edited later.
   * We only "fill missing" from launch once (server-side) if the account identifier is empty.
   */
  const displayPhone = userData.mobileNo || "—";
  const displayEmail = userData.email || "—";

  if (user_ID == null) {
    return (
      <p className="text-slate-600">Please sign in to view your profile.</p>
    );
  }

  return (
    <div>
      {isUploading && (
        <ProgressBar progress={progress} text="Uploading image…" isUploading={isUploading} />
      )}

      <div>
          <p className="text-3xl font-bold text-slate-500">Profile</p>

          {portalInfo ? (
            <div className="mt-6 mb-4 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-md shadow-sky-900/5">
              <div className="bg-gradient-to-r from-sky-500 to-cyan-600 px-5 py-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">Your live space</p>
                <p className="mt-1 text-lg font-bold">You&apos;re on Edukify</p>
                <span className="mt-2 inline-block rounded-full bg-white/25 px-3 py-0.5 text-xs font-semibold backdrop-blur-sm">
                  {portalInfo.subscription || "Trial"} plan
                </span>
              </div>
              <div className="space-y-3 p-5">
                <a
                  href={portalInfo.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm transition hover:border-sky-200 hover:bg-sky-50/50"
                >
                  <i className="ri-global-line text-xl text-sky-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-slate-500">Website</span>
                    <span className="block truncate font-medium text-sky-700">{portalInfo.siteUrl}</span>
                  </span>
                  <i className="ri-external-link-line text-slate-400" />
                </a>
                <a
                  href={portalInfo.adminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm transition hover:border-sky-200 hover:bg-sky-50/50"
                >
                  <i className="ri-dashboard-3-line text-xl text-slate-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-slate-500">Dashboard</span>
                    <span className="block truncate font-medium text-sky-700">{portalInfo.adminUrl}</span>
                  </span>
                  <i className="ri-external-link-line text-slate-400" />
                </a>
              </div>
            </div>
          ) : (
            <div className="relative mt-6 mb-4 overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-slate-50 via-white to-sky-50/90 p-6 shadow-md">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-600 text-2xl shadow-lg text-white">
                    <i className="ri-rocket-2-fill" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">Ready when you are</p>
                    <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-600">
                      One short flow — then your own space on Edukify for learners and your team. No tech stress;
                      we&apos;ll guide you as you grow.
                    </p>
                  </div>
                </div>
                <Link
                  to="/account/launch"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-xl"
                >
                  <i className="ri-arrow-right-circle-fill text-lg" />
                  Launch my space
                </Link>
              </div>
            </div>
          )}
          <div className="flex bg-sky-500 px-2 rounded-md relative right-5 md:right-14 md:top-16 top-14 float-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-lg z-20 md:text-lg text-white cursor-pointer bg-transparent border-0 p-0"
              aria-label="Edit profile"
            >
              <i className="ri-edit-box-line" />
            </button>
          </div>

          <div className="relative flex flex-col w-full bg-slate-100 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl p-10 pt-16 shadow-xl md:flex-row md:space-x-32 clear-both">
            <div className="absolute left-6 top-4 md:left-8 md:top-5">
              <p className="text-sm font-extrabold uppercase tracking-wide text-slate-800">
                Login details
              </p>
            </div>

            <div className="mb-6 mt-6 flex flex-col gap-1 md:mb-8 md:hidden">
              <p className="text-xs font-medium text-slate-500">
                These phone/email are used to sign in. Company contact details can be different.
              </p>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-10">
              <div className="w-32 h-32 md:order-0 mx-auto md:mx-0 relative">
                {profileImgSrc ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenImagePopUp(true)}
                      className="block w-32 h-32 rounded-full overflow-hidden bg-slate-200 border-0 p-0 cursor-pointer"
                      aria-label="View profile image"
                    >
                      <img
                        src={profileImgSrc}
                        alt="Profile"
                        onError={() => setIsProfileImgBroken(true)}
                        className="bg-slate-200 h-32 w-32 object-cover rounded-full"
                      />
                    </button>
                    <input
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleImage}
                      type="file"
                      accept="image/*"
                    />

                    <div className="absolute bottom-2 right-2 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="w-8 h-8 grid place-items-center mt-[-140px] rounded-full shadow bg-sky-500 text-white border-2 border-white"
                        aria-label="Update profile image"
                      >
                        <i className="ri-camera-line text-lg" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      className="absolute top-0 left-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={handleImage}
                      type="file"
                      accept="image/*"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center w-full h-full cursor-pointer bg-slate-200 rounded-full"
                    >
                      <div className="bg-sky-500 px-3 py-2 rounded-full">
                        <i className="text-lg text-white ri-camera-line" />
                      </div>
                    </label>
                  </>
                )}
              </div>
              <div className="flex w-full flex-col md:order-2 md:flex-row md:items-stretch md:justify-between md:gap-6 justify-center items-center ml-[40px] md:ml-0">
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center space-x-2">
                    <i className="ri-phone-fill text-lg text-slate-500 md:text-lg" aria-hidden />
                    <p className="text-sm text-sky-900 md:text-base">{displayPhone}</p>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <i className="ri-mail-fill text-lg text-slate-500 md:text-lg" aria-hidden />
                    <p className="break-all text-sm text-sky-900 md:text-base">{displayEmail}</p>
                  </div>
                </div>

                {/* Mobile: keep under details */}
                <p className="mt-3 max-w-[26rem] text-center text-xs font-medium text-slate-500 md:hidden">
                  These phone/email are used to sign in. Company contact details can be different.
                </p>

                {/* Desktop: bottom-right of this section */}
                <div className="hidden md:flex flex-col justify-end items-end md:ml-auto">
                  <p className="max-w-[28rem] text-right text-xs font-medium text-slate-500">
                    These phone/email are used to sign in. Company contact details can be different.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 w-full bg-slate-100 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl py-7 px-10 sm:px-14">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sky-600 text-lg font-semibold">Company detail</p>
                <p className="mt-1 text-sm text-slate-500">
                  From your launch flow. Phone and mail here match what you see beside your photo.
                </p>
              </div>
              {portalInfo ? (
                <button
                  type="button"
                  onClick={openCompanyEdit}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <i className="ri-edit-2-line text-base text-sky-600" />
                  Edit
                </button>
              ) : null}
            </div>
            {portalInfo ? (
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-600">Company name</dt>
                  <dd className="mt-0.5 text-slate-900">{portalInfo.companyName?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Contact person</dt>
                  <dd className="mt-0.5 text-slate-900">{portalInfo.contactPersonName?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Role in company</dt>
                  <dd className="mt-0.5 text-slate-900">{portalInfo.roleInCompany?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Phone</dt>
                  <dd className="mt-0.5 text-slate-900">{portalInfo.phone?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Mail</dt>
                  <dd className="mt-0.5 break-all text-slate-900">{portalInfo.email?.trim() || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-slate-600">Address</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">
                    {portalInfo.address?.trim() || "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-slate-600">
                No company profile yet.{" "}
                <Link to="/account/launch" className="font-semibold text-sky-600 hover:underline">
                  Launch your Edukify space
                </Link>{" "}
                to add these details.
              </p>
            )}
          </div>

          <div className="mt-10 w-full bg-slate-100 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl py-7 px-10 sm:px-14">
            <p className="text-sky-600 text-lg font-semibold">Billing details</p>
            <p className="mt-1 text-sm text-slate-500">
              Used for invoices/receipts. If you choose “same as company” during checkout, these match company contact.
            </p>
            {billingInfo && (billingInfo.billingName || billingInfo.billingEmail || billingInfo.billingPhone || billingInfo.billingAddress || billingInfo.billingGstNo) ? (
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-600">Name</dt>
                  <dd className="mt-0.5 text-slate-900">{billingInfo.billingName?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Phone</dt>
                  <dd className="mt-0.5 text-slate-900">{billingInfo.billingPhone?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">Email</dt>
                  <dd className="mt-0.5 break-all text-slate-900">{billingInfo.billingEmail?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">GST (optional)</dt>
                  <dd className="mt-0.5 text-slate-900">{billingInfo.billingGstNo?.trim() || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-slate-600">Address</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">
                    {billingInfo.billingAddress?.trim() || "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-slate-600">
                Not set yet. It will be saved when you complete checkout in{" "}
                <span className="font-semibold">Buy Now</span>.
              </p>
            )}
          </div>

          {isCompanyEditOpen ? (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3">
              <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-bold text-slate-800">Edit company details</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      These update the company profile only. Your login phone/email won’t change.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCompanyEditOpen(false)}
                    className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">Company name</span>
                    <input
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                        companyErrors.companyName
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
                      }`}
                      value={companyForm.companyName}
                      readOnly
                      disabled
                      title="Company name can't be changed after launch"
                    />
                    {companyErrors.companyName ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{companyErrors.companyName}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">Contact person</span>
                    <input
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                        companyErrors.contactPersonName
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
                      }`}
                      value={companyForm.contactPersonName}
                      onChange={(e) =>
                        setCompanyForm((p) => ({ ...p, contactPersonName: e.target.value }))
                      }
                    />
                    {companyErrors.contactPersonName ? (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {companyErrors.contactPersonName}
                      </p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">Your role in company</span>
                    <input
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                        companyErrors.roleInCompany
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
                      }`}
                      value={companyForm.roleInCompany}
                      onChange={(e) => setCompanyForm((p) => ({ ...p, roleInCompany: e.target.value }))}
                    />
                    {companyErrors.roleInCompany ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{companyErrors.roleInCompany}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">Phone</span>
                    <div className="mt-1 flex gap-2">
                      <select
                        className={`w-[180px] rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                          companyErrors.phoneCountryCode
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
                        }`}
                        value={companyForm.phoneCountryCode}
                        onChange={(e) =>
                          setCompanyForm((p) => ({ ...p, phoneCountryCode: e.target.value }))
                        }
                        aria-label="Country code"
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
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                          companyErrors.phoneNumber
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
                        }`}
                        value={companyForm.phoneNumber}
                        onChange={(e) =>
                          setCompanyForm((p) => ({ ...p, phoneNumber: normalizeDigits(e.target.value) }))
                        }
                        aria-label="Mobile number"
                      />
                    </div>
                    {companyErrors.phoneCountryCode ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{companyErrors.phoneCountryCode}</p>
                    ) : null}
                    {companyErrors.phoneNumber ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{companyErrors.phoneNumber}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">Digits only. We validate by country.</p>
                    )}
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-700">Email</span>
                    <input
                      placeholder="company@example.com"
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                        companyErrors.email
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
                      }`}
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm((p) => ({ ...p, email: e.target.value }))}
                    />
                    {companyErrors.email ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{companyErrors.email}</p>
                    ) : null}
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-700">Address</span>
                    <textarea
                      className={`mt-1 min-h-[92px] w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${
                        companyErrors.address
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
                      }`}
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm((p) => ({ ...p, address: e.target.value }))}
                    />
                    {companyErrors.address ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{companyErrors.address}</p>
                    ) : null}
                  </label>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCompanyEditOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    disabled={companySubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveCompany}
                    className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-500/20 disabled:opacity-60"
                    disabled={companySubmitting}
                  >
                    {companySubmitting ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <EditUser isOpen={isModalOpen} isClose={handleCloseModal} refreshUser={userInfo} />
        </div>
      {openImagePopUp && profileImgSrc && (
        <UserImagePopUp onClose={() => setOpenImagePopUp(false)} src={profileImgSrc} />
      )}
    </div>
  );
}
