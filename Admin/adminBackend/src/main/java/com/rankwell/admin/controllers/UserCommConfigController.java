package com.rankwell.admin.controllers;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rankwell.admin.entity.Admins;
import com.rankwell.admin.entity.UserCommConfig;
import com.rankwell.admin.repository.AdminRepository;
import com.rankwell.admin.repository.UserCommConfigRepository;
import com.rankwell.admin.serviceImpl.AdminSmtpTestService;
import com.rankwell.admin.serviceImpl.AdminTwilioTestService;

@RestController
@RequestMapping("/admin/user-comm-config")
public class UserCommConfigController {
	private static final String MASK = "********";

	/**
	 * When present on {@code POST /admin/user-comm-config}, triggers a send-only SMTP test instead of saving.
	 * Keeps requests on the same path as saves so gateways that only whitelist exact URIs continue to work.
	 */
	private static final String SMTP_TEST_MAIL_KEY = "SMTP_TEST_MAIL";

	private static final String TWILIO_TEST_SMS_KEY = "TWILIO_TEST_SMS";

	private final AdminRepository adminRepository;
	private final UserCommConfigRepository repo;
	private final AdminSmtpTestService smtpTestService;
	private final AdminTwilioTestService twilioTestService;

	public UserCommConfigController(
			AdminRepository adminRepository,
			UserCommConfigRepository repo,
			AdminSmtpTestService smtpTestService,
			AdminTwilioTestService twilioTestService) {
		this.adminRepository = adminRepository;
		this.repo = repo;
		this.smtpTestService = smtpTestService;
		this.twilioTestService = twilioTestService;
	}

	@GetMapping
	public ResponseEntity<?> get(Principal principal) {
		if (!isAnyAdmin(principal)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body("Access denied. Only logged-in admins can view communication settings.");
		}

		Map<String, Object> out = new HashMap<>();
		UserCommConfig cfg = repo.findById(1L).orElseGet(() -> repo.save(new UserCommConfig()));

		out.put("USER_MAIL_HOST", cfg.getUserMailHost() == null ? "" : cfg.getUserMailHost());
		out.put("USER_MAIL_PORT", cfg.getUserMailPort() == null ? "" : cfg.getUserMailPort());
		out.put("USER_MAIL_USERNAME", cfg.getUserMailUsername() == null ? "" : cfg.getUserMailUsername());
		String mailPassword = cfg.getUserMailPassword() == null ? "" : cfg.getUserMailPassword();
		out.put("USER_MAIL_PASSWORD", mailPassword.isBlank() ? "" : MASK);
		out.put("USER_MAIL_PASSWORD_SET", !mailPassword.isBlank());
		out.put("USER_MAIL_SMTP_AUTH", cfg.getUserMailSmtpAuth() == null ? "true" : cfg.getUserMailSmtpAuth());
		out.put("USER_MAIL_SMTP_STARTTLS", cfg.getUserMailSmtpStarttls() == null ? "true" : cfg.getUserMailSmtpStarttls());

		out.put("USER_TWILIO_ENABLED", cfg.getUserTwilioEnabled() == null ? "false" : cfg.getUserTwilioEnabled());
		out.put("USER_TWILIO_ACCOUNT_SID", cfg.getUserTwilioAccountSid() == null ? "" : cfg.getUserTwilioAccountSid());
		String twilioToken = cfg.getUserTwilioAuthToken() == null ? "" : cfg.getUserTwilioAuthToken();
		out.put("USER_TWILIO_AUTH_TOKEN", twilioToken.isBlank() ? "" : MASK);
		out.put("USER_TWILIO_AUTH_TOKEN_SET", !twilioToken.isBlank());
		out.put("USER_TWILIO_FROM_NUMBER", cfg.getUserTwilioFromNumber() == null ? "" : cfg.getUserTwilioFromNumber());
		out.put("USER_TWILIO_DEFAULT_COUNTRY_CODE",
				cfg.getUserTwilioDefaultCountryCode() == null ? "+91" : cfg.getUserTwilioDefaultCountryCode());

		out.put("USER_MAIL_INSTRUCTIONS", cfg.getUserMailInstructions() == null ? "" : cfg.getUserMailInstructions());
		out.put("USER_TWILIO_INSTRUCTIONS", cfg.getUserTwilioInstructions() == null ? "" : cfg.getUserTwilioInstructions());
		return ResponseEntity.ok(out);
	}

