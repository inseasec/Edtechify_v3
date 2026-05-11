package com.RankwellClient.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.stereotype.Service;

import com.RankwellClient.entity.PlatformLaunchGate;
import com.RankwellClient.repository.PlatformLaunchGateRepository;

@Service
public class LaunchGateService {

	private final PlatformLaunchGateRepository repository;

	public LaunchGateService(PlatformLaunchGateRepository repository) {
		this.repository = repository;
	}

	public boolean isLaunchGateActive() {
		return repository.findById(1L)
				.filter(PlatformLaunchGate::isRequireCode)
				.map(g -> g.getSecretCode() != null && !g.getSecretCode().isBlank())
				.orElse(false);
	}

	public boolean matchesSubmittedCode(String submitted) {
		if (!isLaunchGateActive()) {
			return true;
		}
		if (submitted == null) {
			return false;
		}
		String expected = repository.findById(1L).map(PlatformLaunchGate::getSecretCode).orElse("");
		String a = expected.trim();
		String b = submitted.trim();
		return MessageDigest.isEqual(
				a.getBytes(StandardCharsets.UTF_8),
				b.getBytes(StandardCharsets.UTF_8));
	}
}
