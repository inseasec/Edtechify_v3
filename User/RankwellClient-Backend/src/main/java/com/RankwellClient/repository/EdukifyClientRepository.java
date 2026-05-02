package com.RankwellClient.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.RankwellClient.entity.EdukifyClient;

public interface EdukifyClientRepository extends JpaRepository<EdukifyClient, Long> {

	Optional<EdukifyClient> findByUserId(Long userId);

	boolean existsBySubdomain(String subdomain);
}
