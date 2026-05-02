package com.rankwell.admin.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rankwell.admin.entity.EdukifyClient;

public interface EdukifyClientRepository extends JpaRepository<EdukifyClient, Long> {

	Optional<EdukifyClient> findByUserId(Long userId);

	List<EdukifyClient> findByPortalLaunchedAtIsNull();
}
