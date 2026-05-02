import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { decodeToken } from "../authConfig";
import axios from "axios";
import EditUser from "./EditUser";
import UserImagePopUp from "./UserImagePopUp";
import api from "../api";
import ProgressBar from "../utils/ProgressBar";
import { showErrorToast, showSuccessToast } from "../utils/toastUtils";

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
  const [userData, setUserData] = useState({});
  const [openImagePopUp, setOpenImagePopUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileImgBroken, setIsProfileImgBroken] = useState(false);
  const [portalInfo, setPortalInfo] = useState(null);
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

  useEffect(() => {
    loadPortalInfo();
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

  /** Same values as Company detail when portal exists; otherwise signed-in account. */
  const displayPhone =
    (portalInfo?.phone != null && String(portalInfo.phone).trim()) || userData.mobileNo || "—";
  const displayEmail =
    (portalInfo?.email != null && String(portalInfo.email).trim()) || userData.email || "—";

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

          <div className="flex flex-col w-full bg-slate-100 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl p-10 shadow-xl md:flex-row md:space-x-32 clear-both">
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
              <div className="flex flex-col md:order-2 justify-center items-center ml-[40px] md:items-start md:ml-0">
                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 md:mt-0">
                  Phone &amp; email
                </p>
                <div className="flex items-center space-x-2">
                  <i className="ri-phone-fill text-lg text-slate-500 md:text-lg" aria-hidden />
                  <p className="text-sm text-sky-900 md:text-base">{displayPhone}</p>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <i className="ri-mail-fill text-lg text-slate-500 md:text-lg" aria-hidden />
                  <p className="break-all text-sm text-sky-900 md:text-base">{displayEmail}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 w-full bg-slate-100 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl py-7 px-10 sm:px-14">
            <p className="text-sky-600 text-lg font-semibold">Company detail</p>
            <p className="mt-1 text-sm text-slate-500">
              From your launch flow. Phone and mail here match what you see beside your photo.
            </p>
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

          <EditUser isOpen={isModalOpen} isClose={handleCloseModal} refreshUser={userInfo} />
        </div>
      {openImagePopUp && profileImgSrc && (
        <UserImagePopUp onClose={() => setOpenImagePopUp(false)} src={profileImgSrc} />
      )}
    </div>
  );
}
