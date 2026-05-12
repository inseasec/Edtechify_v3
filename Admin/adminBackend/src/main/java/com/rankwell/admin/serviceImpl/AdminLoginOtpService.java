package com.rankwell.admin.serviceImpl;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import com.rankwell.admin.entity.Admins;
import com.rankwell.admin.entity.UserCommConfig;
import com.rankwell.admin.repository.UserCommConfigRepository;
import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

@Service
public class AdminLoginOtpService {

	private static final SecureRandom RANDOM = new SecureRandom();

	private static final class OtpRecord {
		private final String code;
		private final Instant expiresAt;

		private OtpRecord(String code, Instant expiresAt) {
			this.code = code;
			this.expiresAt = expiresAt;
		}
	}

	private final UserCommConfigRepository userCommConfigRepository;
	private final Map<String, OtpRecord> store = new ConcurrentHashMap<>();

	@Value("${otp.expiry-seconds:300}")
	private long otpExpirySeconds;

	public AdminLoginOtpService(UserCommConfigRepository userCommConfigRepository) {
		this.userCommConfigRepository = userCommConfigRepository;
	}

	public boolean requiresMobileOtp(Admins admin) {
		return Boolean.TRUE.equals(admin.getIs2FAEnabled()) && hasMobile(admin);
	}

	public boolean requiresEmailOtp(Admins admin) {
		return Boolean.TRUE.equals(admin.getIs2FAEmailEnabled()) && hasEmail(admin);
	}

	public boolean requiresAnyOtp(Admins admin) {
		return requiresMobileOtp(admin) || requiresEmailOtp(admin);
	}

	public long getOtpExpirySeconds() {
		return otpExpirySeconds;
	}

	public boolean hasActiveLoginOtp(String email) {
		String normalized = normalizeEmail(email);
		OtpRecord rec = store.get(normalized);
		if (rec == null) {
			return false;
		}
		return !Instant.now().isAfter(rec.expiresAt);
	}

	public Instant sendLoginOtp(Admins admin, boolean sendMobile, boolean sendEmail) {
		String email = normalizeEmail(admin.getEmail());
		String otp = generateOtp6();
		Instant expiresAt = Instant.now().plusSeconds(otpExpirySeconds);
		store.put(email, new OtpRecord(otp, expiresAt));

		boolean sent = false;
		if (sendEmail) {
			sendEmailOtp(email, otp);
			sent = true;
		}
		if (sendMobile) {
			sendMobileOtp(admin.getMobileNo(), otp);
			sent = true;
		}
		if (!sent) {
			store.remove(email);
			throw new IllegalStateException("No 2FA channel is available for this account.");
		}
		return expiresAt;
	}

	public boolean verifyLoginOtp(String email, String otp) {
		String normalized = normalizeEmail(email);
		OtpRecord rec = store.get(normalized);
		if (rec == null) {
			return false;
		}
		if (Instant.now().isAfter(rec.expiresAt)) {
			store.remove(normalized);
			return false;
		}
		boolean ok = Objects.equals(rec.code, sanitizeOtp(otp));
		if (ok) {
			store.remove(normalized);
		}
		return ok;
	}

	public static boolean hasMobile(Admins admin) {
		return admin != null && admin.getMobileNo() != null && !admin.getMobileNo().trim().isEmpty();
	}

	public static boolean hasEmail(Admins admin) {
		return admin != null && admin.getEmail() != null && !admin.getEmail().trim().isEmpty();
	}

	private void sendEmailOtp(String email, String otp) {
		UserCommConfig cfg = getCommConfigOrNull();
		if (cfg == null || isBlank(cfg.getUserMailHost()) || isBlank(cfg.getUserMailUsername())
				|| isBlank(cfg.getUserMailPassword())) {
			throw new IllegalStateException(
					"SMTP is not configured. Set USER_MAIL_* in User Panel -> Authentication -> OTP Based.");
		}

		JavaMailSenderImpl sender = buildMailSender(cfg);
		SimpleMailMessage msg = new SimpleMailMessage();
		msg.setFrom(cfg.getUserMailUsername().trim());
		msg.setTo(email);
		msg.setSubject("RankWell Admin — login verification code");
		msg.setText("Your login OTP is: " + otp + "\n\nThis code expires in " + otpExpirySeconds + " seconds.");
		sender.send(msg);
	}

