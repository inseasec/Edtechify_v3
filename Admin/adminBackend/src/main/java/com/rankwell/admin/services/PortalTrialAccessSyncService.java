package com.rankwell.admin.services;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rankwell.admin.entity.EdukifyClient;
import com.rankwell.admin.entity.PlatformTrialDefaults;
import com.rankwell.admin.entity.Users;
import com.rankwell.admin.repository.EdukifyClientRepository;
import com.rankwell.admin.repository.PlatformTrialDefaultsRepository;
import com.rankwell.admin.repository.UserRepository;

/**
 * Writes {@code clients.portal_live_status} from trial duration vs <strong>portal launch</strong>
 * ({@code clients.portal_launched_at}), so signup-before-launch does not consume trial time.
 * If launch time is missing, falls back to {@code Users.created_at} (same idea as legacy backfill).
 * Storage quota is intentionally out of scope for now.
 */
@Service
public class PortalTrialAccessSyncService {

	private static final ZoneId ZONE = ZoneId.systemDefault();

	public static final String STATUS_ACTIVE = "ACTIVE";
	public static final String STATUS_TRIAL_EXPIRED = "TRIAL_EXPIRED";
	/** New persisted semantics for {@code clients.portal_live_status}: {@code YES} (live) / {@code NO} (not live). */
	public static final String STATUS_YES = "YES";
	public static final String STATUS_NO = "NO";

	private final EdukifyClientRepository clientRepository;
	private final UserRepository userRepository;
	private final PlatformTrialDefaultsRepository trialDefaultsRepository;

	public PortalTrialAccessSyncService(
			EdukifyClientRepository clientRepository,
			UserRepository userRepository,
			PlatformTrialDefaultsRepository trialDefaultsRepository) {
		this.clientRepository = clientRepository;
		this.userRepository = userRepository;
		this.trialDefaultsRepository = trialDefaultsRepository;
	}

	@Transactional
	public void reconcileAllClients() {
		PlatformTrialDefaults def = trialDefaultsRepository.findById(1L)
				.orElseGet(() -> {
					PlatformTrialDefaults d = new PlatformTrialDefaults();
					d.setId(1L);
					d.setTrialDurationDays(14);
					d.setTrialStorageMb(512);
					return d;
				});

		List<EdukifyClient> clients = clientRepository.findAll();
		for (EdukifyClient c : clients) {
			backfillTrialExpiresOnIfAbsent(c, def);
		}
		for (EdukifyClient c : clients) {
			applyDesiredStatusForClient(c, def);
		}
	}

	/** One-time style backfill: rows created before {@code trial_expires_on} existed. */
	private void backfillTrialExpiresOnIfAbsent(EdukifyClient c, PlatformTrialDefaults def) {
		String plan = c.getSubscription();
		if (!(plan != null && "trial".equalsIgnoreCase(plan.trim()))) {
			return;
		}
		if (c.getTrialExpiresOn() != null) {
			return;
		}
		var ownerOpt = userRepository.findById(c.getUserId());
		if (ownerOpt.isEmpty()) {
			return;
		}
		Users owner = ownerOpt.get();
		int configured = c.getTrialLimitDays() != null ? c.getTrialLimitDays() : def.getTrialDurationDays();
		int trialDays = Math.max(1, configured);
		Instant launch = c.getPortalLaunchedAt();
		Instant anchorInstant = launch != null ? launch : owner.getCreatedAt();
		if (anchorInstant == null) {
			return;
		}
		LocalDate anchor = anchorInstant.atZone(ZONE).toLocalDate();
		c.setTrialExpiresOn(anchor.plusDays(trialDays - 1L));
		clientRepository.save(c);
	}

	void applyDesiredStatusForClient(EdukifyClient c, PlatformTrialDefaults def) {
		String desired = null;
		boolean expired = false;

		String plan = c.getSubscription();
		if (plan != null && "trial".equalsIgnoreCase(plan.trim())) {
			var ownerOpt = userRepository.findById(c.getUserId());
			if (ownerOpt.isEmpty()) {
				return;
			}
			Users owner = ownerOpt.get();

			LocalDate today = LocalDate.now(ZONE);
			if (c.getTrialExpiresOn() != null) {
				expired = today.isAfter(c.getTrialExpiresOn());
			} else {
				int configured = c.getTrialLimitDays() != null ? c.getTrialLimitDays() : def.getTrialDurationDays();
				int trialDays = Math.max(1, configured);

				Instant launch = c.getPortalLaunchedAt();
				Instant anchorInstant = launch != null ? launch : owner.getCreatedAt();
				LocalDate anchor =
						anchorInstant != null ? anchorInstant.atZone(ZONE).toLocalDate() : LocalDate.now(ZONE);
				long elapsed = ChronoUnit.DAYS.between(anchor, today);

				expired = elapsed >= trialDays;
			}
		} else {
			// For subscriptions, treat trial_expires_on as the access end date (same UI column).
			LocalDate today = LocalDate.now(ZONE);
			if (c.getTrialExpiresOn() != null) {
				expired = today.isAfter(c.getTrialExpiresOn());
			}
		}

		String current = c.getPortalAccessStatus();
		String normalizedCurrent = normalizeStatus(current);

		if (expired) {
			// Expired always forces NO.
			desired = STATUS_NO;
		} else {
			// Not expired: keep admin override (NO). Default to YES only when blank / legacy ACTIVE.
			if (current == null || current.isBlank() || STATUS_ACTIVE.equalsIgnoreCase(current.trim())) {
				desired = STATUS_YES;
			} else {
				desired = null; // keep current
			}
		}

		if (desired != null && !Objects.equals(desired, normalizedCurrent)) {
			c.setPortalAccessStatus(desired);
			clientRepository.save(c);
		}
	}

	private static String normalizeStatus(String s) {
		if (s == null || s.isBlank()) {
			return STATUS_YES;
		}
		String v = s.trim();
		if (STATUS_ACTIVE.equalsIgnoreCase(v)) return STATUS_YES;
		if (STATUS_TRIAL_EXPIRED.equalsIgnoreCase(v)) return STATUS_NO;
		if ("TRUE".equalsIgnoreCase(v)) return STATUS_YES;
		if ("FALSE".equalsIgnoreCase(v)) return STATUS_NO;
		return v.toUpperCase();
	}
}
