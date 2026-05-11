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
 * Backfills {@code clients.trial_expires_on} for legacy trial rows when missing, using portal launch
 * (or {@code Users.created_at}) and configured trial length. {@code clients.portal_live_status} is
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
			backfillTrialExpiresOnIfAbsent(c, def);
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
}