	private void sendMobileOtp(String mobileNo, String otp) {
		UserCommConfig cfg = getCommConfigOrNull();
		if (cfg == null) {
			throw new IllegalStateException("Twilio configuration is missing.");
		}
		if (!parseBool(cfg.getUserTwilioEnabled())) {
			throw new IllegalStateException("Twilio is disabled. Enable mobile OTP in Authentication settings.");
		}
		if (isBlank(cfg.getUserTwilioAccountSid()) || isBlank(cfg.getUserTwilioAuthToken())
				|| isBlank(cfg.getUserTwilioFromNumber())) {
			throw new IllegalStateException("Twilio is incomplete. Set Account SID, Auth Token, and From number.");
		}

		String toE164 = toE164(mobileNo, cfg);
		String from = cfg.getUserTwilioFromNumber().trim();
		String body = "Your RankWell Admin login OTP is: " + otp + "\n\nThis code expires in " + otpExpirySeconds
				+ " seconds.";

		try {
			Twilio.init(cfg.getUserTwilioAccountSid().trim(), cfg.getUserTwilioAuthToken().trim());
			Message.creator(new PhoneNumber(toE164), new PhoneNumber(from), body).create();
		} catch (ApiException e) {
			String detail = e.getMessage() == null || e.getMessage().isBlank()
					? e.getClass().getSimpleName()
					: e.getMessage();
			throw new IllegalStateException("Twilio API error: " + detail, e);
		}
	}

	private static String generateOtp6() {
		int n = RANDOM.nextInt(1_000_000);
		return String.format("%06d", n);
	}

	private static String normalizeEmail(String email) {
		if (email == null) {
			throw new IllegalArgumentException("Email is required");
		}
		String e = email.trim().toLowerCase();
		if (!e.matches("^\\S+@\\S+\\.\\S+$")) {
			throw new IllegalArgumentException("Invalid email");
		}
		return e;
	}

	private static String sanitizeOtp(String otp) {
		if (otp == null) {
			return "";
		}
		return otp.trim();
	}

	private UserCommConfig getCommConfigOrNull() {
		try {
			return userCommConfigRepository.findById(1L).orElse(null);
		} catch (Exception e) {
			return null;
		}
	}

	private static JavaMailSenderImpl buildMailSender(UserCommConfig cfg) {
		JavaMailSenderImpl sender = new JavaMailSenderImpl();
		sender.setHost(cfg.getUserMailHost().trim());
		int port = parseInt(cfg.getUserMailPort(), 587);
		sender.setPort(port);
		sender.setUsername(cfg.getUserMailUsername().trim());
		String pwd = cfg.getUserMailPassword() == null ? "" : cfg.getUserMailPassword();
		sender.setPassword(pwd.replaceAll("\\s+", ""));

		Properties props = new Properties();
		props.put("mail.smtp.auth", String.valueOf(parseBool(cfg.getUserMailSmtpAuth())));
		boolean starttls = (port == 587) || parseBool(cfg.getUserMailSmtpStarttls());
		props.put("mail.smtp.starttls.enable", String.valueOf(starttls));
		props.put("mail.smtp.starttls.required", String.valueOf(starttls));
		boolean ssl = (port == 465);
		props.put("mail.smtp.ssl.enable", String.valueOf(ssl));
		props.put("mail.smtp.ssl.trust", cfg.getUserMailHost() == null ? "*" : cfg.getUserMailHost().trim());
		props.put("mail.smtp.connectiontimeout", "5000");
		props.put("mail.smtp.timeout", "5000");
		props.put("mail.smtp.writetimeout", "5000");
		sender.setJavaMailProperties(props);
		return sender;
	}

	private static String toE164(String mobileNo, UserCommConfig cfg) {
		if (mobileNo == null || mobileNo.isBlank()) {
			throw new IllegalArgumentException("Mobile number is required for mobile 2FA.");
		}
		String raw = mobileNo.trim();
		if (raw.startsWith("+")) {
			String digits = raw.replaceAll("[^\\d+]", "");
			if (!digits.matches("^\\+\\d{10,15}$")) {
				throw new IllegalArgumentException("Invalid mobile number.");
			}
			return digits;
		}
		String digits = raw.replaceAll("\\D", "");
		if (digits.length() < 10) {
			throw new IllegalArgumentException("Invalid mobile number.");
		}
		String last10 = digits.substring(digits.length() - 10);
		String cc = (cfg == null || isBlank(cfg.getUserTwilioDefaultCountryCode())) ? "+91"
				: cfg.getUserTwilioDefaultCountryCode().trim();
		if (!cc.startsWith("+")) {
			cc = "+" + cc;
		}
		return cc + last10;
	}

	private static int parseInt(String s, int fallback) {
		if (s == null) {
			return fallback;
		}
		try {
			return Integer.parseInt(s.trim());
		} catch (Exception e) {
			return fallback;
		}
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
