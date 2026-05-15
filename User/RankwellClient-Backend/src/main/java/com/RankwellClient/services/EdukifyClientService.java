package com.RankwellClient.services;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.RankwellClient.dto.LaunchPortalRequest;
import com.RankwellClient.dto.PortalLaunchResponse;
import com.RankwellClient.dto.UpdatePortalRequest;
import com.RankwellClient.entity.EdukifyClient;
import com.RankwellClient.entity.PlatformTrialDefaults;
import com.RankwellClient.entity.Users;
import com.RankwellClient.repository.EdukifyClientRepository;
import com.RankwellClient.repository.PlatformTrialDefaultsRepository;
import com.RankwellClient.repository.UserRepository;

@Service
public class EdukifyClientService {

	private static final ZoneId TRIAL_ZONE = ZoneId.systemDefault();

	private static final Set<String> RESERVED = Set.of(
			"www", "admin", "api", "mail", "ftp", "app", "cdn", "static", "support",
			"help", "blog", "status", "localhost", "test", "staging", "dev");

	private final EdukifyClientRepository eduClientRepository;
	private final UserRepository userRepository;
	private final LaunchGateService launchGateService;
	private final PlatformTrialDefaultsRepository trialDefaultsRepository;

	@Value("${EDUKIFY_PORTAL_BASE_DOMAIN:edukify.com}")
	private String portalBaseDomain;

	public EdukifyClientService(
			EdukifyClientRepository eduClientRepository,
			UserRepository userRepository,
			LaunchGateService launchGateService,
			PlatformTrialDefaultsRepository trialDefaultsRepository) {
		this.eduClientRepository = eduClientRepository;
		this.userRepository = userRepository;
		this.launchGateService = launchGateService;
		this.trialDefaultsRepository = trialDefaultsRepository;
	}

	public static String slugifyCompanyName(String companyName) {
		if (companyName == null || companyName.isBlank()) {
			return "portal";
		}
		String s = companyName.toLowerCase(Locale.ROOT).trim()
				.replaceAll("[^a-z0-9]+", "-")
				.replaceAll("^-+|-+$", "");
		if (s.isEmpty()) {
			return "portal";
		}
		if (s.length() > 63) {
			s = s.substring(0, 63).replaceAll("-+$", "");
		}
		return s;
	}

