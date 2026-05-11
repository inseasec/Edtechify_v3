package com.rankwell.admin.dto;

public class LaunchGateAdminResponse {

	private boolean requireLaunchCode;
	private boolean hasLaunchCodeConfigured;
	/** Current stored code (plain text) so admins can copy it for clients. Empty when none set. */
	private String launchCode = "";

	public LaunchGateAdminResponse() {
	}

	public LaunchGateAdminResponse(boolean requireLaunchCode, boolean hasLaunchCodeConfigured, String launchCode) {
		this.requireLaunchCode = requireLaunchCode;
		this.hasLaunchCodeConfigured = hasLaunchCodeConfigured;
		this.launchCode = launchCode != null ? launchCode : "";
	}

	public boolean isRequireLaunchCode() {
		return requireLaunchCode;
	}

	public void setRequireLaunchCode(boolean requireLaunchCode) {
		this.requireLaunchCode = requireLaunchCode;
	}

	public boolean isHasLaunchCodeConfigured() {
		return hasLaunchCodeConfigured;
	}

	public void setHasLaunchCodeConfigured(boolean hasLaunchCodeConfigured) {
		this.hasLaunchCodeConfigured = hasLaunchCodeConfigured;
	}

	public String getLaunchCode() {
		return launchCode;
	}

	public void setLaunchCode(String launchCode) {
		this.launchCode = launchCode != null ? launchCode : "";
	}
}
