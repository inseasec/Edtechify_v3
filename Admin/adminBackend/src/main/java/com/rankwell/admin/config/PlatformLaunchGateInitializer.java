package com.rankwell.admin.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.rankwell.admin.entity.PlatformLaunchGate;
import com.rankwell.admin.repository.PlatformLaunchGateRepository;

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
