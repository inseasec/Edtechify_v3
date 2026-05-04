import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import menus from "../menu.js";
import axios from "axios";
import { decodeToken } from "../authConfig";
import { orgMediaUrl } from "../utils/orgMediaUrl";
import EdukifyLogo from "../Components/EdukifyLogo.jsx";
import "animate.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuDropDown, setMenuDropDown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user_ID, setUser_ID] = useState(null);
  const [userData, setUserData] = useState({});
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [orgLogo, setOrgLogo] = useState("");
  const [orgName, setOrgName] = useState("");
  /** When false, show a neutral placeholder — avoids Edukify flashing before org API returns a custom logo. */
  const [orgBrandingReady, setOrgBrandingReady] = useState(false);

  const desktopAccountRef = useRef(null);
  const mobileAccountRef = useRef(null);

  const baseUrl = window._CONFIG_.VITE_API_BASE_URL;
  const adminApiBaseUrl = window._CONFIG_.VITE_ADMIN_PROJECT_URL;

  const refreshAuth = () => {
    const id = decodeToken();
    if (id == null || id === undefined) {
      setUser_ID(null);
      setIsLoggedIn(false);
      return;
    }
    const uid = typeof id === "number" ? id : Number(id);
    if (Number.isNaN(uid)) {
      setUser_ID(null);
      setIsLoggedIn(false);
      return;
    }
    setUser_ID(uid);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    refreshAuth();
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktop = desktopAccountRef.current?.contains(e.target);
      const inMobile = mobileAccountRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) setIsAccountOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchOrganisation = async () => {
      const token = localStorage.getItem("authToken");
      const apiBase = adminApiBaseUrl || baseUrl;
      setOrgBrandingReady(false);
      if (!apiBase) {
        setOrgLogo("");
        setOrgName("");
        setOrgBrandingReady(true);
        return;
      }
      try {
        const res = await axios.get(`${apiBase}/organizations/details`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setOrgLogo(res.data?.orgLogo ?? "");
        setOrgName(res.data?.orgName ?? "");
      } catch {
        setOrgLogo("");
        setOrgName("");
      } finally {
        setOrgBrandingReady(true);
      }
    };
    fetchOrganisation();
  }, [adminApiBaseUrl, baseUrl]);

  const userInfo = async () => {
    if (!user_ID) return;
    try {
      const response = await axios.get(`${baseUrl}/users/getUser/${user_ID}`);
      setUserData(response.data ?? {});
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    if (!user_ID) {
      setUserData({});
      return;
    }
    userInfo();
  }, [user_ID]);

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    setUser_ID(null);
    setUserData({});
    setIsAccountOpen(false);
    navigate("/");
  };

  const profileImageSrc = () => {
    if (!userData?.userImg) return null;
    const path = String(userData.userImg).replace(/^\/+/, "");
    return `${baseUrl}/${path}`;
  };

  const AccountDropdown = ({ className = "" }) => (
    <div
      className={`absolute right-0 z-50 mt-2 w-52 rounded-xl border border-sky-100 bg-white py-2 text-slate-800 shadow-xl shadow-sky-900/10 ${className}`}
    >
      <button
        type="button"
        onClick={() => {
          navigate("/account");
          setIsAccountOpen(false);
        }}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-sky-50"
      >
        <i className="ri-user-3-line text-sky-500" />
        <span>My Account</span>
      </button>
      <button
        type="button"
        onClick={() => {
          handleSignOut();
        }}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-sky-50"
      >
        <i className="ri-logout-circle-line text-sky-500" />
        <span>Sign Out</span>
      </button>
    </div>
  );

  const ProfileAvatar = ({ containerRef }) => (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsAccountOpen((o) => !o)}
        className="rounded-full border-2 border-sky-100 bg-white shadow-sm ring-2 ring-sky-100/80 focus:outline-none focus:ring-2 focus:ring-sky-300"
        aria-expanded={isAccountOpen}
        aria-haspopup="true"
      >
        {profileImageSrc() ? (
          <img
            src={profileImageSrc()}
            alt="Profile"
            className="h-9 w-9 rounded-full object-cover md:h-10 md:w-10"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-cyan-100 md:h-10 md:w-10">
            <i className="ri-user-3-line text-lg text-sky-600 md:text-xl" />
          </div>
        )}
      </button>
      {isAccountOpen && <AccountDropdown />}
    </div>
  );

  const assetBase = adminApiBaseUrl || baseUrl;
  const brandLogoSrc = orgLogo ? orgMediaUrl(orgLogo, assetBase) : null;
  const brandLabel = typeof orgName === "string" && orgName.trim() ? orgName.trim() : "Edukify";

  const navLinkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700";

  return (
    <>
      {/* Desktop: compact light bar — distinct from full-width dark tenant headers */}
      <header className="sticky top-0 z-50 hidden w-full border-b border-sky-100 bg-white/90 shadow-sm backdrop-blur-md md:block">
        <div className="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between gap-6 px-5 py-2.5 lg:min-h-[80px] lg:px-8 lg:py-3">
          <Link to="/" className="flex min-w-0 shrink-0 items-center py-0.5" aria-label="Home">
            {!orgBrandingReady ? (
              <span
                className="inline-block h-11 w-[200px] max-w-[55vw] animate-pulse rounded-xl bg-slate-200/90 lg:h-[52px]"
                aria-hidden
              />
            ) : brandLogoSrc ? (
              <img
                src={brandLogoSrc}
                alt={brandLabel}
                className="h-11 w-auto max-w-[160px] object-contain lg:h-[52px] lg:max-w-[180px]"
              />
            ) : (
              <EdukifyLogo />
            )}
          </Link>

          <nav className="hidden flex-1 justify-center gap-1 md:flex lg:gap-2">
            {menus.map((item, index) => (
              <Link key={index} to={item.mLink} className={navLinkClass}>
                {item.mName}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
              aria-label="Wishlist"
            >
              <i className="ri-heart-2-fill text-lg" />
            </button>

            <div className="relative">
              {isLoggedIn ? (
                <ProfileAvatar containerRef={desktopAccountRef} />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/signin")}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition hover:from-sky-400 hover:to-cyan-400"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: slimmer single row */}
      <div className="sticky top-0 z-40 border-b border-sky-100 bg-white/95 shadow-sm backdrop-blur-md md:hidden">
        <div className="flex min-h-[64px] items-center justify-between gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => setMenuDropDown(!menuDropDown)}
            className="ri-menu-line shrink-0 cursor-pointer border-0 bg-transparent p-1 text-2xl text-slate-700"
            aria-label="Menu"
          />

          <Link
            to="/"
            className="flex min-w-0 flex-1 justify-center"
            onClick={() => setMenuDropDown(false)}
            aria-label="Home"
          >
            {!orgBrandingReady ? (
              <span
                className="inline-block h-10 w-[160px] max-w-[42vw] animate-pulse rounded-lg bg-slate-200/90 sm:h-11"
                aria-hidden
              />
            ) : brandLogoSrc ? (
              <img
                src={brandLogoSrc}
                alt={brandLabel}
                className="h-10 max-h-10 w-auto object-contain sm:h-11 sm:max-h-11"
              />
            ) : (
              <EdukifyLogo compact />
            )}
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {isLoggedIn ? (
              <ProfileAvatar containerRef={mobileAccountRef} />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/signin")}
                  className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {menuDropDown && (
          <div className="border-t border-sky-100 bg-white px-4 pb-4 pt-2 shadow-inner">
            <div className="flex flex-col gap-1 rounded-xl bg-sky-50/80 p-2">
              {menus.map((item, index) => (
                <Link
                  key={index}
                  to={item.mLink}
                  onClick={() => setMenuDropDown(false)}
                  className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-white hover:text-sky-700"
                >
                  {item.mName}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
