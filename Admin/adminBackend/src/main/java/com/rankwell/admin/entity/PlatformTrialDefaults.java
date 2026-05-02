package com.rankwell.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Singleton row (id = 1): default trial duration and storage quota for all Trial clients.
 */
@Entity
@Table(name = "platform_trial_defaults")
public class PlatformTrialDefaults {

	@Id
	private Long id = 1L;

	@Column(name = "trial_duration_days", nullable = false)
	private int trialDurationDays = 14;

	@Column(name = "trial_storage_mb", nullable = false)
	private int trialStorageMb = 512;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public int getTrialDurationDays() {
		return trialDurationDays;
	}

	public void setTrialDurationDays(int trialDurationDays) {
		this.trialDurationDays = trialDurationDays;
	}

	public int getTrialStorageMb() {
		return trialStorageMb;
	}

	public void setTrialStorageMb(int trialStorageMb) {
		this.trialStorageMb = trialStorageMb;
	}
}
