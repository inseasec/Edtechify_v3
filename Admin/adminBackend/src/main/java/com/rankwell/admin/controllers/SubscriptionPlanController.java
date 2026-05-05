package com.rankwell.admin.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rankwell.admin.entity.SubscriptionPlan;
import com.rankwell.admin.services.SubscriptionPlanService;

@RestController
@RequestMapping("/subscription-plans")
public class SubscriptionPlanController {

	private final SubscriptionPlanService service;

	public SubscriptionPlanController(SubscriptionPlanService service) {
		this.service = service;
	}

	@GetMapping
	public List<SubscriptionPlan> list() {
		return service.listAll();
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody SubscriptionPlan body) {
		try {
			return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<?> update(@PathVariable Long id, @RequestBody SubscriptionPlan body) {
		try {
			return ResponseEntity.ok(service.update(id, body));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(@PathVariable Long id) {
		try {
			service.delete(id);
			return ResponseEntity.noContent().build();
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
		}
	}
}
