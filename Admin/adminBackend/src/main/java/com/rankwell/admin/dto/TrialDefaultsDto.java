package com.rankwell.admin.dto;

public class TrialDefaultsDto {

	private int trialDurationDays;
	private int trialStorageMb;

	public TrialDefaultsDto() {
	}

	public TrialDefaultsDto(int trialDurationDays, int trialStorageMb) {
		this.trialDurationDays = trialDurationDays;
		this.trialStorageMb = trialStorageMb;
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