	@PostMapping
	public ResponseEntity<?> save(@RequestBody Map<String, Object> body, Principal principal) {
		if (!isAnyAdmin(principal)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body("Access denied. Only logged-in admins can update communication settings.");
		}
		if (body == null) {
			body = new HashMap<>();
		} else {
			body = new HashMap<>(body);
		}

		Object smtpTestBlock = body.remove(SMTP_TEST_MAIL_KEY);
		if (smtpTestBlock instanceof Map) {
			@SuppressWarnings("unchecked")
			Map<String, Object> testSpec = (Map<String, Object>) smtpTestBlock;
			return sendSmtpTest(
					principal,
					body,
					asTrimmed(testSpec.get("recipientEmail")),
					asTrimmed(testSpec.get("subject")),
					asTrimmed(testSpec.get("staticOtp")));
		}

		Object twilioTestBlock = body.remove(TWILIO_TEST_SMS_KEY);
		if (twilioTestBlock instanceof Map) {
			@SuppressWarnings("unchecked")
			Map<String, Object> testSpec = (Map<String, Object>) twilioTestBlock;
			return sendTwilioTest(
					principal,
					body,
					asTrimmed(testSpec.get("recipientPhone")),
					asTrimmed(testSpec.get("staticOtp")));
		}

		String mailHost = asTrimmed(body.get("USER_MAIL_HOST"));
		String mailPort = asTrimmed(body.get("USER_MAIL_PORT"));
		String mailUsername = asTrimmed(body.get("USER_MAIL_USERNAME"));
		String mailPassword = asTrimmed(body.get("USER_MAIL_PASSWORD"));
		String mailAuth = asTrimmed(body.get("USER_MAIL_SMTP_AUTH"));
		String mailStarttls = asTrimmed(body.get("USER_MAIL_SMTP_STARTTLS"));

		String twilioEnabled = asTrimmed(body.get("USER_TWILIO_ENABLED"));
		String twilioSid = asTrimmed(body.get("USER_TWILIO_ACCOUNT_SID"));
		String twilioToken = asTrimmed(body.get("USER_TWILIO_AUTH_TOKEN"));
		String twilioFrom = asTrimmed(body.get("USER_TWILIO_FROM_NUMBER"));
		String twilioCountry = asTrimmed(body.get("USER_TWILIO_DEFAULT_COUNTRY_CODE"));

		String mailInstructions = asText(body.get("USER_MAIL_INSTRUCTIONS"));
		String twilioInstructions = asText(body.get("USER_TWILIO_INSTRUCTIONS"));

		UserCommConfig existing = repo.findById(1L).orElseGet(UserCommConfig::new);
		existing.setId(1L);

		if (MASK.equals(mailPassword)) {
			mailPassword = existing.getUserMailPassword() == null ? "" : existing.getUserMailPassword();
		}
		if (MASK.equals(twilioToken)) {
			twilioToken = existing.getUserTwilioAuthToken() == null ? "" : existing.getUserTwilioAuthToken();
		}

		existing.setUserMailHost(mailHost);
		existing.setUserMailPort(mailPort);
		existing.setUserMailUsername(mailUsername);
		existing.setUserMailPassword(mailPassword);
		existing.setUserMailSmtpAuth(mailAuth);
		existing.setUserMailSmtpStarttls(mailStarttls);

		existing.setUserTwilioEnabled(twilioEnabled);
		existing.setUserTwilioAccountSid(twilioSid);
		existing.setUserTwilioAuthToken(twilioToken);
		existing.setUserTwilioFromNumber(twilioFrom);
		existing.setUserTwilioDefaultCountryCode(twilioCountry);

		existing.setUserMailInstructions(mailInstructions);
		existing.setUserTwilioInstructions(twilioInstructions);

		repo.save(existing);

		return get(principal);
	}

