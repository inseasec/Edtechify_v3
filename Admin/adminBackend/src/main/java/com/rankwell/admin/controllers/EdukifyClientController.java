package com.rankwell.admin.controllers;

import java.util.List;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rankwell.admin.dto.ClientPortalRowDto;
import com.rankwell.admin.dto.TrialDefaultsDto;
import com.rankwell.admin.dto.TrialLimitsOverrideDto;
import com.rankwell.admin.services.EdukifyClientAdminService;

@RestController
@RequestMapping("/clients")
public class EdukifyClientController {

	private final EdukifyClientAdminService eduClientAdminService;

	public EdukifyClientController(EdukifyClientAdminService eduClientAdminService) {
		this.eduClientAdminService = eduClientAdminService;
	}

	@GetMapping("/portal-rows")
	public List<ClientPortalRowDto> listPortalRows() {
		return eduClientAdminService.listPortalRows();
	}

	@GetMapping("/trial-defaults")
	public TrialDefaultsDto getTrialDefaults() {
		return eduClientAdminService.getTrialDefaults();
	}

	@PutMapping("/trial-defaults")
	public ResponseEntity<?> updateTrialDefaults(@RequestBody TrialDefaultsDto body) {
		try {
			return ResponseEntity.ok(eduClientAdminService.updateTrialDefaults(body));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(java.util.Map.of("message", ex.getMessage()));
		}
	}

	@PutMapping("/user/{userId}/trial-overrides")
	public ResponseEntity<?> updateClientTrialOverrides(@PathVariable Long userId,
			@RequestBody TrialLimitsOverrideDto body) {
		try {
			return ResponseEntity.ok(eduClientAdminService.updateTrialLimitsForUser(userId, body));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
		} catch (java.util.NoSuchElementException ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = "Not found";
			}
			return ResponseEntity.status(404).body(Map.of("message", m));
		} catch (Exception ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = ex.getClass().getSimpleName();
			}
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", m));
		}
	}

	@PutMapping("/user/{userId}/portal-live-status")
	public ResponseEntity<?> updatePortalLiveStatus(@PathVariable Long userId, @RequestBody Map<String, Object> body) {
		try {
			Object raw = body == null ? null : (body.get("portalLiveStatus") != null ? body.get("portalLiveStatus") : body.get("portalAccessStatus"));
			String desired = raw == null ? null : String.valueOf(raw);
			return ResponseEntity.ok(eduClientAdminService.updatePortalLiveStatusForUser(userId, desired));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
		} catch (java.util.NoSuchElementException ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = "Not found";
			}
			return ResponseEntity.status(404).body(Map.of("message", m));
		} catch (Exception ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = ex.getClass().getSimpleName();
			}
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", m));
		}
	}
}
