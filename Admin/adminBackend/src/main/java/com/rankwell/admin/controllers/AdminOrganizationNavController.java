package com.rankwell.admin.controllers;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rankwell.admin.dto.OrganizationDetailDto;
import com.rankwell.admin.entity.Admins;
import com.rankwell.admin.repository.AdminRepository;
import com.rankwell.admin.services.OrganizationService;

/**
 * Nav visibility updates under {@code /admin/**} so gateways that only forward admin paths pass JWT
 * (same pattern as {@code /admin/user-comm-config}).
 */
@RestController
@RequestMapping("/admin/organization")
public class AdminOrganizationNavController {

	private final OrganizationService organizationService;
	private final AdminRepository adminRepository;

	public AdminOrganizationNavController(OrganizationService organizationService, AdminRepository adminRepository) {
		this.organizationService = organizationService;
		this.adminRepository = adminRepository;
	}

	/**
	 * Body: <code>{ "navbarHiddenPaths": ["/gallery"] }</code>
	 */
	@PostMapping("/navbar-hidden-paths")
	public ResponseEntity<?> saveNavbarHiddenPaths(@RequestBody Map<String, Object> body, Principal principal) {
		if (!isAnyAdmin(principal)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(Map.of("message", "Access denied. Only logged-in admins can update page visibility."));
		}
		@SuppressWarnings("unchecked")
		List<String> paths = body == null ? null : (List<String>) body.get("navbarHiddenPaths");
		if (paths == null) {
			paths = List.of();
		}
		OrganizationDetailDto dto = organizationService.updateNavbarHiddenPaths(paths);
		return ResponseEntity.ok(dto);
	}

	private boolean isAnyAdmin(Principal principal) {
		if (principal == null || principal.getName() == null) {
			return false;
		}
		Admins loggedInAdmin = adminRepository.findByEmail(principal.getName()).orElse(null);
		return loggedInAdmin != null;
	}
}