	/**
	 * Alternate path when the gateway forwards subpaths correctly. Prefer embedding {@link #SMTP_TEST_MAIL_KEY} on
	 * {@code POST /admin/user-comm-config} when deployments only allow that URI.
	 */
	@SuppressWarnings("unchecked")
	@PostMapping("/test-mail")
	public ResponseEntity<?> testMail(@RequestBody Map<String, Object> body, Principal principal) {
		if (body == null) {
			body = Map.of();
		}
		Map<String, Object> smtpForm = (Map<String, Object>) body.get("smtpForm");
		String recipient = asTrimmed(body.get("recipientEmail"));
		String subject = asTrimmed(body.get("subject"));
		String staticOtp = asTrimmed(body.get("staticOtp"));
		return sendSmtpTest(principal, smtpForm, recipient, subject, staticOtp);
	}

	@SuppressWarnings("unchecked")
	@PostMapping("/test-sms")
	public ResponseEntity<?> testSms(@RequestBody Map<String, Object> body, Principal principal) {
		if (body == null) {
			body = Map.of();
		}
		Map<String, Object> twilioForm = (Map<String, Object>) body.get("twilioForm");
		String recipient = asTrimmed(body.get("recipientPhone"));
		String staticOtp = asTrimmed(body.get("staticOtp"));
		return sendTwilioTest(principal, twilioForm, recipient, staticOtp);
	}

