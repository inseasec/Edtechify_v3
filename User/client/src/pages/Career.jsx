import React, { useEffect, useRef, useState } from "react";
// import Navbar from "../Components/Navbar";
// import banner from "../assets/banner.jpeg";
import api from "../api";
import axios from "axios";
import { showErrorToast, showSuccessToast } from "../utils/toastUtils";
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

/** Map API `dob` (ISO string or Jackson array) to `input[type=date]` value. */
function careerDobToDateInput(dob) {
  if (dob == null || dob === "") return "";
  if (typeof dob === "string") return dob.length >= 10 ? dob.slice(0, 10) : "";
  if (Array.isArray(dob) && dob.length >= 3) {
    const [y, m, d] = dob;
    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}

/** Map `applicationDate` (LocalDateTime string or array) to YYYY-MM-DD for form display. */
function careerAppliedOnToDateInput(applicationDate) {
  if (applicationDate == null || applicationDate === "") return getTodayDate();
  if (typeof applicationDate === "string") {
    return applicationDate.length >= 10 ? applicationDate.slice(0, 10) : getTodayDate();
  }
  if (Array.isArray(applicationDate) && applicationDate.length >= 3) {
    const [y, m, d] = applicationDate;
    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return getTodayDate();
}

/** Build absolute URL for a stored relative path under the API host (e.g. Careers/*.webm). */
function careerStorageMediaUrl(apiBaseUrl, relativePath) {
  const raw = relativePath != null ? String(relativePath).trim() : "";
  if (!raw) return null;
  const path = raw.replace(/^\/+/, "");
  const base = String(apiBaseUrl || "").replace(/\/+$/, "");
  if (!base) return `/${path}`;
  return `${base}/${path}`;
}

/** API roleType (TECH vs NON_TECH); tolerates camelCase / snake_case and odd casing from JSON */
function normalizeApplyForRoleType(role) {
  const raw = role?.roleType ?? role?.role_type ?? "";
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, "_");
  return s === "TECH" ? "TECH" : "NON_TECH";
}

/** Digits only; supports +91 / 91 / leading 0 before 10-digit Indian mobile. */
function extractIndianMobile10(raw) {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 13 && d.startsWith("091")) return d.slice(3);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
}

function indianMobileValidationMessage(raw) {
  const digits = extractIndianMobile10(raw);
  if (!digits.length) return "Phone number is required";
  if (digits.length !== 10)
    return "Enter a valid 10-digit Indian mobile number (you can use +91 prefix)";
  if (!/^[6-9]\d{9}$/.test(digits))
    return "Indian mobile numbers start with 6, 7, 8, or 9";
  return null;
}

/** Hostname labels: alphanumeric + hyphens; no leading/trailing hyphen. */
function isValidEmailDomain(domain) {
  const d = String(domain).trim();
  if (!d || d.startsWith(".") || d.endsWith(".") || d.includes("..")) return false;
  const labels = d.split(".");
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  if (!/^[a-zA-Z]{2,63}$/.test(tld)) return false;
  for (const lbl of labels) {
    if (!lbl || lbl.length > 63) return false;
    if (lbl.startsWith("-") || lbl.endsWith("-")) return false;
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(lbl)) return false;
  }
  return true;
}

/** Required email; plausibly valid (reasonable local + hostname rules). */
function emailValidationMessage(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return "Email is required";
  if (/\s/.test(t)) return "Email must not contain spaces";
  if (t.length > 254) return "Email is too long";
  const at = t.indexOf("@");
  if (at < 1 || at !== t.lastIndexOf("@")) return "Please enter a valid email address";
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (!domain || local.length > 64) return "Please enter a valid email address";
  if (local.startsWith(".") || local.endsWith(".")) return "Please enter a valid email address";
  if (/\.\./.test(local)) return "Please enter a valid email address";
  if (!/^[\w%+.-]+$/.test(local)) return "Please enter a valid email address";
  if (!isValidEmailDomain(domain)) return "Please enter a valid email address";
  return null;
}

const CITY_DROPDOWN_CAP = 100;

/** Flat rows for dropdown: clearer than nested state headers when many states match. */
function buildCityMatches(query, statesCities, preferredState) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q || !Array.isArray(statesCities) || !statesCities.length) return [];
  const pref = String(preferredState ?? "").trim();
  const rows = [];
  for (const block of statesCities) {
    const st = block?.state;
    const cities = block?.cities;
    if (!st || !Array.isArray(cities)) continue;
    for (const c of cities) {
      if (!c) continue;
      if (String(c).toLowerCase().includes(q)) rows.push({ city: String(c), state: st });
    }
  }
  rows.sort((a, b) => {
    if (pref) {
      const ap = a.state === pref ? 0 : 1;
      const bp = b.state === pref ? 0 : 1;
      if (ap !== bp) return ap - bp;
    }
    const byCity = a.city.localeCompare(b.city, undefined, { sensitivity: "base" });
    if (byCity !== 0) return byCity;
    return a.state.localeCompare(b.state, undefined, { sensitivity: "base" });
  });
  return rows.slice(0, CITY_DROPDOWN_CAP);
}

