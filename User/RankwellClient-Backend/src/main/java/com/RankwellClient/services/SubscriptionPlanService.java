package com.RankwellClient.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.RankwellClient.entity.SubscriptionPlan;
import com.RankwellClient.repository.SubscriptionPlanRepository;

@Service
public class SubscriptionPlanService {

	private final SubscriptionPlanRepository repository;

	public SubscriptionPlanService(SubscriptionPlanRepository repository) {
		this.repository = repository;
	}

	public List<SubscriptionPlan> listActive() {
		return repository.findByActiveTrueOrderBySortOrderAscIdAsc();
	}
}
