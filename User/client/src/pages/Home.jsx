import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { orgMediaUrl } from "../utils/orgMediaUrl";
import MarketingHomePage from "../Components/marketing/MarketingHomePage.jsx";

function mediaTypeFromName(name) {
  if (!name || typeof name !== "string") return "image";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  return "image";
}

function fileUrl(filename, base) {
  return orgMediaUrl(filename, base);
}

export default function Home() {
  const [organisation, setOrganisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const adminApiBaseUrl = window._CONFIG_.VITE_ADMIN_PROJECT_URL;

  useEffect(() => {
    if (!adminApiBaseUrl) {
      setOrganisation(null);
      setLoading(false);
      return;
    }
    const fetchOrganisation = async () => {
      try {
        const res = await axios.get(`${adminApiBaseUrl}/organizations/details`);
        const payload = res.data?.data ?? res.data;
        setOrganisation(payload ?? null);
      } catch {
        setOrganisation(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganisation();
  }, [adminApiBaseUrl]);

  useEffect(() => {
    if (loading) return;
    const anchorId =
      location.hash === "#solution-insights"
        ? "solution-insights"
        : location.hash === "#two-portals"
          ? "two-portals"
          : null;
    if (!anchorId) return;
    const el = document.getElementById(anchorId);
    if (!el) return;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [loading, location.pathname, location.hash]);

  const assetBase = adminApiBaseUrl || window._CONFIG_.VITE_API_BASE_URL;

  const bannerDisplay = useMemo(() => {
    const bannerName = organisation?.orgHome?.bannerVideo;
    if (!bannerName) return null;
    return {
      type: mediaTypeFromName(bannerName),
      src: fileUrl(bannerName, assetBase),
    };
  }, [organisation?.orgHome?.bannerVideo, assetBase]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <MarketingHomePage
      bannerDisplay={bannerDisplay}
      orgHome={organisation?.orgHome ?? {}}
      previewMode={false}
    />
  );
}
