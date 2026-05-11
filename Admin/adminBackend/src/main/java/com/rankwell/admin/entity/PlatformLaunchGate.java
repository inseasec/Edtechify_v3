package com.rankwell.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Singleton row (id = 1): optional gate before new portals can use the launch flow.
 */
@Entity
@Table(name = "platform_launch_gate")
public class PlatformLaunchGate {

	@Id
	private Long id = 1L;

	@Column(name = "require_code", nullable = false)
	private boolean requireCode = false;

	@Column(name = "secret_code", length = 512)
	private String secretCode;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public boolean isRequireCode() {
		return requireCode;
	}

	public void setRequireCode(boolean requireCode) {
		this.requireCode = requireCode;
	}

	public String getSecretCode() {
		return secretCode;
	}

	public void setSecretCode(String secretCode) {
		this.secretCode = secretCode;
	}
}
