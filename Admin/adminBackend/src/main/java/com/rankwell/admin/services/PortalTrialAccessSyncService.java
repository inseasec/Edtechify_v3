package com.rankwell.admin.services;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rankwell.admin.entity.EdukifyClient;
import com.rankwell.admin.entity.PlatformTrialDefaults;
import com.rankwell.admin.entity.Users;
import com.rankwell.admin.repository.EdukifyClientRepository;
import com.rankwell.admin.repository.PlatformTrialDefaultsRepository;
import com.rankwell.admin.repository.UserRepository;

/**
 * Backfills trial limit columns and {@code clients.trial_expires_on} for Trial clients when missing or
 * out of sync (e.g. launch used a hardcoded 14-day expiry). {@code clients.portal_live_status} is
 * <strong>not</strong> derived from trial or expiry; admins set it explicitly.
 */
@Service
public class PortalTrialAccessSyncService {

	private static final ZoneId ZONE = ZoneId.systemDefault();

	/** Persisted semantics for {@code clients.portal_live_status}: {@code YES} (live) / {@code NO} (not live). */
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
			reconcileTrialClient(c, def);
		}
	}

	private static boolean isTrialSubscription(EdukifyClient c) {
		String plan = c.getSubscription();
		return plan == null || plan.isBlank() || "trial".equalsIgnoreCase(plan.trim());
	}

	private void reconcileTrialClient(EdukifyClient c, PlatformTrialDefaults def) {
		if (!isTrialSubscription(c)) {
			return;
		}
		var ownerOpt = userRepository.findById(c.getUserId());
		if (ownerOpt.isEmpty()) {
			return;
		}
		Users owner = ownerOpt.get();
		boolean changed = false;

		if (c.getTrialLimitDays() == null) {
			c.setTrialLimitDays(Math.max(1, def.getTrialDurationDays()));
			changed = true;
		}
		if (c.getTrialLimitStorageMb() == null) {
			c.setTrialLimitStorageMb(Math.max(1, def.getTrialStorageMb()));
			changed = true;
		}

		LocalDate expected = computeTrialExpiresOn(c, owner);
		if (expected == null) {
			if (changed) {
				clientRepository.save(c);
			}
			return;
		}

		if (c.getTrialExpiresOn() == null || changed || !expected.equals(c.getTrialExpiresOn())) {
			c.setTrialExpiresOn(expected);
			changed = true;
		}

		if (changed) {
			clientRepository.save(c);
		}
	}

	private LocalDate computeTrialExpiresOn(EdukifyClient c, Users owner) {
		int trialDays = Math.max(1, c.getTrialLimitDays() != null ? c.getTrialLimitDays() : 14);
		Instant anchorInstant = c.getPortalLaunchedAt();
		if (anchorInstant == null) {
			anchorInstant = owner.getCreatedAt();
		}
		if (anchorInstant == null) {
			return null;
		}
		LocalDate anchor = anchorInstant.atZone(ZONE).toLocalDate();
		return anchor.plusDays(trialDays - 1L);
	}
}
