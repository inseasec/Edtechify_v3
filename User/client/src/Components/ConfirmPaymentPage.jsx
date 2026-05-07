import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { showErrorToast, showSuccessToast } from "../utils/toastUtils";
import { decodeToken } from "../authConfig";

function formatPlanDurationDays(days) {
  const d = Number(days);
  if (!Number.isFinite(d) || d < 1) return "—";
  if (d % 365 === 0) {
    const y = d / 365;
    return `${y} year${y === 1 ? "" : "s"}`;
  }
  if (d % 30 === 0) {
    const m = d / 30;
    return `${m} month${m === 1 ? "" : "s"}`;
  }
  return `${d} days`;
}

/** Backend returns Razorpay order as `order.toString()` → Axios often gives a JSON string, so `.id` is missing until parsed. */
function parseCreateOrderPayload(data) {
  if (data == null) return { error: "Empty order response." };
  if (typeof data === "object" && data !== null && data.id != null) return { order: data };
  if (typeof data === "string") {
    const s = data.trim();
    if (s.startsWith("Error:")) return { error: s };
    try {
      const parsed = JSON.parse(s);
      if (parsed != null && parsed.id != null) return { order: parsed };
    } catch {
      /* ignore */
    }
    return { error: "Invalid order response." };
  }
  return { error: "Invalid order response." };
}

