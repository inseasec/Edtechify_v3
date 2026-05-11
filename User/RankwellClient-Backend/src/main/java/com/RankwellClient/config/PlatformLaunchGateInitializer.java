package com.RankwellClient.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.RankwellClient.entity.PlatformLaunchGate;
import com.RankwellClient.repository.PlatformLaunchGateRepository;

@Component
public class PlatformLaunchGateInitializer {

	private final PlatformLaunchGateRepository repository;

	public PlatformLaunchGateInitializer(PlatformLaunchGateRepository repository) {
		this.repository = repository;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void seedDefaults() {
		if (repository.findById(1L).isEmpty()) {
			PlatformLaunchGate g = new PlatformLaunchGate();
			g.setId(1L);
			g.setRequireCode(false);
			g.setSecretCode(null);
			repository.save(g);
		}
	}
}
