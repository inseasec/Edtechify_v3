package com.RankwellClient.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.RankwellClient.entity.SubscriptionPlan;
import com.RankwellClient.services.SubscriptionPlanService;

@RestController
@RequestMapping("/subscription-plans")
public class SubscriptionPlanController {

	private final SubscriptionPlanService subscriptionPlanService;

	public SubscriptionPlanController(SubscriptionPlanService subscriptionPlanService) {
		this.subscriptionPlanService = subscriptionPlanService;
	}

	@GetMapping("/active")
	public List<SubscriptionPlan> listActive() {
		return subscriptionPlanService.listActive();
	}
}
