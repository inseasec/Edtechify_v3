package com.RankwellClient.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.RankwellClient.dto.BillingDetailsDto;
import com.RankwellClient.services.BillingDetailsService;
import com.RankwellClient.services.EdukifyClientService;

@RestController
@RequestMapping("/billing")
public class BillingDetailsController {

	private final BillingDetailsService billingDetailsService;

	public BillingDetailsController(BillingDetailsService billingDetailsService) {
		this.billingDetailsService = billingDetailsService;
	}

	@GetMapping("/me")
	public ResponseEntity<BillingDetailsDto> getMine(Authentication authentication) {
		Long userId = EdukifyClientService.userIdFromAuth(authentication);
		return ResponseEntity.ok(billingDetailsService.getForUser(userId));
	}

	@PutMapping("/me")
	public ResponseEntity<BillingDetailsDto> upsertMine(Authentication authentication, @RequestBody BillingDetailsDto body) {
		Long userId = EdukifyClientService.userIdFromAuth(authentication);
		return ResponseEntity.ok(billingDetailsService.upsertForUser(userId, body));
	}
}

