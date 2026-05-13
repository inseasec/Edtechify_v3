import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { decodeToken } from "../authConfig";
import AccountPanel from "../Components/AccountPanel";
import Settings from "../Components/Settings";
import ChangePassword from "../Components/ChangePassword";
import TermAndCondition from "../Components/TermAndCondition";
import BillingInvoices from "../Components/BillingInvoices";
import LaunchEdtechPlatform from "../Components/LaunchEdtechPlatform";
import SubscriptionPlanPicker from "../Components/SubscriptionPlanPicker";
import SubscriptionCheckoutPage from "../Components/SubscriptionCheckoutPage";

function MyAccount() {
  const { component } = useParams();
  const [activeComponent, setActiveComponent] = useState(component || "account");
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [portalLaunched, setPortalLaunched] = useState(false);
  const userId = decodeToken();

  const handlePortalPresenceChange = useCallback((exists) => {
    setPortalLaunched(Boolean(exists));
  }, []);

  useEffect(() => {
    if (component) {
      setActiveComponent(component);
    }
  }, [component]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userId == null) return;
      try {
        await api.get("/clients/me");
        if (!cancelled) setPortalLaunched(true);
      } catch (err) {
        if (err?.response?.status === 404 && !cancelled) setPortalLaunched(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const edtechPortalNavLabel = portalLaunched ? "My Edtech Platform" : "Launch my Edtech Platform";

  const renderComponent = () => {
    switch (activeComponent) {
      case "account":
        return <AccountPanel />;
      case "settings":
        return <Settings />;
      case "changepassword":
        return <ChangePassword />;
      case "termsandcondition":
        return <TermAndCondition />;
      case "invoices":
        return <BillingInvoices />;
      case "upgrade-plans":
        return <SubscriptionPlanPicker />;
      case "subscription-checkout":
        return <SubscriptionCheckoutPage />;
      case "launch":
        return <LaunchEdtechPlatform onPortalPresenceChange={handlePortalPresenceChange} />;
      default:
        return <AccountPanel />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  const handleMenuClick = (name) => {
    navigate(`/account/${name}`);
  };

  const getItemClass = (componentName) =>
    activeComponent === componentName
      ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/20"
      : "text-slate-600 hover:bg-sky-50";

  const mobileItem = (name, icon, label) => (
    <li
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && (handleMenuClick(name), setIsActive(false))}
      onClick={() => {
        handleMenuClick(name);
        setIsActive(false);
      }}
      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${getItemClass(name)}`}
    >
      <i className={`${icon} text-lg shrink-0`} />
      <span className="leading-snug">{label}</span>
    </li>
  );

  const desktopItem = (name, icon, label) => (
    <li
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleMenuClick(name)}
      onClick={() => handleMenuClick(name)}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${getItemClass(name)}`}
    >
      <i className={`${icon} text-lg shrink-0`} />
      <span className="leading-snug">{label}</span>
    </li>
  );

  return (
    // min-h-[calc(100vh-5rem)] reserves one viewport (minus the ~80px sticky
    // navbar) so the gradient page area never collapses on big monitors when
    // a sub-tab has sparse content (e.g. Billing with 2 rows, Change Password).
    // Keeps Footer below the fold consistently across all account sub-pages.
    <div className="w-full max-w-none bg-gradient-to-b from-sky-50/40 via-white to-white min-h-[calc(100vh-5rem)]">
      <div className="relative mx-auto flex w-full max-w-[90rem] flex-col gap-6 px-3 py-6 md:flex-row md:items-start md:gap-4 md:px-4 lg:gap-6 lg:px-5 lg:py-10 xl:gap-8 xl:px-6">
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className="flex w-full items-center gap-2 rounded-xl border border-sky-100 bg-white px-4 py-3 text-left text-slate-800 shadow-sm md:hidden"
          aria-label="Open account menu"
        >
          <i className="ri-menu-2-line text-xl text-sky-600" />
          <span className="text-sm font-semibold">Account menu</span>
        </button>

        {isActive && (
          <div className="fixed inset-x-4 top-20 z-50 md:hidden">
            <div className="rounded-2xl border border-sky-100 bg-white p-3 shadow-xl shadow-sky-900/10">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-sky-600">
                Navigate
              </p>
              <ul className="flex flex-col gap-1">
                {mobileItem("account", "ri-user-settings-line", "Account")}
                {mobileItem("launch", "ri-rocket-line", edtechPortalNavLabel)}
                {mobileItem("settings", "ri-settings-5-line", "Settings")}
                {mobileItem("invoices", "ri-bill-line", "Billing and Invoices")}
                {mobileItem("changepassword", "ri-rotate-lock-line", "Change Password")}
                {mobileItem("termsandcondition", "ri-shield-keyhole-line", "Terms and Conditions")}
                <li
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleLogout()}
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700"
                >
                  <i className="ri-logout-circle-line text-lg" />
                  <span>Logout</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <aside className="relative hidden w-full shrink-0 md:block md:w-[240px] lg:w-[256px]">
          <div className="sticky top-24 rounded-2xl border border-sky-100 bg-white p-3 shadow-md shadow-sky-900/5">
            <p className="mb-3 border-b border-sky-50 px-2 pb-2 text-xs font-bold uppercase tracking-wider text-sky-600">
              Your account
            </p>
            <ul className="flex flex-col gap-1">
              {desktopItem("account", "ri-user-settings-line", "Account")}
              {desktopItem("launch", "ri-rocket-line", edtechPortalNavLabel)}
              {desktopItem("settings", "ri-settings-5-line", "Settings")}
              {desktopItem("invoices", "ri-bill-line", "Billing and Invoices")}
              {desktopItem("changepassword", "ri-rotate-lock-line", "Change Password")}
              {desktopItem("termsandcondition", "ri-shield-keyhole-line", "Terms and Conditions")}
              <li
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleLogout()}
                onClick={handleLogout}
                className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <i className="ri-logout-circle-line text-lg shrink-0" />
                <span>Sign Out</span>
              </li>
            </ul>
          </div>
        </aside>

        <main className="relative min-h-[calc(100vh-9rem)] min-w-0 flex-1 rounded-2xl border border-sky-50 bg-white/80 px-4 py-6 shadow-sm sm:px-6 md:rounded-3xl md:border-sky-100 md:px-6 md:py-10 lg:px-7 xl:px-8">
          {renderComponent()}
        </main>
      </div>
    </div>
  );
}

export default MyAccount;
