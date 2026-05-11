package com.rankwell.admin.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rankwell.admin.dto.LaunchGateAdminResponse;
import com.rankwell.admin.dto.LaunchGateAdminUpdateRequest;
import com.rankwell.admin.entity.PlatformLaunchGate;
import com.rankwell.admin.repository.PlatformLaunchGateRepository;

@Service
public class PlatformLaunchGateService {

	private final PlatformLaunchGateRepository repository;

	public PlatformLaunchGateService(PlatformLaunchGateRepository repository) {
		this.repository = repository;
	}

	public LaunchGateAdminResponse getForAdmin() {
		PlatformLaunchGate g = repository.findById(1L).orElseGet(this::defaults);
		boolean has = g.getSecretCode() != null && !g.getSecretCode().isBlank();
		String codeShown = has ? g.getSecretCode().trim() : "";
		return new LaunchGateAdminResponse(g.isRequireCode(), has, codeShown);
	}

	@Transactional
	public LaunchGateAdminResponse update(LaunchGateAdminUpdateRequest dto) {
		if (dto == null) {
			throw new IllegalArgumentException("Request body required");
		}
		PlatformLaunchGate g = repository.findById(1L).orElseGet(() -> {
			PlatformLaunchGate x = defaults();
			return repository.save(x);
		});
		boolean want = dto.isRequireLaunchCode();
		String newSecret = dto.getLaunchCode() == null ? "" : dto.getLaunchCode().trim();
		boolean hasExisting = g.getSecretCode() != null && !g.getSecretCode().isBlank();

		if (want && !hasExisting && newSecret.isEmpty()) {
			throw new IllegalArgumentException("Set a launch code before requiring it, or enter a new code below.");
		}
		if (!newSecret.isEmpty()) {
			g.setSecretCode(newSecret);
		}
		g.setRequireCode(want);
		repository.save(g);
		return getForAdmin();
	}

	private PlatformLaunchGate defaults() {
		PlatformLaunchGate g = new PlatformLaunchGate();
		g.setId(1L);
		g.setRequireCode(false);
		g.setSecretCode(null);
		return g;
	}

	/** Effective gate: require flag on and a non-blank secret on file. */
	public boolean isLaunchGateActive() {
		PlatformLaunchGate g = repository.findById(1L).orElse(null);
		if (g == null || !g.isRequireCode()) {
			return false;
		}
		return g.getSecretCode() != null && !g.getSecretCode().isBlank();
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