	private ResponseEntity<?> sendSmtpTest(
			Principal principal,
			Map<String, Object> smtpMergeSource,
			String recipient,
			String subject,
			String staticOtp) {
		if (!isAnyAdmin(principal)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(Map.of("message", "Access denied. Only logged-in admins can send test mail."));
		}

		UserCommConfig cfg = mergeSmtpForTest(smtpMergeSource);

		try {
			smtpTestService.sendTest(cfg, recipient, subject, staticOtp);
			return ResponseEntity.ok(
					Map.of("message", "Test email sent. Check the recipient inbox (and spam folder)."));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
		} catch (Exception ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = ex.getClass().getSimpleName();
			}
			return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", "SMTP failed: " + m));
		}
	}

	private ResponseEntity<?> sendTwilioTest(
			Principal principal,
			Map<String, Object> twilioMergeSource,
			String recipientPhone,
			String staticOtp) {
		if (!isAnyAdmin(principal)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(Map.of("message", "Access denied. Only logged-in admins can send test SMS."));
		}

		UserCommConfig cfg = mergeTwilioForTest(twilioMergeSource);

		try {
			String sid = twilioTestService.sendTest(cfg, recipientPhone, staticOtp);
			String msg = "Twilio accepted the SMS. Message SID: " + sid + ". ";
			msg += "If it does not arrive, open Twilio Console → Monitor → Logs for delivery status.";
			msg += " Trial accounts: the destination number must be verified in Twilio.";
			return ResponseEntity.ok(Map.of("message", msg));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
		} catch (Exception ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = ex.getClass().getSimpleName();
			}
			return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", "Twilio failed: " + m));
		}
	}

	private UserCommConfig mergeTwilioForTest(Map<String, Object> form) {
		UserCommConfig existing = repo.findById(1L).orElseGet(UserCommConfig::new);

		if (form == null || form.isEmpty()) {
			return copyTwilioOnly(existing);
		}

		String token = asTrimmed(form.get("USER_TWILIO_AUTH_TOKEN"));
		if (MASK.equals(token)) {
			token = existing.getUserTwilioAuthToken() == null ? "" : existing.getUserTwilioAuthToken();
		}

		UserCommConfig merged = new UserCommConfig();
		merged.setId(1L);
		merged.setUserTwilioEnabled(firstNonBlank(asTrimmed(form.get("USER_TWILIO_ENABLED")), nzTwilioEnabled(existing.getUserTwilioEnabled())));
		merged.setUserTwilioAccountSid(
				firstNonBlank(asTrimmed(form.get("USER_TWILIO_ACCOUNT_SID")), existing.getUserTwilioAccountSid()));
		merged.setUserTwilioAuthToken(firstNonBlank(token, existing.getUserTwilioAuthToken()));
		merged.setUserTwilioFromNumber(
				firstNonBlank(asTrimmed(form.get("USER_TWILIO_FROM_NUMBER")), existing.getUserTwilioFromNumber()));
		merged.setUserTwilioDefaultCountryCode(firstNonBlank(
				asTrimmed(form.get("USER_TWILIO_DEFAULT_COUNTRY_CODE")),
				existing.getUserTwilioDefaultCountryCode() == null ? "+91" : existing.getUserTwilioDefaultCountryCode()));

		return merged;
	}

	private static UserCommConfig copyTwilioOnly(UserCommConfig src) {
		UserCommConfig m = new UserCommConfig();
		m.setId(1L);
		m.setUserTwilioEnabled(src.getUserTwilioEnabled());
		m.setUserTwilioAccountSid(src.getUserTwilioAccountSid());
		m.setUserTwilioAuthToken(src.getUserTwilioAuthToken());
		m.setUserTwilioFromNumber(src.getUserTwilioFromNumber());
		m.setUserTwilioDefaultCountryCode(
				src.getUserTwilioDefaultCountryCode() == null ? "+91" : src.getUserTwilioDefaultCountryCode());
		return m;
	}

	private static String nzTwilioEnabled(String v) {
		return v == null || v.isBlank() ? "false" : v;
	}

	private UserCommConfig mergeSmtpForTest(Map<String, Object> smtpForm) {
		UserCommConfig existing = repo.findById(1L).orElseGet(UserCommConfig::new);

		if (smtpForm == null || smtpForm.isEmpty()) {
			return existing;
		}

		String mailHost = asTrimmed(smtpForm.get("USER_MAIL_HOST"));
		String mailPort = asTrimmed(smtpForm.get("USER_MAIL_PORT"));
		String mailUsername = asTrimmed(smtpForm.get("USER_MAIL_USERNAME"));
		String mailPassword = asTrimmed(smtpForm.get("USER_MAIL_PASSWORD"));
		String mailAuth = asTrimmed(smtpForm.get("USER_MAIL_SMTP_AUTH"));
		String mailStarttls = asTrimmed(smtpForm.get("USER_MAIL_SMTP_STARTTLS"));

		if (MASK.equals(mailPassword)) {
			mailPassword = existing.getUserMailPassword() == null ? "" : existing.getUserMailPassword();
		}

		UserCommConfig merged = new UserCommConfig();
		merged.setId(1L);
		merged.setUserMailHost(firstNonBlank(mailHost, existing.getUserMailHost()));
		merged.setUserMailPort(firstNonBlank(mailPort, existing.getUserMailPort()));
		merged.setUserMailUsername(firstNonBlank(mailUsername, existing.getUserMailUsername()));
		merged.setUserMailPassword(firstNonBlank(mailPassword, existing.getUserMailPassword()));
		merged.setUserMailSmtpAuth(firstNonBlank(mailAuth, nzAuth(existing.getUserMailSmtpAuth())));
		merged.setUserMailSmtpStarttls(firstNonBlank(mailStarttls, nzStartTls(existing.getUserMailSmtpStarttls())));

		return merged;
	}

	private static String nzAuth(String v) {
		return v == null || v.isBlank() ? "true" : v;
	}

	private static String nzStartTls(String v) {
		return v == null || v.isBlank() ? "true" : v;
	}

	private static String firstNonBlank(String preferred, String fallback) {
		if (preferred != null && !preferred.isBlank()) {
			return preferred;
		}
		return fallback == null ? "" : fallback;
	}

	private boolean isAnyAdmin(Principal principal) {
		if (principal == null || principal.getName() == null) return false;
		Admins loggedInAdmin = adminRepository.findByEmail(principal.getName()).orElse(null);
		return loggedInAdmin != null;
	}

	private static String asTrimmed(Object v) {
		if (v == null) return "";
		String s = String.valueOf(v);
		return s == null ? "" : s.trim();
	}

	private static String asText(Object v) {
		if (v == null) return "";
		String s = String.valueOf(v);
		if (s == null) return "";
		// keep newlines; only trim outer whitespace so pasting multi-line instructions stays intact
		return s.trim();
	}
}

