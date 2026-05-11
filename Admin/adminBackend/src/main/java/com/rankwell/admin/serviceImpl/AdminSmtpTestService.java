package com.rankwell.admin.serviceImpl;

import java.util.Properties;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import com.rankwell.admin.entity.UserCommConfig;

/**
 * Sends a one-off plain-text test mail using SMTP from {@link UserCommConfig}.
 */
@Service
public class AdminSmtpTestService {

	public void sendTest(UserCommConfig cfg, String recipientEmail, String subject, String staticOtp) {
		if (cfg == null) {
			throw new IllegalArgumentException("Mail configuration is missing.");
		}
		if (isBlank(cfg.getUserMailHost()) || isBlank(cfg.getUserMailUsername()) || isBlank(cfg.getUserMailPassword())) {
			throw new IllegalArgumentException(
					"SMTP is incomplete. Set host, username, and password (save or include them in the test request).");
		}
		String to = recipientEmail == null ? "" : recipientEmail.trim().toLowerCase();
		if (!to.matches("^\\S+@\\S+\\.\\S+$")) {
			throw new IllegalArgumentException("Enter a valid recipient email address.");
		}
		String subj = subject == null || subject.isBlank() ? "Edukify SMTP test" : subject.trim();
		String otp = staticOtp == null ? "" : staticOtp.trim();
		if (otp.isEmpty()) {
			throw new IllegalArgumentException("Enter the static OTP text to include in the test email.");
		}

		JavaMailSenderImpl sender = buildMailSender(cfg);
		SimpleMailMessage msg = new SimpleMailMessage();
		msg.setFrom(cfg.getUserMailUsername().trim());
		msg.setTo(to);
		msg.setSubject(subj);
		msg.setText("This is a configuration test from the Edukify admin console.\r\n\r\n"
				+ "Static OTP (as you entered): " + otp + "\r\n\r\n"
				+ "If you received this message, your SMTP settings are delivering mail correctly.");
		sender.send(msg);
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
		boolean starttls = (port == 587) ? true : parseBool(cfg.getUserMailSmtpStarttls());
		props.put("mail.smtp.starttls.enable", String.valueOf(starttls));
		props.put("mail.smtp.starttls.required", String.valueOf(starttls));
		boolean ssl = (port == 465);
		props.put("mail.smtp.ssl.enable", String.valueOf(ssl));
		props.put("mail.smtp.ssl.trust", cfg.getUserMailHost() == null ? "*" : cfg.getUserMailHost().trim());
		props.put("mail.smtp.connectiontimeout", "15000");
		props.put("mail.smtp.timeout", "15000");
		props.put("mail.smtp.writetimeout", "15000");
		props.put("mail.debug", "false");
		sender.setJavaMailProperties(props);
		return sender;
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
