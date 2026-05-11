package com.rankwell.admin.serviceImpl;

import org.springframework.stereotype.Service;

import com.rankwell.admin.entity.UserCommConfig;
import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

/**
 * Sends a one-off SMS using Twilio credentials from {@link UserCommConfig} (same fields as mobile OTP).
 */
@Service
public class AdminTwilioTestService {

	/** @return Twilio message SID when accepted (for debugging in Monitor → Logs / Message logs). */
	public String sendTest(UserCommConfig cfg, String rawRecipientPhone, String staticOtp) {
		if (cfg == null) {
			throw new IllegalArgumentException("Twilio configuration is missing.");
		}
		if (!parseBool(cfg.getUserTwilioEnabled())) {
			throw new IllegalArgumentException(
					"Twilio is disabled. Set USER_TWILIO_ENABLED to true to send SMS tests.");
		}
		if (isBlank(cfg.getUserTwilioAccountSid()) || isBlank(cfg.getUserTwilioAuthToken())
				|| isBlank(cfg.getUserTwilioFromNumber())) {
			throw new IllegalArgumentException(
					"Twilio is incomplete. Set Account SID, Auth Token, and From number (save or include them in the test request).");
		}
		String otp = staticOtp == null ? "" : staticOtp.trim();
		if (otp.isEmpty()) {
			throw new IllegalArgumentException("Enter the static OTP text to include in the test SMS.");
		}

		String toE164 = toE164(rawRecipientPhone, cfg);
		String from = cfg.getUserTwilioFromNumber().trim();
		String body = "Edukify admin SMS test.\n\nStatic OTP (as you entered): " + otp
				+ "\n\nIf you received this, Twilio is configured correctly.";

		try {
			Twilio.init(cfg.getUserTwilioAccountSid().trim(), cfg.getUserTwilioAuthToken().trim());
			Message created = Message.creator(new PhoneNumber(toE164), new PhoneNumber(from), body).create();
			String sid = created == null || created.getSid() == null ? "" : created.getSid().trim();
			return sid.isEmpty() ? "unknown" : sid;
		} catch (ApiException e) {
			String detail = e.getMessage() == null || e.getMessage().isBlank()
					? e.getClass().getSimpleName()
					: e.getMessage();
			throw new IllegalStateException("Twilio API error: " + detail, e);
		}
	}

	private static String toE164(String mobileNo, UserCommConfig cfg) {
		if (mobileNo == null || mobileNo.isBlank()) {
			throw new IllegalArgumentException("Enter a recipient phone number.");
		}
		String raw = mobileNo.trim();
		if (raw.startsWith("+")) {
			String digits = raw.replaceAll("[^\\d+]", "");
			if (!digits.matches("^\\+\\d{10,15}$")) {
				throw new IllegalArgumentException("Invalid phone number. Use E.164 (e.g. +9198XXXXXXXX) or 10 digits.");
			}
			return digits;
		}
		String digits = raw.replaceAll("\\D", "");
		if (digits.length() < 10) {
			throw new IllegalArgumentException("Invalid phone number. Enter at least 10 digits or use E.164 with +.");
		}
		String last10 = digits.substring(digits.length() - 10);
		String cc = (cfg == null || isBlank(cfg.getUserTwilioDefaultCountryCode())) ? "+91"
				: cfg.getUserTwilioDefaultCountryCode().trim();
		if (!cc.startsWith("+")) {
			cc = "+" + cc;
		}
		return cc + last10;
	}

	private static boolean parseBool(String s) {
		if (s == null) {
			return false;
		}
		String v = s.trim().toLowerCase();
		return v.equals("true") || v.equals("1") || v.equals("yes") || v.equals("y") || v.equals("on");
	}

	private static boolean isBlank(String s) {
		return s == null || s.trim().isEmpty();
	}
}
