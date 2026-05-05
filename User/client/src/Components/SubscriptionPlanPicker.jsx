import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { showErrorToast } from "../utils/toastUtils";

function axiosErrorMessage(error, fallback = "Something went wrong") {
  const d = error?.response?.data;
  if (typeof d === "string" && d.trim()) return d.trim();
  if (d && typeof d === "object" && d.message) return String(d.message);
  if (error?.message) return String(error.message);
  return fallback;
}

function formatDurationDays(days) {
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

export default function SubscriptionPlanPicker() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/subscription-plans/active");
      const list = Array.isArray(data) ? data : [];
      setPlans(list);
      if (list.length > 0) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      showErrorToast(axiosErrorMessage(e, "Could not load subscription plans."));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = plans.find((p) => p.id === selectedId) ?? null;

  const goCheckout = () => {
    if (!selected) {
      showErrorToast("Choose a plan to continue.");
      return;
    }
    navigate("/account/buynow", { state: { plan: selected, checkoutKind: "subscription" } });
  };

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Upgrade your plan</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Compare subscription options below. Each plan shows price, billing period length, and included storage for
          your edtech portal.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-sky-100 bg-white/90 px-6 py-14 text-center text-slate-500 shadow-sm">
          Loading plans…
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-6 py-10 text-center text-amber-900 shadow-sm">
          <p className="font-semibold">No subscription plans available yet.</p>
          <p className="mt-2 text-sm text-amber-800/90">
            Please contact support, or ask your administrator to add plans under Settings → Subscription Plans.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => {
            const active = selectedId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full flex-col rounded-2xl border-2 p-5 text-left shadow-sm transition-all ${
                  active
                    ? "border-sky-500 bg-gradient-to-b from-sky-50/90 to-white ring-2 ring-sky-200/80"
                    : "border-slate-200 bg-white hover:border-sky-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {active ? "Selected" : "Select"}
                  </span>
                </div>
                {p.description ? (
                  <p className="mt-2 line-clamp-3 text-xs text-slate-600">{p.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">
                    {(p.currency || "INR") === "INR" ? "₹" : `${p.currency} `}
                    {p.price != null ? Number(p.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </span>
                  <span className="text-slate-500">· {formatDurationDays(p.durationDays)}</span>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Storage:</span>{" "}
                  {p.storageLimitMb != null ? `${p.storageLimitMb} MB` : "—"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {plans.length > 0 ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/account/launch")}
            className="text-sm font-semibold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            ← Back to My Edtech Platform
          </button>
          <button
            type="button"
            onClick={goCheckout}
            className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition hover:from-sky-700 hover:to-cyan-700"
          >
            Continue to payment
          </button>
        </div>
      ) : null}
    </div>
  );
}
