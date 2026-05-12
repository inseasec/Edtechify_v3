package com.RankwellClient.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class MobileNoUtil {
	private static final String[][] KNOWN_COUNTRY_CODES = {
			{ "+994", "994" },
			{ "+971", "971" },
			{ "+880", "880" },
			{ "+852", "852" },
			{ "+421", "421" },
			{ "+420", "420" },
			{ "+389", "389" },
			{ "+387", "387" },
			{ "+386", "386" },
			{ "+385", "385" },
			{ "+380", "380" },
			{ "+372", "372" },
			{ "+371", "371" },
			{ "+370", "370" },
			{ "+359", "359" },
			{ "+358", "358" },
			{ "+357", "357" },
			{ "+356", "356" },
			{ "+355", "355" },
			{ "+354", "354" },
			{ "+353", "353" },
			{ "+352", "352" },
			{ "+351", "351" },
			{ "+263", "263" },
			{ "+260", "260" },
			{ "+256", "256" },
			{ "+255", "255" },
			{ "+254", "254" },
			{ "+234", "234" },
			{ "+221", "221" },
			{ "+220", "220" },
			{ "+218", "218" },
			{ "+216", "216" },
			{ "+213", "213" },
			{ "+212", "212" },
			{ "+98", "98" },
			{ "+95", "95" },
			{ "+94", "94" },
			{ "+93", "93" },
			{ "+92", "92" },
			{ "+91", "91" },
			{ "+90", "90" },
			{ "+86", "86" },
			{ "+84", "84" },
			{ "+82", "82" },
			{ "+81", "81" },
			{ "+66", "66" },
			{ "+65", "65" },
			{ "+64", "64" },
			{ "+63", "63" },
			{ "+62", "62" },
			{ "+61", "61" },
			{ "+60", "60" },
			{ "+58", "58" },
			{ "+57", "57" },
			{ "+56", "56" },
			{ "+55", "55" },
			{ "+54", "54" },
			{ "+53", "53" },
			{ "+52", "52" },
			{ "+51", "51" },
			{ "+49", "49" },
			{ "+48", "48" },
			{ "+47", "47" },
			{ "+46", "46" },
			{ "+45", "45" },
			{ "+44", "44" },
			{ "+43", "43" },
			{ "+41", "41" },
			{ "+40", "40" },
			{ "+39", "39" },
			{ "+36", "36" },
			{ "+34", "34" },
			{ "+33", "33" },
			{ "+32", "32" },
			{ "+31", "31" },
			{ "+30", "30" },
			{ "+27", "27" },
			{ "+20", "20" },
			{ "+7", "7" },
			{ "+1", "1" },
	};

	private MobileNoUtil() {
	}

	public static String normalizeCompact(String raw, String defaultCountryCode) {
		if (raw == null || raw.isBlank()) {
			throw new IllegalArgumentException("Mobile number is required");
		}
		String trimmed = raw.trim();
		if (trimmed.startsWith("+")) {
			String compact = trimmed.replaceAll("[^\\d+]", "");
			if (!compact.matches("^\\+\\d{10,15}$")) {
				throw new IllegalArgumentException("Invalid mobile number");
			}
			return compact;
		}

		String digits = trimmed.replaceAll("\\D", "");
		if (digits.length() < 6) {
			throw new IllegalArgumentException("Invalid mobile number");
		}
		if (digits.length() == 10) {
			return countryCode(defaultCountryCode) + digits;
		}

		String matched = matchKnownCountryCode(digits);
		if (matched != null) {
			return matched;
		}

		if (digits.length() >= 10 && digits.length() <= 15) {
			return "+" + digits;
		}
		throw new IllegalArgumentException("Invalid mobile number");
	}

	public static List<String> lookupVariants(String raw, String defaultCountryCode) {
		Set<String> variants = new LinkedHashSet<>();
		if (raw == null || raw.isBlank()) {
			return List.of();
		}
		String trimmed = raw.trim();
		variants.add(trimmed);

		try {
			variants.add(normalizeCompact(trimmed, defaultCountryCode));
		} catch (IllegalArgumentException ignored) {
			// ignore
		}

		String digits = trimmed.replaceAll("\\D", "");
		if (digits.length() >= 10) {
			variants.add(digits.substring(digits.length() - 10));
		}
		if (!digits.isEmpty()) {
			variants.add(digits);
		}

		return new ArrayList<>(variants);
	}

	private static String matchKnownCountryCode(String digits) {
		for (String[] row : KNOWN_COUNTRY_CODES) {
			String ccDigits = row[1];
			if (digits.startsWith(ccDigits) && digits.length() > ccDigits.length() + 5) {
				return row[0] + digits.substring(ccDigits.length());
			}
		}
		return null;
	}

	private static String countryCode(String defaultCountryCode) {
		String cc = defaultCountryCode == null || defaultCountryCode.isBlank() ? "+91" : defaultCountryCode.trim();
		if (!cc.startsWith("+")) {
			cc = "+" + cc;
		}
		return cc;
	}
}
