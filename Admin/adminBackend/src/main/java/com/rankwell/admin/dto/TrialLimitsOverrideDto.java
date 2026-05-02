package com.rankwell.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TrialLimitsOverrideDto {

	/** Clears {@code trial_limit_days} / {@code trial_limit_storage_mb} on the portal row — use platform defaults. */
	private Boolean resetToPlatformDefaults;

	private Integer trialLimitDays;
	private Integer trialLimitStorageMb;

	public Boolean getResetToPlatformDefaults() {
		return resetToPlatformDefaults;
	}

	public void setResetToPlatformDefaults(Boolean resetToPlatformDefaults) {
		this.resetToPlatformDefaults = resetToPlatformDefaults;
	}

	public Integer getTrialLimitDays() {
		return trialLimitDays;
	}

	public void setTrialLimitDays(Integer trialLimitDays) {
		this.trialLimitDays = trialLimitDays;
	}

	public Integer getTrialLimitStorageMb() {
		return trialLimitStorageMb;
	}

	public void setTrialLimitStorageMb(Integer trialLimitStorageMb) {
		this.trialLimitStorageMb = trialLimitStorageMb;
	}
}
