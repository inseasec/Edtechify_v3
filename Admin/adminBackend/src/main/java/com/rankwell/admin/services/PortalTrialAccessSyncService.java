package com.rankwell.admin.services;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
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
 * Writes {@code clients.portal_access_status} from trial duration vs <strong>portal launch</strong>
 * ({@code clients.portal_launched_at}), so signup-before-launch does not consume trial time.
 * If launch time is missing, falls back to {@code Users.created_at} (same idea as legacy backfill).
 * Storage quota is intentionally out of scope for now.
 */
@Service
public class PortalTrialAccessSyncService {

	private static final ZoneId ZONE = ZoneId.systemDefault();

	public static final String STATUS_ACTIVE = "ACTIVE";
	public static final String STATUS_TRIAL_EXPIRED = "TRIAL_EXPIRED";

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

		for (EdukifyClient c : clientRepository.findAll()) {
			applyDesiredStatusForClient(c, def);
		}
	}

	void applyDesiredStatusForClient(EdukifyClient c, PlatformTrialDefaults def) {
		String desired;

		String plan = c.getSubscription();
		if (plan != null && "trial".equalsIgnoreCase(plan.trim())) {
			var ownerOpt = userRepository.findById(c.getUserId());
			if (ownerOpt.isEmpty()) {
				return;
			}
			Users owner = ownerOpt.get();

			int configured = c.getTrialLimitDays() != null ? c.getTrialLimitDays() : def.getTrialDurationDays();
			int trialDays = Math.max(1, configured);

			Instant launch = c.getPortalLaunchedAt();
			Instant anchorInstant = launch != null ? launch : owner.getCreatedAt();
			LocalDate anchor =
					anchorInstant != null ? anchorInstant.atZone(ZONE).toLocalDate() : LocalDate.now(ZONE);
			long elapsed = ChronoUnit.DAYS.between(anchor, LocalDate.now(ZONE));

			desired = elapsed >= trialDays ? STATUS_TRIAL_EXPIRED : STATUS_ACTIVE;
		} else {
			desired = STATUS_ACTIVE;
		}

		String current = c.getPortalAccessStatus();
		String normalizedCurrent = normalizeStatus(current);

		if (!Objects.equals(desired, normalizedCurrent)) {
			c.setPortalAccessStatus(desired);
			clientRepository.save(c);
		}
	}

	private static String normalizeStatus(String s) {
		if (s == null || s.isBlank()) {
			return STATUS_ACTIVE;
		}
		return s.trim();
	}
}
