import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { getApiErrorMessage } from "../utils/authPayload";
import { appendAuthIdentifierErrors, resolveAuthIdentifier } from "../utils/authIdentifier";
import { parsePhonePrefill } from "../utils/phoneValidation";
import AuthIdentifierFields from "../Components/AuthIdentifierFields";
import defaultAuthSideImg from "../assets/auth-side-default.jpg";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const baseUrl = window._CONFIG_?.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

  const initialIdentifier = useMemo(() => {
    const s = location?.state?.identifier;
    return typeof s === "string" ? s : "";
  }, [location?.state?.identifier]);

  const initialIsEmail = initialIdentifier.includes("@");
  const initialPhone = useMemo(
    () => (initialIsEmail ? { countryCode: "+91", number: "" } : parsePhonePrefill(initialIdentifier)),
    [initialIdentifier, initialIsEmail],
  );

  const [identifier, setIdentifier] = useState(
    initialIsEmail ? initialIdentifier : "",
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState(initialPhone.countryCode);
  const [phoneNational, setPhoneNational] = useState(initialPhone.number);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const authResolved = useMemo(
    () =>
      resolveAuthIdentifier("BOTH", {
        identifier,
        phoneCountryCode,
        phoneNational,
      }),
    [identifier, phoneCountryCode, phoneNational],
  );
  const identifierType = authResolved.channel;
  const identifierNormalized =
    identifierType === "mobile" ? authResolved.mobileNo : authResolved.email;
  const identifierDisplay =
    identifierType === "mobile" ? authResolved.mobileDisplay : authResolved.email;

  const resetFlow = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setFieldErrors({});
  };

  const sendOtp = async () => {
    setError("");
    setMessage("");
    const tempError = {};
    appendAuthIdentifierErrors(tempError, authResolved, "BOTH");
    if (Object.keys(tempError).length) {
      setFieldErrors(tempError);
      return;
    }
    setFieldErrors({});

    setBusy(true);
    try {
      const payload =
        identifierType === "email"
          ? { email: identifierNormalized }
          : { mobileNo: identifierNormalized };
      await axios.post(`${baseUrl}/users/password/otp/send`, payload);
      setMessage("");
      setStep(2);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    setMessage("");
    const otpClean = String(otp ?? "").replace(/\s+/g, "");
    if (!otpClean) {
      setError("OTP is required.");
      return;
    }
    if (!/^\d{6}$/.test(otpClean)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }
    if (newPassword.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const tempError = {};
    appendAuthIdentifierErrors(tempError, authResolved, "BOTH");
    if (Object.keys(tempError).length) {
      setFieldErrors(tempError);
      setError("Enter a valid email or mobile number.");
      return;
    }

    setBusy(true);
    try {
      const payload =
        identifierType === "email"
          ? { email: identifierNormalized, otp: otpClean, newPassword }
          : { mobileNo: identifierNormalized, otp: otpClean, newPassword };
      const { data } = await axios.post(`${baseUrl}/users/password/reset`, payload);
      setMessage(typeof data === "string" ? data : "Password updated successfully");
      setTimeout(() => navigate("/signin", { replace: true }), 800);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <ForgotPasswordForm
        error={error}
        message={message}
        step={step}
        busy={busy}
        identifier={identifier}
        phoneCountryCode={phoneCountryCode}
        phoneNational={phoneNational}
        identifierDisplay={identifierDisplay}
        fieldErrors={fieldErrors}
        otp={otp}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        onIdentifierChange={(value) => {
          setIdentifier(value);
          resetFlow();
        }}
        onPhoneCountryCodeChange={(value) => {
          setPhoneCountryCode(value);
          resetFlow();
        }}
        onPhoneNationalChange={(value) => {
          setPhoneNational(value);
          resetFlow();
        }}
        onOtpChange={setOtp}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onTogglePassword={() => setShowPassword((p) => !p)}
        onSendOtp={sendOtp}
        onResetPassword={resetPassword}
      />
      <div className="hidden md:block md:w-[70%] relative">
        <img
          src={defaultAuthSideImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

function ForgotPasswordForm(props) {
  const {
    error,
    message,
    step,
    busy,
    identifier,
    phoneCountryCode,
    phoneNational,
    identifierDisplay,
    fieldErrors,
    otp,
    newPassword,
    confirmPassword,
    showPassword,
    onIdentifierChange,
    onPhoneCountryCodeChange,
    onPhoneNationalChange,
    onOtpChange,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onTogglePassword,
    onSendOtp,
    onResetPassword,
  } = props;

  return (
    <div className="w-full md:w-[30%] flex items-start justify-center p-6 pt-10 bg-white">
      <div className="w-full max-w-md">
        <div className="mx-auto px-1 py-2">
          <h3 className="mt-2 text-2xl font-semibold text-gray-900">Forgot Password</h3>

          {message && (
            <p className="mt-4 text-sm text-green-700" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-[25%] space-y-4">
            {step === 1 ? (
              <AuthIdentifierFields
                mode="BOTH"
                identifier={identifier}
                phoneCountryCode={phoneCountryCode}
                phoneNational={phoneNational}
                onIdentifierChange={onIdentifierChange}
                onPhoneCountryCodeChange={onPhoneCountryCodeChange}
                onPhoneNationalChange={onPhoneNationalChange}
                disabled={busy}
                errors={fieldErrors}
              />
            ) : (
              <AuthIdentifierFields
                mode="BOTH"
                identifier={identifier}
                phoneCountryCode={phoneCountryCode}
                phoneNational={phoneNational}
                readOnly
                readOnlyValue={identifierDisplay}
              />
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={onSendOtp}
                disabled={busy}
                className="mt-1 h-9 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? "Sending OTP…" : "Send OTP"}
              </button>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">OTP</label>
                  <input
                    className="mt-1 h-9 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 tracking-[0.35em] shadow-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-gray-50"
                    value={otp}
                    onChange={(e) => onOtpChange(e.target.value)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="------"
                    disabled={busy}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative mt-1">
                    <input
                      className="mt-1 h-9 w-full rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-gray-50"
                      value={newPassword}
                      onChange={(e) => onNewPasswordChange(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={onTogglePassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>
                </div>

                <ConfirmPasswordField
                  confirmPassword={confirmPassword}
                  onConfirmPasswordChange={onConfirmPasswordChange}
                  busy={busy}
                />

                <button
                  type="button"
                  onClick={onResetPassword}
                  disabled={busy}
                  className="mt-1 h-9 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? "Updating…" : "Reset password"}
                </button>
              </>
            )}

            <p className="text-center text-sm text-gray-600">
              <Link to="/signin" className="text-indigo-600 hover:text-indigo-700">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmPasswordField({ confirmPassword, onConfirmPasswordChange, busy }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">Confirm Password</label>
      <input
        className="mt-1 h-9 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-gray-50"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        type="password"
        autoComplete="new-password"
        disabled={busy}
      />
    </div>
  );
}