const Career = () => {
  const fileRef = useRef(null);
  const formShellRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const finalBlobRef = useRef(null);

  const webcamVideoRef = useRef(null);
  const webcamVideoStreamRef = useRef(null);
  const webcamAudioStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const offscreenVideosRef = useRef([]);
  const drawIntervalRef = useRef(null);
  const webcamEnabledRef = useRef(false);
  /** When OTP-loaded application had applyFor before jobs list resolved */
  const pendingApplyForHydrateRef = useRef(null);

  const [rolesList, setRolesList] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");

  const [roleType, setRoleType] = useState("");

  // API: TECH = teaching titles, NON_TECH = admin / support roles (HR, BDE, …).
  // Form `roleType` is inverted: NON_TECH = teaching path (subjects required), TECH = non-teaching.
  const nonTechRoles = rolesList.filter((role) => normalizeApplyForRoleType(role) === "NON_TECH");

  const formRoleTypeFromApiRole = (apiRole) => {
    if (!apiRole) return "";
    return normalizeApplyForRoleType(apiRole) === "TECH" ? "NON_TECH" : "TECH";
  };

  /** Placeholder value: last option in the first select; opens teaching titles + subjects. */
  const TEACHING_PATH_VALUE = "__TEACHING_PATH__";

  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", maritalStatus: "", state: "", city: "", dob: "", gender: "",
    qualification: "", currentSalary: "", expectedSalary: "", experienceLevel: "", roleType: "", role: "",
    subjects: "", resume: null, introVideo: null, videoUrl: "", applicationDate: getTodayDate()
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /** After submit, "View your candidature" requires OTP before reopening the form (same APIs as Existing Application). */
  const [otpGateAfterSubmitView, setOtpGateAfterSubmitView] = useState(false);
  /** Set after successful first submit — enables update PUT and locks email / phone */
  const [savedCareerId, setSavedCareerId] = useState(null);
  const [openVideoModal, setOpenVideoModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  /** Full URL for intro video already saved on server (OTP / update flows) when no local blob */
  const [storedIntroVideoUrl, setStoredIntroVideoUrl] = useState(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [statesCities, setStatesCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [applyOption, setApplyOption] = useState("");
  const [salaryHelp, setSalaryHelp] = useState({ current: "", expected: "" });

  const STEPS = [
    { id: "personal", label: "Personal Info" },
    { id: "portfolio", label: "Portfolio & Experience" },
    { id: "video", label: "Intro Video & Submit" },
  ];
  const [currentStep, setCurrentStep] = useState(0);

  const [activeTab, setActiveTab] = useState("new"); // 'new' | 'existing'
  const [signupMode, setSignupMode] = useState("BOTH"); // NORMAL | EMAIL | MOBILE | BOTH
  const [alreadyApplied, setAlreadyApplied] = useState({
    open: false,
    message: "",
    appliedOn: "",
  });
  const [existing, setExisting] = useState({
    identifier: "",
    otp: "",
    otpSent: false,
    verifying: false,
    sending: false,
    token: "",
    application: null,
  });

  const scrollFormIntoView = () => {
    formShellRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const focusFirstFieldInForm = () => {
    const root = formShellRef.current;
    if (!root) return;
    const el = root.querySelector("input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled])");
    if (el && typeof el.focus === "function") el.focus();
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      roleType: roleType,
      role: selectedRole
    }));
  }, [roleType, selectedRole]);

  useEffect(() => {
    let mounted = true;
    const fetchMode = async () => {
      try {
        const res = await api.get("/users/signup-mode");
        const mode = String(res?.data?.mode || "BOTH").toUpperCase();
        if (mounted) setSignupMode(["NORMAL", "EMAIL", "MOBILE", "BOTH"].includes(mode) ? mode : "BOTH");
      } catch {
        // keep default
      }
    };
    fetchMode();
    return () => {
      mounted = false;
    };
  }, []);

  const existingMode = signupMode === "NORMAL" ? "EMAIL" : signupMode;
  const existingLabel =
    existingMode === "EMAIL" ? "Email" : existingMode === "MOBILE" ? "Mobile" : "Email / Mobile";
  const existingPlaceholder =
    existingMode === "EMAIL"
      ? "Enter your email"
      : existingMode === "MOBILE"
        ? "Enter your mobile number"
        : "Enter your email or mobile number";

  const resetExisting = () => {
    setExisting({
      identifier: "",
      otp: "",
      otpSent: false,
      verifying: false,
      sending: false,
      token: "",
      application: null,
    });
  };

  const sendExistingOtp = async () => {
    const identifier = existing.identifier.trim();
    if (!identifier) return showErrorToast(`${existingLabel} is required`);
    setExisting((p) => ({ ...p, sending: true }));
    try {
      await api.post("/careers/existing/otp/send", { identifier, mode: existingMode });
      showSuccessToast("OTP sent");
      setExisting((p) => ({ ...p, otpSent: true }));
    } catch (err) {
      showErrorToast(err?.response?.data || err?.message || "Failed to send OTP");
    } finally {
      setExisting((p) => ({ ...p, sending: false }));
    }
  };

  const verifyExistingOtp = async () => {
    const identifier = existing.identifier.trim();
    const otp = existing.otp.trim();
    if (!identifier) return showErrorToast(`${existingLabel} is required`);
    if (!otp) return showErrorToast("OTP is required");
    setExisting((p) => ({ ...p, verifying: true }));
    try {
      const res = await api.post("/careers/existing/otp/verify", { identifier, otp, mode: existingMode });
      const token = res?.data?.token || "";
      if (!token) throw new Error("Missing token");
      const appRes = await api.get(`/careers/existing?identifier=${encodeURIComponent(identifier)}`, {
        headers: { "X-OTP-Token": token },
      });
      const appData = appRes?.data ?? null;
      if (!appData || appData.id == null) {
        showErrorToast("Could not load your application.");
        return;
      }
      applyFetchedApplicationToForm(appData);
      setActiveTab("new");
      setSubmitted(false);
      setErrors({});
      setCurrentStep(0);
      resetExisting();
      setOtpGateAfterSubmitView(false);
      showSuccessToast("Verified — you can edit your candidature below.");
      setTimeout(() => {
        scrollFormIntoView();
        focusFirstFieldInForm();
      }, 0);
    } catch (err) {
      showErrorToast(err?.response?.data || err?.message || "OTP verification failed");
    } finally {
      setExisting((p) => ({ ...p, verifying: false }));
    }
  };

  const validateStep = (stepIdx) => {
    const newErrors = {};

    // Step 0: Personal
    if (stepIdx === 0) {
      if (!formData.fullName.trim()) newErrors.fullName = "Valid Name is required";
      const stepEmailErr = emailValidationMessage(formData.email);
      if (stepEmailErr) newErrors.email = stepEmailErr;
      const phoneErrStep = indianMobileValidationMessage(formData.phone);
      if (phoneErrStep) newErrors.phone = phoneErrStep;
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.dob) newErrors.dob = "DOB is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.maritalStatus) newErrors.maritalStatus = "Select marital status";
    }

    // Step 1: Portfolio/Experience
    if (stepIdx === 1) {
      if (!formData.qualification.trim()) newErrors.qualification = "Qualification is required";
      if (!formData.experienceLevel) newErrors.experienceLevel = "Select experience";
      if (!formData.currentSalary.trim()) newErrors.currentSalary = "Current Salary is required";
      if (!formData.expectedSalary.trim()) newErrors.expectedSalary = "Expected Salary is required";

      if (!roleType) {
        newErrors.role = "Please select a role.";
      } else if (roleType === "NON_TECH" && !formData.subjects.trim()) {
        newErrors.subjects = "Subjects are required";
      } else if (roleType === "TECH" && nonTechRoles.length > 0 && !String(selectedRole ?? "").trim()) {
        newErrors.role = "Please select a role.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    const ok = validateStep(currentStep);
    if (!ok) return;
    const next = Math.min(currentStep + 1, STEPS.length - 1);
    setCurrentStep(next);
    setTimeout(() => {
      scrollFormIntoView();
      focusFirstFieldInForm();
    }, 0);
  };

  const goBack = () => {
    const prev = Math.max(currentStep - 1, 0);
    setCurrentStep(prev);
    setTimeout(() => {
      scrollFormIntoView();
      focusFirstFieldInForm();
    }, 0);
  };

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;

    if (type === "file") {
      const file = files?.[0];
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const statesRes = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/states",
          { country: "India" }
        );
        const statesData = statesRes.data.data.states || [];
        const statesWithCities = await Promise.all(
          statesData.map(async s => {
            const cityRes = await axios.post(
              "https://countriesnow.space/api/v0.1/countries/state/cities",
              { country: "India", state: s.name }
            );
            return { state: s.name, cities: cityRes.data.data || [] };
          })
        );
        setStatesCities(statesWithCities);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/applyfor/getAllJobs");
        const roles = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
        setRolesList(roles);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const pid = pendingApplyForHydrateRef.current;
    if (pid == null || !rolesList.length) return;
    const role = rolesList.find((r) => Number(r?.id) === Number(pid));
    if (role) {
      setSelectedRole(role.applyingFor || "");
      setRoleType(formRoleTypeFromApiRole(role));
    } else {
      setSelectedRole("");
      setRoleType("NON_TECH");
    }
    pendingApplyForHydrateRef.current = null;
  }, [rolesList]);

  const applyFetchedApplicationToForm = (app) => {
    const applyForIdRaw = app?.applyForId ?? app?.apply_for_id ?? app?.applyFor?.id ?? null;
    const applyForId =
      applyForIdRaw != null && applyForIdRaw !== "" && !Number.isNaN(Number(applyForIdRaw))
        ? Number(applyForIdRaw)
        : null;

    setFormData((prev) => ({
      ...prev,
      fullName: app?.fullName ?? "",
      email: String(app?.email ?? "").trim(),
      phone: app?.phone != null && String(app.phone).trim() ? extractIndianMobile10(String(app.phone)) : "",
      maritalStatus: app?.maritalStatus ?? "",
      state: app?.state ?? "",
      city: app?.city ?? "",
      dob: careerDobToDateInput(app?.dob),
      gender: app?.gender ?? "",
      qualification: app?.qualification ?? "",
      currentSalary: app?.currentSalary != null && app.currentSalary !== "" ? String(app.currentSalary) : "",
      expectedSalary: app?.expectedSalary != null && app.expectedSalary !== "" ? String(app.expectedSalary) : "",
      experienceLevel: app?.experienceLevel ?? "",
      subjects: app?.subjects ?? "",
      resume: null,
      introVideo: null,
      videoUrl: app?.videoUrl ?? "",
      applicationDate: careerAppliedOnToDateInput(app?.applicationDate),
      roleType: "",
      role: "",
    }));

    setVideoURL((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    finalBlobRef.current = null;
    if (fileRef.current) fileRef.current.value = "";

    setSavedCareerId(Number(app.id));
    setSalaryHelp({ current: "", expected: "" });

    const videoRel = app?.video != null && String(app.video).trim() ? String(app.video).trim() : "";
    setStoredIntroVideoUrl(careerStorageMediaUrl(api.defaults.baseURL, videoRel));

    if (applyForId != null && rolesList.length > 0) {
      const role = rolesList.find((r) => Number(r?.id) === applyForId);
      if (role) {
        setSelectedRole(role.applyingFor || "");
        setRoleType(formRoleTypeFromApiRole(role));
        pendingApplyForHydrateRef.current = null;
      } else {
        setSelectedRole("");
        setRoleType("NON_TECH");
      }
    } else if (applyForId != null) {
      pendingApplyForHydrateRef.current = applyForId;
      setSelectedRole("");
      setRoleType("");
    } else {
      pendingApplyForHydrateRef.current = null;
      setSelectedRole("");
      setRoleType("NON_TECH");
    }
  };

  const parseLpa = (raw) => {
    if (raw == null) return null;
    const t = String(raw).trim();
    if (!t) return null;
    const clean = t.replace(/,/g, "");
    const m = clean.match(/^(\d+(?:\.\d+)?)$/);
    if (!m) return NaN;
    return Number(m[1]);
  };

  const validateLpaValue = (field, raw) => {
    // Empty handled by existing required validators.
    if (!raw || !String(raw).trim()) {
      setSalaryHelp((p) => ({ ...p, [field]: "" }));
      return;
    }
    const v = parseLpa(raw);
    if (!Number.isFinite(v)) {
      setSalaryHelp((p) => ({
        ...p,
        [field]: "Enter salary in Lacs per annum. Example: 5 or 7.5",
      }));
      return;
    }
    // Guardrail: prevent users from typing rupees (e.g. 5000000).
    if (v > 100) {
      setSalaryHelp((p) => ({
        ...p,
        [field]: "Please enter in Lacs per annum, e.g. 5 or 7.5 (not 5000000).",
      }));
      return;
    }
    setSalaryHelp((p) => ({ ...p, [field]: "" }));
  };

  const selectedRoleDesc =
    roleType === "NON_TECH"
      ? (formData.subjects.trim()
          ? `Teaching applicant — specialties: ${formData.subjects.trim()}`
          : "Teaching applicant — add the subjects or areas you teach in Subjects.")
      : rolesList.find((r) => r.applyingFor === selectedRole)?.description || "";

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Valid Name is required";

    const submitEmailErr = emailValidationMessage(formData.email);
    if (submitEmailErr) newErrors.email = submitEmailErr;

    const submitPhoneErr = indianMobileValidationMessage(formData.phone);
    if (submitPhoneErr) newErrors.phone = submitPhoneErr;
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.dob) newErrors.dob = "DOB is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.qualification.trim()) newErrors.qualification = "Qualification is required";
    if (!formData.currentSalary.trim()) newErrors.currentSalary = "Current Salary is required";
    if (!formData.expectedSalary.trim()) newErrors.expectedSalary = "Expected Salary is required";
    if (!formData.experienceLevel) newErrors.experienceLevel = "Select experience";
    if (!formData.maritalStatus) newErrors.maritalStatus = "Select marital status";
    if (!formData.state.trim()) newErrors.state = "State is required";
    const hasPlayableIntro =
      Boolean(formData.introVideo) ||
      Boolean(storedIntroVideoUrl) ||
      Boolean(videoURL);
    if (!savedCareerId && !hasPlayableIntro) newErrors.introVideo = "Intro video is required";

    if (!roleType) {
      newErrors.role = "Please select a role.";
    } else if (roleType === "NON_TECH" && !formData.subjects.trim()) {
      newErrors.subjects = "Subjects are required";
    } else if (roleType === "TECH" && nonTechRoles.length > 0 && !String(selectedRole ?? "").trim()) {
      newErrors.role = "Please select a role.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      fullName: "", email: "", phone: "", city: "", dob: "", gender: "", state: "", maritalStatus: "",
      qualification: "", currentSalary: "", expectedSalary: "", experienceLevel: "", roleType: "", role: "",
      subjects: "", resume: null, videoUrl: "", introVideo: null, applicationDate: getTodayDate()
    });
    setErrors({});
    setAlreadyApplied({ open: false, message: "", appliedOn: "" });
    setFilteredCities([]); setShowCityDropdown(false);
    if (fileRef.current) fileRef.current.value = "";
    setVideoURL((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setStoredIntroVideoUrl(null);
    finalBlobRef.current = null;
    setRoleType("");
    setSelectedRole("");
    setCurrentStep(0);
    setSubmitted(false);
    setOtpGateAfterSubmitView(false);
    setSavedCareerId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const isUpdate = savedCareerId != null;
    try {
      const selectedRoleObj =
        roleType === "TECH" ? rolesList.find((r) => r.applyingFor === selectedRole) : null;

      const payload = {
        fullName: formData.fullName.trim(),
        email: (formData.email || "").trim(),
        phone: extractIndianMobile10(formData.phone),
        maritalStatus: formData.maritalStatus,
        state: formData.state,
        city: formData.city,
        dob: formData.dob,
        gender: formData.gender,
        qualification: formData.qualification,
        currentSalary: formData.currentSalary,
        expectedSalary: formData.expectedSalary,
        experienceLevel: formData.experienceLevel,
        subjects: roleType === "NON_TECH" ? (formData.subjects || "").trim() || null : null,
        videoUrl: (formData.videoUrl || "").trim() || undefined,
        applyFor: roleType === "NON_TECH" ? null : selectedRoleObj?.id ?? null,
        roleType: roleType || formData.roleType || null,
        role: roleType === "TECH" ? selectedRole || null : roleType === "NON_TECH" ? "Teaching" : null,
        applicationDate: formData.applicationDate
      };

      const fd = new FormData();
      fd.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );

      if (formData.resume instanceof File) {
        fd.append("resume", formData.resume);
      }

      if (formData.introVideo instanceof Blob) {
        fd.append("video", formData.introVideo, "intro-video.webm");
      }

      const res = isUpdate
        ? await api.put(`/careers/apply/${savedCareerId}`, fd)
        : await api.post("/careers/apply", fd);

      const nextId = res?.data?.id ?? res?.data?.Id ?? null;
      if (!isUpdate && nextId != null) setSavedCareerId(Number(nextId));

      const savedVideoRel =
        res?.data?.video != null && String(res.data.video).trim() ? String(res.data.video).trim() : "";
      if (savedVideoRel) {
        setStoredIntroVideoUrl(careerStorageMediaUrl(api.defaults.baseURL, savedVideoRel));
      }

      showSuccessToast(
        typeof res?.data?.message === "string"
          ? res.data.message
          : isUpdate
            ? "Your application has been updated."
            : "Application submitted successfully!"
      );
      setSubmitted(true);
      setOtpGateAfterSubmitView(false);
      setAlreadyApplied({ open: false, message: "", appliedOn: "" });

    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409) {
        const serverMsg = typeof data === "string" ? data : data?.message;
        const appliedOn = data?.appliedOn ? String(data.appliedOn) : "";
        setAlreadyApplied({
          open: true,
          message:
            serverMsg ||
            "Your application already exists with your mobile number and email. Please open it from the Existing Application tab.",
          appliedOn,
        });
      } else {
        const detail =
          typeof data === "string" && data.trim()
            ? data
            : data?.message;
        showErrorToast("Failed to submit application: " + (detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const startTimer = () => { setSeconds(0); timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000); };
  const stopTimer = () => { clearInterval(timerRef.current); timerRef.current = null; };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const openRecordModal = () => { setOpenVideoModal(true); };
  const handleRemoveVideo = () => {
    setVideoURL((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setStoredIntroVideoUrl(null);
    finalBlobRef.current = null;
    setFormData((prev) => ({ ...prev, introVideo: null }));
  };
  const handleRerecord = () => { handleRemoveVideo(); setOpenVideoModal(true); };

  const getMediaDevicesOrExplain = () => {
    const md = navigator?.mediaDevices;
    if (md?.getUserMedia) return md;
    const host = window?.location?.hostname || "";
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    const secure = Boolean(window?.isSecureContext) || isLocalhost;
    const hint = secure
      ? "Your browser does not support camera access on this device/browser."
      : "Camera access requires HTTPS (or running on localhost).";
    showErrorToast(
      `${hint} Please open the site on https:// (recommended) or use http://localhost during development.`
    );
    return null;
  };

  const startCapture = async () => {
    if (!webcamEnabledRef.current) return showErrorToast("Please enable camera first!");
    try {
      const md = getMediaDevicesOrExplain();
      if (!md) return;

      // Camera-only recording (no screen share).
      const stream = await md.getUserMedia({ video: true, audio: true });
      webcamVideoStreamRef.current = stream;

      videoRef.current.srcObject = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recordedChunksRef.current = [];
      recorder.ondataavailable = e => e.data.size > 0 && recordedChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        finalBlobRef.current = blob;
        setVideoURL((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setStoredIntroVideoUrl(null);
        setFormData((prev) => ({ ...prev, introVideo: blob }));
      };
      recorder.start(); mediaRecorderRef.current = recorder;
      setRecording(true); startTimer();
    } catch (err) { showErrorToast("Recording failed: " + err.message); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    stopTimer();
    webcamVideoStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    webcamAudioStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    offscreenVideosRef.current.forEach((v) => {
      v.pause();
      v.srcObject = null;
      v.remove();
    });
    offscreenVideosRef.current = [];
    webcamVideoRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const toggleWebcam = async () => {
    if (webcamEnabledRef.current) {
      webcamVideoStreamRef.current?.getTracks?.().forEach((t) => t.stop());
      webcamVideoRef.current?.remove();
      webcamVideoRef.current = null;
      webcamEnabledRef.current = false;
      setWebcamEnabled(false);
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }

    try {
      const md = getMediaDevicesOrExplain();
      if (!md) return;
      const webcamStream = await md.getUserMedia({ video: true });
      webcamVideoStreamRef.current = webcamStream;
      webcamEnabledRef.current = true;
      setWebcamEnabled(true);

      // Preview camera feed in modal video element.
      if (videoRef.current) {
        videoRef.current.srcObject = webcamStream;
      }
    } catch (err) {
      showErrorToast("Failed to enable webcam: " + err.message);
    }
  };

  const firstRoleSelectValue = roleType === "NON_TECH" ? TEACHING_PATH_VALUE : selectedRole || "";

  const handleFirstRoleSelectChange = (e) => {
    const v = e.target.value;
    if (!v) {
      setSelectedRole("");
      setRoleType("");
      return;
    }
    if (v === TEACHING_PATH_VALUE) {
      setSelectedRole("");
      setRoleType("NON_TECH");
      return;
    }
    const role = rolesList.find((r) => r.applyingFor === v);
    if (!role) {
      setSelectedRole("");
      setRoleType("");
      return;
    }
    setSelectedRole(role.applyingFor);
    const nextFormType = formRoleTypeFromApiRole(role);
    setRoleType(nextFormType);
    if (nextFormType !== "NON_TECH") {
      setFormData((p) => ({ ...p, subjects: "" }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.subjects;
        return next;
      });
    }
  };

  return (
    <>
      {/* <Navbar /> */}
      <div className="max-w-4xl mx-auto py-12 px-6">
        {alreadyApplied.open ? (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-orange-900">Application already exists</p>
                <p className="mt-1 text-sm text-orange-800">
                  {alreadyApplied.message}
                  {alreadyApplied.appliedOn ? (
                    <span className="ml-2 text-orange-700">(Applied on: {alreadyApplied.appliedOn})</span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("existing");
                    setSubmitted(false);
                    setOtpGateAfterSubmitView(false);
                    setAlreadyApplied((p) => ({ ...p, open: false }));
                    // Prefill identifier to reduce friction.
                    const identifier = (formData.email || formData.phone || "").trim();
                    setExisting((prev) => ({ ...prev, identifier }));
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Open Existing Application
                </button>
                <button
                  type="button"
                  onClick={() => setAlreadyApplied({ open: false, message: "", appliedOn: "" })}
                  className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-900 hover:bg-orange-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("new");
              resetExisting();
              setOtpGateAfterSubmitView(false);
              setAlreadyApplied({ open: false, message: "", appliedOn: "" });
            }}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
              activeTab === "new"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            }`}
          >
            New Application
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("existing");
              setSubmitted(false);
              setOtpGateAfterSubmitView(false);
              setAlreadyApplied({ open: false, message: "", appliedOn: "" });
            }}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
              activeTab === "existing"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Existing Application
          </button>
        </div>

        {((activeTab === "existing") || (otpGateAfterSubmitView && activeTab === "new")) && !submitted ? (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 space-y-4 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {otpGateAfterSubmitView && activeTab === "new"
                ? "Verify to view your candidature"
                : "Find your application"}
            </h2>
            <p className="text-sm text-gray-600">
              {otpGateAfterSubmitView && activeTab === "new"
                ? "For security, verify the OTP sent to your email or mobile — same steps as Existing Application. Then your application opens for editing."
                : "After you verify the OTP, you’ll be taken to the same multi-step form as &quot;View your candidature&quot; so you can update your details and video."}
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">{existingLabel}</label>
                <input
                  value={existing.identifier}
                  onChange={(e) => setExisting((p) => ({ ...p, identifier: e.target.value }))}
                  placeholder={existingPlaceholder}
                  className="w-full border rounded-lg px-3 py-2 text-sm h-[42px]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">OTP</label>
                <input
                  value={existing.otp}
                  onChange={(e) => setExisting((p) => ({ ...p, otp: e.target.value }))}
                  placeholder="Enter OTP"
                  className="w-full border rounded-lg px-3 py-2 text-sm h-[42px]"
                  disabled={!existing.otpSent}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={sendExistingOtp}
                disabled={existing.sending}
                className="px-6 py-2 rounded-xl shadow text-white disabled:opacity-50"
                style={{ backgroundColor: "#f57200" }}
              >
                {existing.sending ? "Sending..." : existing.otpSent ? "Resend OTP" : "Send OTP"}
              </button>
              <button
                type="button"
                onClick={verifyExistingOtp}
                disabled={!existing.otpSent || existing.verifying}
                className="px-6 py-2 rounded-xl border border-gray-300 bg-white text-gray-800 disabled:opacity-50"
              >
                {existing.verifying ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={resetExisting}
                className="px-6 py-2 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              >
                Clear
              </button>
              {otpGateAfterSubmitView && activeTab === "new" ? (
                <button
                  type="button"
                  onClick={() => {
                    resetExisting();
                    setOtpGateAfterSubmitView(false);
                    setSubmitted(true);
                  }}
                  className="px-6 py-2 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                >
                  Back to confirmation
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {submitted ? (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-200 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Your application has been submitted</h2>
            <p className="mt-3 text-gray-600">
              Thanks for applying. Our team will review your application and contact you if you’re shortlisted.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  resetExisting();
                  const emailTrim = (formData.email || "").trim();
                  const phoneTrim = (formData.phone || "").trim();
                  let prefill = "";
                  if (existingMode === "EMAIL") prefill = emailTrim;
                  else if (existingMode === "MOBILE") prefill = phoneTrim;
                  else prefill = emailTrim || phoneTrim;
                  setExisting({
                    identifier: prefill,
                    otp: "",
                    otpSent: false,
                    verifying: false,
                    sending: false,
                    token: "",
                    application: null,
                  });
                  setErrors({});
                  setSubmitted(false);
                  setOtpGateAfterSubmitView(true);
                  setActiveTab("new");
                  setTimeout(() => {
                    scrollFormIntoView();
                  }, 0);
                }}
                className="px-8 py-3 rounded-xl shadow-lg text-white hover:scale-105 transition-transform"
                style={{ backgroundColor: "#f57200" }}
              >
                View your candidature
              </button>
            </div>
          </div>
        ) : activeTab === "new" && !otpGateAfterSubmitView ? (
          <form
            ref={formShellRef}
            onSubmit={(e) => {
              // Prevent accidental submits from intermediate steps.
              if (currentStep !== STEPS.length - 1) {
                e.preventDefault();
                return;
              }
              handleSubmit(e);
            }}
            className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 space-y-3 border border-gray-200"
          >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    // allow navigating backwards only
                    if (idx <= currentStep) setCurrentStep(idx);
                  }}
                  className={`rounded-full px-3 py-1 border transition ${
                    idx === currentStep
                      ? "bg-gray-900 text-white border-gray-900"
                      : idx < currentStep
                        ? "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  disabled={idx > currentStep}
                >
                  {idx + 1}. {s.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-600">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>

          {currentStep === 0 && (
          <Section color="bg-gradient-to-r from-blue-50 to-white/80">
            <h3 className="text-2xl font-semibold border-b pb-2 text-center">
              <span style={{ color: "orange" }}>Personal</span>{" "}
              <span style={{ color: "black" }}>Information</span>
            </h3>

            {savedCareerId != null ? (
              <p className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600">
                Email and mobile cannot be changed for this application — they tie your submission to our records.
              </p>
            ) : null}

            <span className="absolute -top-3 right-6 bg-white px-2 text-sm text-gray-600">
              Date: {formData.applicationDate}
            </span>

            <div className="grid md:grid-cols-2 gap-4">
              <Input name="fullName" label="Full Name" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required error={errors.fullName} />
              <Input name="dob" label="DOB" placeholder="30/04/2000" type="date" value={formData.dob} onChange={handleChange} required error={errors.dob} />
              <Input name="phone" label="Phone" placeholder="Enter your phone number" value={formData.phone} onChange={handleChange} required error={errors.phone} disabled={savedCareerId != null} />
              <Input name="email" label="Email" placeholder="Enter your email" type="email" value={formData.email} onChange={handleChange} required error={errors.email} disabled={savedCareerId != null} />
              <CityInput {...{ formData, setFormData, statesCities, filteredCities, setFilteredCities, showCityDropdown, setShowCityDropdown }} error={errors.city} />
              <Input
                name="state"
                label="State"
                placeholder="Fills when you pick a city, or type here"
                value={formData.state}
                onChange={handleChange}
                required
                error={errors.state}
                hint="Usually filled from your city choice. Edit if your state should be different."
              />
              <SelectInput name="gender" label="Gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} required error={errors.gender} />
              <SelectInput name="maritalStatus" label="Marital Status" value={formData.maritalStatus} onChange={handleChange} options={["Single", "Married", "Divorced"]} required error={errors.maritalStatus} />
            </div>
          </Section>
          )}

          {currentStep === 1 && (
          <Section color="bg-gradient-to-r from-blue-50 to-white/80">

            <h3 className="text-2xl font-semibold border-b pb-2 text-center">
              <span className="text-black">Portfolio &</span>{" "}
              <span className="text-orange-500">Experience</span>
            </h3>

            {/* Qualification + Experience */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Input
                name="qualification"
                label="Qualification"
                placeholder="Your highest qualification"
                value={formData.qualification}
                onChange={handleChange}
                required
                error={errors.qualification}
              />

              <SelectInput
                name="experienceLevel"
                label="Experience"
                value={formData.experienceLevel}
                onChange={handleChange}
                required
                error={errors.experienceLevel}
                options={["0-1", "1-3", "3-5", "5+"]}
              />
            </div>

            {/* Staff roles from Admin + Teaching role (opens Subjects on the right; no teaching job catalog). */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="block font-medium mb-2 mt-[-5px]">
                  Select Role <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={firstRoleSelectValue}
                    onChange={handleFirstRoleSelectChange}
                    aria-label="Select role"
                    className={`w-full min-w-0 border rounded-xl px-4 py-2 text-sm
                      transition-all focus:ring-2 focus:ring-orange-400
                      ${errors.role ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Choose role</option>
                    {nonTechRoles.map((role) => (
                      <option key={role.id} value={role.applyingFor}>
                        {role.applyingFor}
                      </option>
                    ))}
                    <option
                      value={TEACHING_PATH_VALUE}
                      style={{ fontWeight: 600, backgroundColor: "#e0f2fe", color: "#0c4a6e" }}
                    >
                      Teaching role
                    </option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleType("");
                      setSelectedRole("");
                      setFormData((p) => ({ ...p, subjects: "" }));
                    }}
                    className="shrink-0 px-4 rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
                    title="Reset role"
                  >
                    Change
                  </button>
                </div>

                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>

              {roleType === "NON_TECH" ? (
                <Input
                  name="subjects"
                  label="Subjects You Can Teach"
                  placeholder="e.g. Math, Physics — list your specialties"
                  value={formData.subjects}
                  onChange={handleChange}
                  required
                  error={errors.subjects}
                />
              ) : (
                <div className="hidden md:block" aria-hidden />
              )}
            </div>

            {/* Current + Expected Salary */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <SalaryLpaField
                label="Current Salary"
                required
                value={formData.currentSalary}
                error={errors.currentSalary}
                help={salaryHelp.current}
                onChangeValue={(raw) => {
                  setFormData((p) => ({ ...p, currentSalary: raw }));
                  validateLpaValue("current", raw);
                }}
              />

              <SalaryLpaField
                label="Expected Salary"
                required
                value={formData.expectedSalary}
                error={errors.expectedSalary}
                help={salaryHelp.expected}
                onChangeValue={(raw) => {
                  setFormData((p) => ({ ...p, expectedSalary: raw }));
                  validateLpaValue("expected", raw);
                }}
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                Upload Resume <span className="text-gray-500 text-sm"> (Optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  name="resume"
                  onChange={handleChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click?.()}
                  className={`h-[42px] whitespace-nowrap rounded-lg px-4 text-sm font-medium text-white transition ${
                    errors.resume ? "bg-red-600" : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  Choose file
                </button>
                {formData.resume ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (fileRef.current) fileRef.current.value = "";
                      setFormData((p) => ({ ...p, resume: null }));
                    }}
                    className="h-[42px] whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 hover:bg-gray-50"
                    title="Remove selected file"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {formData.resume?.name ? (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium text-gray-900">{formData.resume.name}</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No file selected</p>
              )}
              {errors.resume && <p className="text-red-500 text-sm mt-1">{errors.resume}</p>}
            </div>

            <div>
              <label className="block font-medium mb-1">Video Profile Link (YouTube / Instagram / Other) - Optional</label>
              <input
                type="text"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="Paste Video URL"
                className="w-full border rounded-lg px-3 py-2 text-sm h-[42px]"
              />
            </div>

          </Section>
          )}

          {currentStep === 2 && (
          <Section title="Intro Video" color="bg-gradient-to-r from-blue-50 to-white/80">
            <VideoSection {...{ openRecordModal, formData, errors, storedIntroVideoUrl, handleRerecord, handleRemoveVideo, selectedRole, selectedRoleDesc, savedCareerId }} />
          </Section>
          )}

          <div className="sticky bottom-0 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-white/95 backdrop-blur border-t border-gray-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                goBack();
              }}
              disabled={currentStep === 0 || loading}
              className="px-6 py-2 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  goNext();
                }}
                disabled={loading}
                className="px-10 py-3 rounded-xl shadow-lg text-white hover:scale-105 transition-transform disabled:opacity-50"
                style={{ backgroundColor: "#f57200" }}
              >
                Next
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-3">
                {savedCareerId != null ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      setErrors({});
                      setOtpGateAfterSubmitView(false);
                      setSubmitted(true);
                    }}
                    className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    // Ensure required fields are satisfied before submit.
                    if (!validateForm()) {
                      // New applications need a recording; updates can reuse the saved video server-side.
                      if (!savedCareerId && !formData.introVideo && !videoURL && !storedIntroVideoUrl) {
                        setCurrentStep(2);
                        setTimeout(() => {
                          scrollFormIntoView();
                        }, 0);
                        return;
                      }
                      const step0Ok = validateStep(0);
                      if (!step0Ok) setCurrentStep(0);
                      else setCurrentStep(1);
                      setTimeout(() => {
                        scrollFormIntoView();
                        focusFirstFieldInForm();
                      }, 0);
                      return;
                    }
                    handleSubmit(e);
                  }}
                  className="bg-gradient-to-r to-indigo-700 text-white px-10 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                  style={{ backgroundColor: "#f57200" }}
                >
                  {savedCareerId != null ? (loading ? "Updating..." : "Update Application") : (loading ? "Submitting..." : "Submit Application")}
                </button>
              </div>
            )}
          </div>
          </form>
        ) : null}
      </div>

      {openVideoModal && (
        <VideoModal
          {...{
            videoRef,
            canvasRef,
            videoURL,
            recording,
            formatTime,
            seconds,
            webcamEnabled,
            toggleWebcam,
            startCapture,
            stopRecording,
            setOpenVideoModal,
            handleRerecord,
          }}
        />
      )}
    </>
  );
};


const Section = ({ title, children, color }) => (
  <section
    className={`${color} relative rounded-xl px-5 md:px-6 pt-3 md:pt-4 pb-5 md:pb-6 shadow-md border border-gray-200 space-y-5`}
  >
    {title ? (
      <h3 className="text-2xl font-semibold border-b pb-2 text-center">{title}</h3>
    ) : null}
    {children}
  </section>
);



const inputFieldBaseClass =
  "w-full rounded-lg border bg-white px-3 py-1.5 text-sm shadow-sm outline-none transition placeholder:text-gray-400 h-[42px] focus:border-orange-400 focus:ring-2 focus:ring-orange-500/25";

const Input = ({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  error,
  hint,
  disabled = false,
}) => (
  <div>
    <label className="block font-medium mb-1">
      {label}{required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`${inputFieldBaseClass} ${error ? "border-red-500" : "border-gray-300"} ${
        disabled ? "cursor-not-allowed bg-gray-100 text-gray-700 opacity-95" : ""
      }`}
    />
    {hint ? <p className="mt-1.5 text-xs leading-snug text-gray-500">{hint}</p> : null}
    {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
  </div>
);

const SelectInput = ({ name, label, value, onChange, options = [], required = false, error }) => (
  <div>
    <label className="block font-medium mb-1">
      {label}{required && <span className="text-red-500"> *</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border rounded-lg px-3 py-1.5 text-sm"
    >
      <option value="">Select {label}</option>
      {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const SalaryLpaField = ({
  label,
  required,
  value,
  error,
  help,
  onChangeValue,
}) => (
  <div>
    <label className="block font-medium mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder="e.g. 5 or 7.5"
        className={`w-full border rounded-lg px-3 py-1.5 pr-44 text-sm h-[42px] ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-500">
        Lacs per annum
      </div>
    </div>
    {error ? <p className="text-red-500 text-sm mt-1">{error}</p> : null}
    {!error && help ? <p className="text-amber-600 text-sm mt-1">{help}</p> : null}
  </div>
);


const Error = ({ msg }) => <p className="text-red-500 text-sm mt-1">{msg}</p>;

function CityInput({
  formData,
  setFormData,
  statesCities,
  filteredCities,
  setFilteredCities,
  showCityDropdown,
  setShowCityDropdown,
  error,
}) {
  const preferredState = String(formData.state ?? "").trim();

  const applyFilter = (rawValue) => {
    const val = String(rawValue ?? "");
    const matches = buildCityMatches(val, statesCities, preferredState);
    setFilteredCities(matches);
    setShowCityDropdown(val.trim().length > 0);
  };

  return (
    <div>
      <label className="block font-medium mb-1" htmlFor="career-city-input">
        City <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          id="career-city-input"
          type="text"
          name="city"
          autoComplete="off"
          role="combobox"
          aria-expanded={showCityDropdown}
          aria-autocomplete="list"
          aria-controls="career-city-listbox"
          value={formData.city}
          placeholder="e.g. Chandigarh, Mumbai…"
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({ ...prev, city: val }));
            applyFilter(val);
          }}
          onFocus={(e) => {
            if (e.target.value.trim()) applyFilter(e.target.value);
          }}
          onBlur={() => {
            window.setTimeout(() => setShowCityDropdown(false), 250);
          }}
          className={`${inputFieldBaseClass} pr-10 ${error ? "border-red-500" : "border-gray-300"}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400" aria-hidden>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>

        {showCityDropdown && formData.city.trim().length > 0 && (
          <ul
            id="career-city-listbox"
            role="listbox"
            className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
          >
          {filteredCities.length === 0 ? (
            <li role="presentation" className="px-3 py-3 text-center text-sm text-gray-600">
              No matching city — try another spelling or type more letters.
            </li>
          ) : (
            <>
              {filteredCities.length >= CITY_DROPDOWN_CAP && (
                <li
                  role="presentation"
                  className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                >
                  Showing first {CITY_DROPDOWN_CAP} matches — keep typing to narrow the list.
                </li>
              )}
              {filteredCities.map((row, i) => (
                <li key={`${row.state}-${row.city}-${i}`} role="presentation">
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-orange-50 focus-visible:bg-orange-50 focus-visible:outline-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFormData((prev) => ({
                        ...prev,
                        city: row.city,
                        state: row.state,
                      }));
                      setShowCityDropdown(false);
                    }}
                  >
                    <span className="min-w-0 flex-1 font-medium text-gray-900">{row.city}</span>
                    <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {row.state}
                    </span>
                  </button>
                </li>
              ))}
            </>
          )}
          </ul>
        )}
      </div>

      <p className="mt-1.5 text-xs leading-snug text-gray-500">
        Type a few letters, then tap a row to choose — <span className="font-medium text-gray-600">state fills in automatically</span>. Duplicate city names include the state badge so you know which row to pick.
      </p>

      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}


const VideoSection = ({
  openRecordModal,
  formData,
  errors,
  storedIntroVideoUrl,
  handleRerecord,
  handleRemoveVideo,
  selectedRole,
  selectedRoleDesc,
  savedCareerId,
}) => {
  const hasSavedServerVideo = Boolean(storedIntroVideoUrl) && !formData.introVideo;
  const hasLocalRecording = Boolean(formData.introVideo);
  const showReplaceActions = hasLocalRecording || hasSavedServerVideo;

  return (
    <div className="bg-gray-50 rounded-2xl px-6 py-6 space-y-4 shadow-md border border-gray-200">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Record your intro video
            {savedCareerId == null ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-gray-600"> — optional replace</span>}
          </h3>
          {savedCareerId != null && hasSavedServerVideo ? (
            <p className="mb-3 text-xs leading-snug text-gray-600">
              Your intro video is already on file (required at apply time). You can update other details and submit — no need to record again. Use{" "}
              <strong>Re-record</strong> or <strong>Remove</strong> only if you want to replace it.
            </p>
          ) : null}
          {savedCareerId != null && !hasSavedServerVideo && !hasLocalRecording ? (
            <p className="mb-3 text-xs leading-snug text-gray-600">
              Your previous intro video is still on file. Use <strong>Record video</strong> or <strong>Re-record</strong> below only if you want to replace it.
            </p>
          ) : null}
          <button type="button" onClick={openRecordModal} className="inline-flex items-center gap-2 text-gray-800 px-3 py-1 text-sm font-medium rounded hover:opacity-90 transition" style={{ backgroundColor: "#cc8e51b2" }}><span className="font-bold">+</span> Record video</button>
          {errors?.introVideo ? <p className="text-red-600 text-sm mt-2">{errors.introVideo}</p> : null}
          {showReplaceActions ? (
            <div className="flex gap-2 mt-2 flex-wrap">
              <button type="button" onClick={handleRerecord} className="bg-black text-white px-3 py-1 rounded-lg text-sm hover:opacity-90 transition">Re-record</button>
              <button type="button" onClick={handleRemoveVideo} className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:opacity-90 transition">Remove</button>
            </div>
          ) : null}
        </div>
        <div className="text-sm text-gray-700 mt-1 space-y-1">
          {(selectedRole || formData.roleType === "NON_TECH") && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-gray-800">
              <p>{selectedRoleDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoModal = ({ videoRef, canvasRef, videoURL, recording, formatTime, seconds, webcamEnabled, toggleWebcam, startCapture, stopRecording, setOpenVideoModal, handleRerecord }) => (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl w-[95vw] max-w-3xl max-h-[85vh] overflow-auto p-4 sm:p-6 relative">
      <button onClick={() => setOpenVideoModal(false)} className="absolute top-3 right-3" type="button">✕</button>
      <h2 className="text-xl font-bold mb-4">Record Intro Video</h2>
      <canvas ref={canvasRef} width="1480" height="800" className="hidden" />
      {!videoURL ? <>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full border rounded shadow bg-black mb-4 h-[45vh] sm:h-[420px] max-h-[55vh]"
        />
        <div className="flex flex-wrap gap-3 items-center">
          <button type="button" onClick={toggleWebcam} className={`px-4 py-2 rounded text-white ${webcamEnabled ? "bg-green-600" : "bg-gray-500"}`}>{webcamEnabled ? "Camera Enabled" : "Enable Camera"}</button>
          {!recording && <button type="button" onClick={startCapture} disabled={!webcamEnabled} className={`px-4 py-2 rounded text-white ${webcamEnabled ? "bg-blue-600" : "bg-blue-300 cursor-not-allowed"}`}>Start Recording</button>}
          {recording && (
            <div className="flex items-center gap-3 sm:ml-auto">
              <span className="text-red-600 font-semibold">REC</span>
              <span className="font-bold text-gray-800">{formatTime(seconds)}</span>
              <button type="button" onClick={stopRecording} className="bg-red-600 text-white px-4 py-2 rounded">Stop</button>
            </div>
          )}
        </div>
      </> : (
        <>
          <video
            src={videoURL}
            controls
            playsInline
            className="w-full border rounded shadow bg-black mb-4 h-[45vh] sm:h-[420px] max-h-[55vh]"
          />
          <div className="flex flex-wrap gap-3 items-center justify-end">
            <button type="button" onClick={handleRerecord} className="rounded-lg bg-gray-200 px-6 py-2">
              Re-record
            </button>
            <button type="button" onClick={() => setOpenVideoModal(false)} className="rounded-lg bg-black px-6 py-2 text-white">
              Done
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);

export default Career;