export default function ConfirmPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const subscriptionPlan = useMemo(() => {
    const st = location.state;
    if (st?.checkoutKind === "subscription" && st?.plan?.id != null) {
      return st.plan;
    }
    return null;
  }, [location.state]);

  // Static demo data (replace with API later)
  const course = useMemo(
    () => ({
      id: 1,
      courseName: "Web Development Bootcamp",
      courseType: "Complete Course",
      deptName: "Computer Science",
      duration: "12h 30m",
      price: 10,
    }),
    [],
  );

  const [portalInfo, setPortalInfo] = useState(null);
  const [accountContact, setAccountContact] = useState({ email: "", mobileNo: "" });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customSaved, setCustomSaved] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("company"); // "company" | "custom"
  const [billingErrors, setBillingErrors] = useState({});

  // Accordion: keep headers visible, only one expanded.
  const [openSection, setOpenSection] = useState("company"); // "company" | "custom"

  const [customDraft, setCustomDraft] = useState({
    name: "",
    address: "",
    gst: "",
  });

  const [billingData, setBillingData] = useState({
    name: "",
    address: "",
    gst: "",
    email: "",
    mobileNo: "",
  });

  const [config, setConfig] = useState({});
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(4);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchConfig();
    paymentInfo();
    loadPrefills();
  }, []);

  const loadPrefills = async () => {
    try {
      const [portalRes, billingRes] = await Promise.allSettled([
        api.get("/clients/me"),
        api.get("/billing/me"),
      ]);

      const portal = portalRes.status === "fulfilled" ? portalRes.value?.data : null;
      setPortalInfo(portal ?? null);

      // Login/account contact is used for custom billing email/mobile.
      try {
        const uid = decodeToken();
        if (uid != null) {
          const ures = await api.get(`/users/getUser/${uid}`);
          const u = ures.data ?? {};
          setAccountContact({
            email: u.email || "",
            mobileNo: u.mobileNo || "",
          });
        }
      } catch {
        // optional
      }

      const saved = billingRes.status === "fulfilled" ? billingRes.value?.data : null;
      const savedSame = saved?.sameAsCompany !== undefined ? Boolean(saved.sameAsCompany) : true;
      const hasCustom =
        Boolean(saved?.billingName?.trim()) ||
        Boolean(saved?.billingEmail?.trim()) ||
        Boolean(saved?.billingPhone?.trim()) ||
        Boolean(saved?.billingAddress?.trim());
      setCustomSaved(hasCustom);
      // Always default to Company on page load.
      setSelectedProfile("company");
      setShowCustomForm(false);
      setOpenSection("company");

      // Base: company details (use company name for billing name)
      const base = {
        name: portal?.companyName || "",
        email: portal?.email || "",
        mobileNo: portal?.phone || "",
        address: portal?.address || "",
        gst: saved?.billingGstNo || "",
      };

      // Always show Company values by default. Keep custom values in the draft (used when user checks the box).
      setBillingData(base);
      setCustomDraft({
        name: hasCustom ? saved?.billingName || "" : "",
        address: hasCustom ? saved?.billingAddress || "" : "",
        gst: saved?.billingGstNo || "",
      });
    } catch {
      // keep empty; user can type
    }
  };

  const paymentInfo = async () => {
    try {
      const response = await api.get("/invoice/getInvoiceSettings");
      const d = response.data || {};
      if (typeof d.invoice_tax_rate === "number") setTaxRate(d.invoice_tax_rate);
    } catch (error) {
      // keep static fallback
      console.error("Error fetching invoice settings:", error);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get(`/paymentConfig/getConfigDetails`);
      setConfig(res.data || {});
      setMsg("");
    } catch (error) {
      console.error("Error fetching payment config:", error);
      setMsg("Razorpay configuration not found.");
    }
  };

  

  const totals = useMemo(() => {
    const base = subscriptionPlan ? Number(subscriptionPlan.price) : Number(course.price);
    const total = Number.isFinite(base) ? base : 0;
    const taxAmount = (total * taxRate) / 100;
    const subtotal = Math.floor(total + taxAmount);
    return {
      total,
      taxAmount,
      subtotal,
      discount: 0,
      amount: subtotal,
    };
  }, [subscriptionPlan, course.price, taxRate, discount]);

  const companyHeaderLabel = useMemo(() => {
    const name = String(portalInfo?.companyName ?? "").trim();
    const address = String(portalInfo?.address ?? "").trim();
    if (!showCustomForm) return "Company (default)";
    const parts = address
      .split(/[\n,]/)
      .map((p) => p.trim())
      .filter(Boolean);
    const shortAddr = parts.length ? parts[parts.length - 1] : "";
    const safeName = name || "Company";
    return shortAddr ? `${safeName}, ${shortAddr}` : safeName;
  }, [portalInfo?.companyName, portalInfo?.address, showCustomForm]);

  const validateBilling = (data = billingData) => {
    const e = {};
    const name = String(data.name ?? "").trim();
    const address = String(data.address ?? "").trim();
    const gst = String(data.gst ?? "").trim();

    // Only validate custom form when it can be used/edited.
    if (openSection === "custom" || selectedProfile === "custom" || showCustomForm) {
      if (!name) e.name = "Company name is required.";
      if (!address) e.address = "Address is required.";
    }

    // GST is optional: no hard validation; trim and allow empty.
    if (gst.length > 64) e.gst = "GST is too long.";
    return e;
  };

  const persistBillingForSelection = async (data) => {
    try {
      const usePortal = selectedProfile === "company";
      await api.put("/billing/me", {
        sameAsCompany: usePortal,
        // When sameAsCompany=true backend keeps custom fields intact; we don't need to send portal values.
        billingName: usePortal ? null : String(customDraft.name ?? "").trim(),
        billingEmail: usePortal ? null : String(accountContact.email ?? "").trim() || null,
        billingPhone: usePortal ? null : String(accountContact.mobileNo ?? "").trim() || null,
        billingAddress: usePortal ? null : String(customDraft.address ?? "").trim(),
        billingGstNo: String(data.gst ?? "").trim() || null,
      });
    } catch {
      // Don't block checkout if billing save fails; invoice can still generate.
    }
  };

  const saveCustomBilling = async () => {
    const e = validateBilling(customDraft);
    setBillingErrors(e);
    if (Object.keys(e).length) return;
    try {
      const effectiveEmail = String(accountContact.email ?? "").trim() || String(portalInfo?.email ?? "").trim();
      const effectivePhone = String(accountContact.mobileNo ?? "").trim() || String(portalInfo?.phone ?? "").trim();
      await api.put("/billing/me", {
        sameAsCompany: false,
        billingName: String(customDraft.name ?? "").trim(),
        billingEmail: effectiveEmail || null,
        billingPhone: effectivePhone || null,
        billingAddress: String(customDraft.address ?? "").trim(),
        // GST is saved from the global GST field below.
        billingGstNo: String(billingData.gst ?? "").trim() || null,
      });
      setCustomSaved(true);
      setSelectedProfile("custom");
      // Keep the custom option visible so user can still pick it before Pay.
      setShowCustomForm(true);
      setOpenSection("custom");
      setBillingData((prev) => ({
        ...prev,
        name: customDraft.name,
        address: customDraft.address,
        email: effectiveEmail,
        mobileNo: effectivePhone,
      }));
      showSuccessToast("Custom billing details saved.");
    } catch (err) {
      console.error("saveCustomBilling", err?.response?.status, err?.response?.data ?? err?.message);
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Could not save billing details";
      const status = err?.response?.status ? ` (${err.response.status})` : "";
      showErrorToast(`${msg}${status}`);
    }
  };

  const userId = decodeToken(); // static userId for demo; backend may ignore/override with token
  const createOrder = async (amount, courseIds) => {
    const paymentInfoPayload = {
      amountStr: String(Math.max(0, Math.round(Number(amount)))),
      userId,
      courseId: Array.isArray(courseIds) ? courseIds : [courseIds],
      subscriptionPlanId: subscriptionPlan?.id ?? null,
    };
    try {
      const res = await api.post("/payment/createOrder", paymentInfoPayload);
      if (res.status === 200) {
        const { order, error } = parseCreateOrderPayload(res.data);
        if (error) {
          showErrorToast(error);
          return;
        }
        openRazorpayCheckout(order, subscriptionPlan);
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      showErrorToast("Order creation failed");
    }

  };
  const openRazorpayCheckout = (order, plan) => {
    if (!window?.Razorpay) {
      showErrorToast("Razorpay script not loaded. Refresh the page.");
      return;
    }

    const key = typeof config?.razorpayKey === "string" ? config.razorpayKey.trim() : "";
    if (!key) {
      showErrorToast("Razorpay key missing in config.");
      return;
    }

    const description = plan?.name
      ? `Subscription: ${plan.name}`
      : "Course Purchase";

    const options = {
      key,
      amount: Math.max(0, Number(totals.amount) || 0) * 100, // paise
      currency: "INR",
      name: "Rankwell",
      description,
      image: "/logo.png",
      order_id: order?.id,
      handler: function (response) {
        api
          .post("/payment/verifyPayment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          .then(() => {
            showSuccessToast("Payment Success!");
            navigate("/account/invoices");
          })
          .catch((err) => {
            console.error(
              "verifyPayment",
              err.response?.status,
              err.response?.data ?? err.message,
            );
            showErrorToast("Payment Verification Failed");
          });
      },
      theme: { color: "#f03106" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="w-full min-h-[560px] bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4 sm:p-6 lg:p-8 rounded-2xl">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
        {/* Left: billing */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl rounded-3xl p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Billing details</h3>
              <p className="mt-1 text-xs text-gray-500">
                Used for invoices/receipts. GST is optional.
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showCustomForm}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowCustomForm(checked);
                  setBillingErrors({});
                  if (checked) {
                    // Open Custom. If saved values exist, keep them; otherwise open blank.
                    if (!customSaved) {
                      setCustomDraft((prev) => ({
                        ...prev,
                        name: "",
                        address: "",
                      }));
                    }
                    setSelectedProfile("custom");
                    setOpenSection("custom");
                  } else {
                    setSelectedProfile("company");
                    setOpenSection("company");
                  }
                }}
              />
              Add different billing details
            </label>
          </div>

          <div className="mt-6 space-y-3">
            {/* Accordion header: Company */}
            <button
              type="button"
              onClick={() => {
                setOpenSection("company");
                setSelectedProfile("company");
                setBillingErrors({});
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                openSection === "company"
                  ? "border-sky-200 bg-sky-50/40"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={
                    showCustomForm
                      ? "text-sm font-semibold text-slate-700"
                      : "text-xs font-bold uppercase tracking-wide text-slate-500"
                  }
                >
                  {companyHeaderLabel}
                </p>
                <div className="flex items-center gap-2">
                  <input type="radio" readOnly checked={selectedProfile === "company"} />
                  <i className={`ri-arrow-${openSection === "company" ? "up" : "down"}-s-line text-lg text-slate-500`} />
                </div>
              </div>
            </button>

            {/* Company body */}
            {openSection === "company" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Company name</p>
                    <p className="mt-0.5 font-medium text-slate-800">{portalInfo?.companyName?.trim() || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Mobile</p>
                    <p className="mt-0.5 font-medium text-slate-800">{portalInfo?.phone?.trim() || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Email</p>
                    <p className="mt-0.5 break-all font-medium text-slate-800">{portalInfo?.email?.trim() || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-slate-600">Address</p>
                    <p className="mt-0.5 whitespace-pre-wrap font-medium text-slate-800">{portalInfo?.address?.trim() || "—"}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Accordion header + body: Custom (only when checkbox enabled) */}
            {showCustomForm ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpenSection("custom");
                    setSelectedProfile("custom");
                    setBillingErrors({});
                    // If custom was saved earlier and user wants to edit, load it into the draft.
                    if (customSaved) setCustomDraft(billingData);
                    else {
                      setCustomDraft((prev) => ({
                        ...prev,
                        name: "",
                        address: "",
                      }));
                    }
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    openSection === "custom"
                      ? "border-sky-200 bg-sky-50/40"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Custom billing
                    </p>
                    <div className="flex items-center gap-2">
                      <input type="radio" readOnly checked={selectedProfile === "custom"} />
                      <i className={`ri-arrow-${openSection === "custom" ? "up" : "down"}-s-line text-lg text-slate-500`} />
                    </div>
                  </div>
                  {customSaved ? (
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Saved — click to view/edit
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Add a different billing profile
                    </p>
                  )}
                </button>

                {openSection === "custom" ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-slate-800">Custom billing details</p>
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-600 hover:underline"
                        onClick={() => {
                          // Folding custom means company opens.
                          setOpenSection("company");
                          setSelectedProfile("company");
                        }}
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-medium text-gray-500 mb-1">Company name</p>
                        <input
                          value={customDraft.name}
                          onChange={(e) => setCustomDraft((p) => ({ ...p, name: e.target.value }))}
                          className={`w-full rounded-xl px-3 py-2 text-sm shadow-inner outline-none ${
                            billingErrors.name ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-gray-50"
                          } text-gray-800`}
                        />
                        {billingErrors.name ? (
                          <p className="mt-1 text-[11px] font-medium text-red-600">{billingErrors.name}</p>
                        ) : null}
                      </div>
                      <div className="sm:col-span-1">
                        <p className="text-[11px] font-medium text-gray-500 mb-1">Email &amp; mobile</p>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          Taken from your login details.
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-[11px] font-medium text-gray-500 mb-1">Address</p>
                        <textarea
                          value={customDraft.address}
                          onChange={(e) => setCustomDraft((p) => ({ ...p, address: e.target.value }))}
                          className={`min-h-[64px] w-full resize-y rounded-xl px-3 py-2 text-sm shadow-inner outline-none ${
                            billingErrors.address
                              ? "border border-red-400 bg-red-50"
                              : "border border-slate-200 bg-gray-50"
                          } text-gray-800`}
                        />
                        {billingErrors.address ? (
                          <p className="mt-1 text-[11px] font-medium text-red-600">{billingErrors.address}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={saveCustomBilling}
                        className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700"
                      >
                        Save custom billing
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {/* GST always available */}
            <div>
              <p className="text-xs text-gray-500 mb-1">GST (optional)</p>
              <input
                value={billingData.gst}
                onChange={(e) => setBillingData({ ...billingData, gst: e.target.value })}
                className={`w-full rounded-xl px-4 py-3 text-sm shadow-inner outline-none ${
                  billingErrors.gst ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-gray-50"
                }`}
              />
              {billingErrors.gst ? <p className="mt-1 text-xs font-medium text-red-600">{billingErrors.gst}</p> : null}
            </div>

            {/* (custom form is now rendered as the expanded body of Custom billing) */}
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs text-gray-500">
            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full">Secure</span>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">Encrypted</span>
            <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full">Trusted</span>
          </div>
        </div>

        {/* Right: pay section */}
        <div className="bg-white shadow-2xl rounded-3xl border border-gray-200 p-7 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 opacity-20 rounded-full blur-3xl"></div>

          {subscriptionPlan ? (
            <p className="mb-4 text-right text-xs">
              <Link
                to="/account/upgrade-plans"
                className="font-semibold text-sky-600 underline-offset-2 hover:text-sky-800 hover:underline"
              >
                Change plan
              </Link>
            </p>
          ) : null}

          <div className="flex gap-4 items-center pb-5 border-b">
            <div className="w-20 h-20 rounded-xl bg-slate-200 shadow-md flex items-center justify-center">
              <i
                className={`text-3xl text-slate-500 ${subscriptionPlan ? "ri-vip-crown-line" : "ri-book-2-line"}`}
              />
            </div>
            <div className="min-w-0">
              {subscriptionPlan ? (
                <>
                  <h3 className="font-semibold text-gray-800 leading-snug truncate">
                    {subscriptionPlan.name}
                  </h3>
                  <p className="text-sm text-gray-500">Edtech portal subscription</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPlanDurationDays(subscriptionPlan.durationDays)} ·{" "}
                    {subscriptionPlan.storageLimitMb != null
                      ? `${subscriptionPlan.storageLimitMb} MB storage`
                      : ""}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-gray-800 leading-snug truncate">
                    {course.courseName}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {course.courseType === "Complete Course" ? "📚" : "📝"} {course.courseType}
                  </p>
                  <p className="text-xs text-gray-400">• {course.deptName}</p>
                  <p className="text-xs text-gray-500 mt-1">⏱ {course.duration}</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">₹{totals.total}</span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>GST</span>
              <span>({taxRate}%)</span>
            </div>

            <div className="flex justify-between pt-3 border-t text-base font-semibold">
              <span>Total (Including GST)</span>
              <span>₹{totals.subtotal}</span>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Amount</span>
              <span className="text-2xl font-bold text-blue-700">₹{totals.amount}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-5 leading-relaxed">
            {subscriptionPlan
              ? "Subscription checkout uses your selected plan amount with the same Razorpay flow."
              : "Static course data + real Razorpay flow (config/order/verify)."}
          </p>

          <button
            type="button"
            onClick={async () => {
              const e = validateBilling(billingData);
              setBillingErrors(e);
              if (Object.keys(e).length) return;
              await persistBillingForSelection(billingData);
              createOrder(totals.amount, subscriptionPlan ? [] : [course.id]);
            }}
            disabled={totals.amount <= 0}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            Pay ₹{totals.amount}
          </button>

          <div className="text-center mt-6 text-xs text-gray-500">30-Day Money-Back Guarantee</div>
        </div>
      </div>

      {msg && (
        <div className="mt-6 flex justify-center">
          <div className="bg-red-100 text-red-600 px-5 py-3 rounded-xl shadow-md text-sm">
            ⚠ {msg}
          </div>
        </div>
      )}
    </div>
  );
}

