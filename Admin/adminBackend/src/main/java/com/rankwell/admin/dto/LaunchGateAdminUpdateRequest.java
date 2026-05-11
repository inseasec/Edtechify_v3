package com.rankwell.admin.dto;

public class LaunchGateAdminUpdateRequest {

	private boolean requireLaunchCode;
	/** When non-null and non-blank after trim, replaces the stored secret. */
	private String launchCode;

	public boolean isRequireLaunchCode() {
		return requireLaunchCode;
	}

	public void setRequireLaunchCode(boolean requireLaunchCode) {
		this.requireLaunchCode = requireLaunchCode;
	}

	public String getLaunchCode() {
		return launchCode;
	}

	public void setLaunchCode(String launchCode) {
		this.launchCode = launchCode;
	}
}
