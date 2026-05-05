package com.rankwell.admin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rankwell.admin.entity.SubscriptionPlan;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

	List<SubscriptionPlan> findAllByOrderBySortOrderAscIdAsc();
}
