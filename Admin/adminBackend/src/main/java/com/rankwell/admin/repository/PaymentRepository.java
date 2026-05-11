package com.rankwell.admin.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.rankwell.admin.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

	@Transactional
	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("DELETE FROM Payment p WHERE p.user.id = :userId")
	int deleteAllByUserId(@Param("userId") Long userId);
}
