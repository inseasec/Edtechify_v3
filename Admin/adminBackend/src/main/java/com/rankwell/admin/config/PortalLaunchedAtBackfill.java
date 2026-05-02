package com.rankwell.admin.config;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.rankwell.admin.entity.EdukifyClient;
import com.rankwell.admin.repository.EdukifyClientRepository;
import com.rankwell.admin.repository.UserRepository;

/**
 * Ports created before portal_launched_at existed have a null anchor, so Live Since cannot be computed.
 * Backfill from the user account created-at when possible, otherwise {@link Instant#now()}.
 */
@Component
@Order(200)
public class PortalLaunchedAtBackfill implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(PortalLaunchedAtBackfill.class);

	private final EdukifyClientRepository clientRepo;
	private final UserRepository userRepo;

	public PortalLaunchedAtBackfill(EdukifyClientRepository clientRepo, UserRepository userRepo) {
		this.clientRepo = clientRepo;
		this.userRepo = userRepo;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		List<EdukifyClient> missing = clientRepo.findByPortalLaunchedAtIsNull();
		if (missing.isEmpty()) {
			return;
		}
		int patched = 0;
		for (EdukifyClient c : missing) {
			Instant anchor = userRepo.findById(c.getUserId())
					.map(u -> u.getCreatedAt())
					.filter(Objects::nonNull)
					.orElse(Instant.now());
			c.setPortalLaunchedAt(anchor);
			patched++;
		}
		clientRepo.saveAll(missing);
		log.info("Backfilled portal_launched_at for {} Edukify client row(s)", patched);
	}
}
