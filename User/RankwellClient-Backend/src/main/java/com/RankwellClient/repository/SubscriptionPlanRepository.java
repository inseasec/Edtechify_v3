package com.RankwellClient.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.RankwellClient.entity.SubscriptionPlan;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

	List<SubscriptionPlan> findByActiveTrueOrderBySortOrderAscIdAsc();
}
