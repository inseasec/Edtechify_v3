package com.rankwell.admin.controllers;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rankwell.admin.services.UnusedAccountDeletionService;
import com.rankwell.admin.services.UserService;

/**
 * Permanent delete for signup-only users (no {@code clients} row). Lives under {@code /admin/**} so
 * reverse proxies that forward admin API traffic to this app (and may route {@code /users/**} elsewhere)
 * behave consistently with {@link AdminOrganizationNavController}.
 */
@RestController
@RequestMapping("/admin/unused-accounts")
public class AdminUnusedAccountsController {

	private final UnusedAccountDeletionService unusedAccountDeletionService;
	private final UserService userService;

	public AdminUnusedAccountsController(
			UnusedAccountDeletionService unusedAccountDeletionService,
			UserService userService) {
		this.unusedAccountDeletionService = unusedAccountDeletionService;
		this.userService = userService;
	}

	@PutMapping("/{userId}/toggle-freeze")
	public String toggleFreeze(@PathVariable Long userId) {
		return userService.FrezeOrUnfrezeUser(userId);
	}

	@DeleteMapping("/{userId}")
	public ResponseEntity<?> deletePermanent(@PathVariable Long userId) {
		try {
			unusedAccountDeletionService.deletePermanentIfNotLaunched(userId);
			return ResponseEntity.ok(Map.of("message", "Account permanently removed."));
		} catch (NoSuchElementException ex) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
		} catch (IllegalStateException ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = "Cannot delete this account.";
			}
			return ResponseEntity.badRequest().body(Map.of("message", m));
		} catch (Exception ex) {
			String m = ex.getMessage();
			if (m == null || m.isBlank()) {
				m = ex.getClass().getSimpleName();
			}
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", m));
		}
	}
}
