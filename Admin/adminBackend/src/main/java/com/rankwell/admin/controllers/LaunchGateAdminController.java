package com.rankwell.admin.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rankwell.admin.dto.LaunchGateAdminResponse;
import com.rankwell.admin.dto.LaunchGateAdminUpdateRequest;
import com.rankwell.admin.services.PlatformLaunchGateService;

@RestController
@RequestMapping("/clients/launch-gate-settings")
public class LaunchGateAdminController {

	private final PlatformLaunchGateService platformLaunchGateService;

	public LaunchGateAdminController(PlatformLaunchGateService platformLaunchGateService) {
		this.platformLaunchGateService = platformLaunchGateService;
	}

	@GetMapping
	public LaunchGateAdminResponse get() {
		return platformLaunchGateService.getForAdmin();
	}

	@PutMapping
	public ResponseEntity<?> update(@RequestBody LaunchGateAdminUpdateRequest body) {
		try {
			return ResponseEntity.ok(platformLaunchGateService.update(body));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(java.util.Map.of("message", ex.getMessage()));
		} catch (Exception ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = ex.getClass().getSimpleName();
			}
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of("message", m));
		}
	}
}
