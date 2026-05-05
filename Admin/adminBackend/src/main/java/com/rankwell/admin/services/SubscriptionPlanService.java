package com.rankwell.admin.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rankwell.admin.entity.SubscriptionPlan;
import com.rankwell.admin.repository.SubscriptionPlanRepository;

@Service
public class SubscriptionPlanService {

	private final SubscriptionPlanRepository repository;

	public SubscriptionPlanService(SubscriptionPlanRepository repository) {
		this.repository = repository;
	}

	public List<SubscriptionPlan> listAll() {
		return repository.findAllByOrderBySortOrderAscIdAsc();
	}

	@Transactional
	public SubscriptionPlan create(SubscriptionPlan plan) {
		plan.setId(null);
		if (plan.getActive() == null) {
			plan.setActive(true);
		}
		if (plan.getSortOrder() == null) {
			plan.setSortOrder(0);
		}
		if (plan.getCurrency() == null || plan.getCurrency().isBlank()) {
			plan.setCurrency("INR");
		}
		validate(plan);
		return repository.save(plan);
	}

	@Transactional
	public SubscriptionPlan update(Long id, SubscriptionPlan body) {
		SubscriptionPlan existing = repository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Plan not found"));
		validate(body);
		existing.setName(body.getName());
		existing.setDescription(body.getDescription());
		existing.setPrice(body.getPrice());
		existing.setCurrency(body.getCurrency() != null && !body.getCurrency().isBlank() ? body.getCurrency() : "INR");
		existing.setDurationDays(body.getDurationDays());
		existing.setStorageLimitMb(body.getStorageLimitMb());
		existing.setActive(body.getActive() != null ? body.getActive() : true);
		existing.setSortOrder(body.getSortOrder() != null ? body.getSortOrder() : 0);
		return repository.save(existing);
	}

	@Transactional
	public void delete(Long id) {
		if (!repository.existsById(id)) {
			throw new IllegalArgumentException("Plan not found");
		}
		repository.deleteById(id);
	}

	private static void validate(SubscriptionPlan plan) {
		if (plan.getName() == null || plan.getName().isBlank()) {
			throw new IllegalArgumentException("Name is required");
		}
		if (plan.getPrice() == null || plan.getPrice().signum() < 0) {
			throw new IllegalArgumentException("Price must be zero or positive");
		}
		if (plan.getDurationDays() == null || plan.getDurationDays() < 1) {
			throw new IllegalArgumentException("Duration (days) must be at least 1");
		}
		if (plan.getStorageLimitMb() == null || plan.getStorageLimitMb() < 1) {
			throw new IllegalArgumentException("Storage limit (MB) must be at least 1");
		}
	}
}