	public String normalizeSubdomain(String raw) {
		if (raw == null || raw.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subdomain is required");
		}
		String s = raw.toLowerCase(Locale.ROOT).trim()
				.replaceAll("\\.edukify\\.com\\s*$", "")
				.replaceAll("^https?://", "")
				.replaceAll("/.*$", "");
		s = s.replaceAll("[^a-z0-9-]", "");
		s = s.replaceAll("^-+|-+$", "");
		if (s.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid subdomain");
		}
		if (s.length() > 63) {
			s = s.substring(0, 63).replaceAll("-+$", "");
		}
		if (!s.matches("[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Subdomain must be 1–63 characters: letters, numbers, hyphens");
		}
		if (RESERVED.contains(s)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "This subdomain is reserved");
		}
		return s;
	}

	public boolean isSubdomainAvailable(String subdomain) {
		return tryNormalizeSubdomain(subdomain)
				.map(candidate -> !eduClientRepository.existsBySubdomain(candidate))
				.orElse(false);
	}

	/** Normalizes only; returns empty if invalid or reserved. Does not throw. */
	public Optional<String> tryNormalizeSubdomain(String raw) {
		if (raw == null || raw.isBlank()) {
			return Optional.empty();
		}
		String s = raw.toLowerCase(Locale.ROOT).trim()
				.replaceAll("\\.edukify\\.com\\s*$", "")
				.replaceAll("^https?://", "")
				.replaceAll("/.*$", "");
		s = s.replaceAll("[^a-z0-9-]", "");
		s = s.replaceAll("^-+|-+$", "");
		if (s.isEmpty() || s.length() > 63) {
			return Optional.empty();
		}
		if (!s.matches("[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?")) {
			return Optional.empty();
		}
		if (RESERVED.contains(s)) {
			return Optional.empty();
		}
		return Optional.of(s);
	}

	public boolean existsBySubdomain(String normalizedSubdomain) {
		return eduClientRepository.existsBySubdomain(normalizedSubdomain);
	}

	public Optional<PortalLaunchResponse> findForUser(Long userId) {
		return eduClientRepository.findByUserId(userId).map(this::toResponse);
	}

	public PortalLaunchResponse toResponse(EdukifyClient c) {
		PortalLaunchResponse r = new PortalLaunchResponse();
		r.setId(c.getId());
		r.setContactPersonName(c.getContactPersonName());
		r.setCompanyName(c.getCompanyName());
		r.setRoleInCompany(c.getRoleInCompany());
		r.setAddress(c.getAddress());
		r.setPhone(c.getPhone());
		r.setEmail(c.getEmail());
		r.setSubdomain(c.getSubdomain());
		r.setSubscription(c.getSubscription());
		Long usedBytes = c.getStorageUsedBytes() != null ? c.getStorageUsedBytes() : 0L;
		r.setStorageUsedBytes(usedBytes);

		String sub = c.getSubscription() == null ? "" : c.getSubscription().trim();
		boolean trialLike = isTrialPlanForLabel(sub);

		Integer limitDays = c.getTrialLimitDays();
		Integer limitMb = c.getTrialLimitStorageMb();

		LocalDate effectiveEndInclusive = null;

		if (trialLike) {
			int effectiveDays = (limitDays != null && limitDays > 0) ? limitDays : 14;
			int effectiveMb = (limitMb != null && limitMb > 0) ? limitMb : 512;
			r.setStorageAllocatedMb(effectiveMb);
			if (c.getTrialExpiresOn() != null) {
				effectiveEndInclusive = c.getTrialExpiresOn();
				r.setTrialExpiresOn(effectiveEndInclusive.format(DateTimeFormatter.ISO_LOCAL_DATE));
			} else {
				Instant launched = c.getPortalLaunchedAt();
				if (launched != null && effectiveDays >= 1) {
					LocalDate anchor = launched.atZone(TRIAL_ZONE).toLocalDate();
					effectiveEndInclusive = anchor.plusDays((long) effectiveDays - 1);
					r.setTrialExpiresOn(effectiveEndInclusive.format(DateTimeFormatter.ISO_LOCAL_DATE));
				} else {
					r.setTrialExpiresOn(null);
				}
			}
		} else {
			// For subscriptions we still show expiry if present (same DB column used in admin grid).
			effectiveEndInclusive = c.getTrialExpiresOn();
			if (effectiveEndInclusive != null) {
				r.setTrialExpiresOn(effectiveEndInclusive.format(DateTimeFormatter.ISO_LOCAL_DATE));
			} else {
				r.setTrialExpiresOn(null);
			}
			r.setStorageAllocatedMb(limitMb != null && limitMb > 0 ? limitMb : null);
		}

		r.setPlanStatus(computePlanStatusLabel(sub, trialLike, effectiveEndInclusive));

		String pas = c.getPortalAccessStatus();
		if (pas != null) {
			pas = pas.trim();
			if (pas.isEmpty()) {
				pas = null;
			}
		}
		// Expose DB value as-is (null/blank = omit/null in JSON). Do not coerce to YES — that hid admin "off".
		r.setPortalAccessStatus(pas);

		String host = c.getSubdomain() + "." + portalBaseDomain;
		r.setSiteUrl("https://" + host + "/");
		r.setAdminUrl("https://" + host + "/admin");
		return r;
	}

	/** Same trial detection as the admin subscription grid ({@code AdminStudents.jsx} {@code isTrialPlanRow}). */
	private static boolean isTrialPlanForLabel(String subscriptionTrimmed) {
		if (subscriptionTrimmed == null || subscriptionTrimmed.isEmpty()) {
			return true;
		}
		String s = subscriptionTrimmed.toLowerCase(Locale.ROOT);
		return "trial".equals(s) || s.startsWith("trial_") || s.startsWith("trial ") || s.startsWith("trial-");
	}

	/** Same labels as the admin Plan column for a launched portal. */
	private static String computePlanStatusLabel(String subscriptionRaw, boolean trialLike, LocalDate endInclusive) {
		LocalDate today = LocalDate.now(TRIAL_ZONE);
		boolean expiredByDate = endInclusive != null && today.isAfter(endInclusive);
		if (expiredByDate) {
			return trialLike ? "Trial_expired" : "subscription_expired";
		}
		if (trialLike) {
			return "Trial";
		}
		if (subscriptionRaw == null || subscriptionRaw.isBlank()) {
			return "Subscription";
		}
		return subscriptionRaw;
	}

	public PortalLaunchResponse launch(Long userId, LaunchPortalRequest req) {
		if (eduClientRepository.findByUserId(userId).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already launched your portal");
		}
		String subdomain = normalizeSubdomain(req.getSubdomain());
		if (eduClientRepository.existsBySubdomain(subdomain)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "This subdomain is already taken");
		}
		if (req.getContactPersonName() == null || req.getContactPersonName().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact name is required");
		}
		if (req.getCompanyName() == null || req.getCompanyName().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company name is required");
		}
		if (req.getRoleInCompany() == null || req.getRoleInCompany().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role in company is required");
		}
		if (req.getAddress() == null || req.getAddress().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address is required");
		}
		if (req.getEmail() == null || req.getEmail().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}
		if (req.getPhone() == null || req.getPhone().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone is required");
		}
		if (launchGateService.isLaunchGateActive()
				&& !launchGateService.matchesSubmittedCode(req.getLaunchCode())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Incorrect launch code.");
		}

		// One-time fill: copy missing login identifiers from launch, but NEVER overwrite signup identifiers.
		Users u = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
		String reqEmail = req.getEmail().trim().toLowerCase(Locale.ROOT);
		String reqPhone = req.getPhone().trim();

		boolean changed = false;
		if ((u.getEmail() == null || u.getEmail().isBlank())) {
			// Only set if not already used by another account.
			if (userRepository.findByEmail(reqEmail).isEmpty()) {
				u.setEmail(reqEmail);
				changed = true;
			}
		}
		if ((u.getMobileNo() == null || u.getMobileNo().isBlank())) {
			if (userRepository.findByMobileNo(reqPhone).isEmpty()) {
				u.setMobileNo(reqPhone);
				changed = true;
			}
		}
		if (changed) {
			userRepository.save(u);
		}

		EdukifyClient c = new EdukifyClient();
		c.setUserId(userId);
		c.setContactPersonName(req.getContactPersonName().trim());
		c.setCompanyName(req.getCompanyName().trim());
		c.setRoleInCompany(req.getRoleInCompany().trim());
		c.setAddress(req.getAddress().trim());
		c.setPhone(reqPhone);
		c.setEmail(reqEmail);
		c.setSubdomain(subdomain);
		c.setSubscription("Trial");
		c.setPortalLaunchedAt(Instant.now());
		applyPlatformTrialDefaults(c, u, loadPlatformDefaults());

		EdukifyClient saved = eduClientRepository.save(c);
		return toResponse(saved);
	}

	public PortalLaunchResponse updateForUser(Long userId, UpdatePortalRequest req) {
		EdukifyClient c = eduClientRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No company profile yet"));

		String contact = req.getContactPersonName() != null ? req.getContactPersonName().trim() : "";
		String role = req.getRoleInCompany() != null ? req.getRoleInCompany().trim() : "";
		String address = req.getAddress() != null ? req.getAddress().trim() : "";
		String phone = req.getPhone() != null ? req.getPhone().trim() : "";
		String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase(Locale.ROOT) : "";

		if (contact.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact person is required");
		if (role.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role in company is required");
		if (address.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address is required");
		if (phone.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone is required");
		if (email.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");

		c.setContactPersonName(contact);
		// Company name is immutable after launch.
		c.setRoleInCompany(role);
		c.setAddress(address);
		c.setPhone(phone);
		c.setEmail(email);

		EdukifyClient saved = eduClientRepository.save(c);
		return toResponse(saved);
	}

	private PlatformTrialDefaults loadPlatformDefaults() {
		return trialDefaultsRepository.findById(1L).orElseGet(() -> {
			PlatformTrialDefaults d = new PlatformTrialDefaults();
			d.setId(1L);
			d.setTrialDurationDays(14);
			d.setTrialStorageMb(512);
			return d;
		});
	}

	/** Persist platform trial caps and inclusive last day — same rules as admin {@code refreshTrialExpiresOn}. */
	private static void applyPlatformTrialDefaults(EdukifyClient client, Users owner, PlatformTrialDefaults def) {
		int days = Math.max(1, def.getTrialDurationDays());
		int mb = Math.max(1, def.getTrialStorageMb());
		client.setTrialLimitDays(days);
		client.setTrialLimitStorageMb(mb);
		Instant anchorInstant = client.getPortalLaunchedAt();
		if (anchorInstant == null) {
			anchorInstant = owner.getCreatedAt();
		}
		if (anchorInstant == null) {
			return;
		}
		LocalDate anchor = anchorInstant.atZone(TRIAL_ZONE).toLocalDate();
		client.setTrialExpiresOn(anchor.plusDays(days - 1L));
	}

	public static Long userIdFromAuth(Authentication auth) {
		if (auth == null || !(auth.getPrincipal() instanceof User)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}
		User u = (User) auth.getPrincipal();
		try {
			return Long.parseLong(u.getUsername());
		} catch (NumberFormatException e) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}
	}
}
