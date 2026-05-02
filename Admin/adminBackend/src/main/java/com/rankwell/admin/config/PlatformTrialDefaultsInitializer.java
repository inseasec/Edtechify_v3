package com.rankwell.admin.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.rankwell.admin.entity.PlatformTrialDefaults;
import com.rankwell.admin.repository.PlatformTrialDefaultsRepository;

@Component
public class PlatformTrialDefaultsInitializer {

	private final PlatformTrialDefaultsRepository repository;

	public PlatformTrialDefaultsInitializer(PlatformTrialDefaultsRepository repository) {
		this.repository = repository;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void seedDefaults() {
		if (repository.findById(1L).isEmpty()) {
			PlatformTrialDefaults d = new PlatformTrialDefaults();
			d.setId(1L);
			d.setTrialDurationDays(14);
			d.setTrialStorageMb(512);
			repository.save(d);
		}
	}
}
