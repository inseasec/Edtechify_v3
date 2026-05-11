package com.RankwellClient.Controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.RankwellClient.dto.LaunchPortalRequest;
import com.RankwellClient.dto.PortalLaunchResponse;
import com.RankwellClient.dto.UpdatePortalRequest;
import com.RankwellClient.services.EdukifyClientService;
import com.RankwellClient.services.LaunchGateService;

@RestController
@RequestMapping("/clients")
public class EdukifyClientController {

	private final EdukifyClientService eduClientService;
	private final LaunchGateService launchGateService;

	public EdukifyClientController(EdukifyClientService eduClientService, LaunchGateService launchGateService) {
		this.eduClientService = eduClientService;
		this.launchGateService = launchGateService;
	}

	@GetMapping("/me")
	public ResponseEntity<PortalLaunchResponse> getMine(Authentication authentication) {
		Long userId = EdukifyClientService.userIdFromAuth(authentication);
		return eduClientService.findForUser(userId)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@GetMapping("/launch-gate")
	public Map<String, Boolean> launchGateStatus(Authentication authentication) {
		EdukifyClientService.userIdFromAuth(authentication);
		return Map.of("launchGateRequired", launchGateService.isLaunchGateActive());
	}

	@PostMapping("/launch-gate/verify")
	public ResponseEntity<?> verifyLaunchGate(Authentication authentication, @RequestBody Map<String, String> body) {
		EdukifyClientService.userIdFromAuth(authentication);
		if (!launchGateService.isLaunchGateActive()) {
			return ResponseEntity.noContent().build();
		}
		String code = body == null ? null : body.get("launchCode");
		if (!launchGateService.matchesSubmittedCode(code)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(Map.of("message", "Incorrect launch code."));
		}
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/launch")
	public ResponseEntity<PortalLaunchResponse> launch(
			Authentication authentication,
			@RequestBody LaunchPortalRequest body) {
		Long userId = EdukifyClientService.userIdFromAuth(authentication);
		return ResponseEntity.ok(eduClientService.launch(userId, body));
	}

	@PutMapping("/me")
	public ResponseEntity<PortalLaunchResponse> updateMine(
			Authentication authentication,
			@RequestBody UpdatePortalRequest body) {
		Long userId = EdukifyClientService.userIdFromAuth(authentication);
		return ResponseEntity.ok(eduClientService.updateForUser(userId, body));
	}

	@GetMapping("/check-subdomain")
	public ResponseEntity<Map<String, Object>> checkSubdomain(
			Authentication authentication,
			@RequestParam("value") String value) {
		EdukifyClientService.userIdFromAuth(authentication);
		return eduClientService.tryNormalizeSubdomain(value)
				.map(norm -> ResponseEntity.ok(Map.<String, Object>of(
						"available", !eduClientService.existsBySubdomain(norm),
						"normalized", norm)))
				.orElse(ResponseEntity.ok(Map.of(
						"available", false,
						"normalized", "",
						"reason", "INVALID_OR_RESERVED")));
	}

	@GetMapping("/suggest-subdomain")
	public ResponseEntity<Map<String, String>> suggest(Authentication authentication,
			@RequestParam(value = "company", required = false) String company) {
		EdukifyClientService.userIdFromAuth(authentication);
		String base = EdukifyClientService.slugifyCompanyName(company);
		String candidate = base;
		int n = 0;
		while (!eduClientService.isSubdomainAvailable(candidate) && n < 50) {
			n++;
			candidate = base + "-" + n;
			if (candidate.length() > 63) {
				candidate = candidate.substring(0, 63).replaceAll("-+$", "");
			}
		}
		return ResponseEntity.ok(Map.of("subdomain", candidate));
	}
}
