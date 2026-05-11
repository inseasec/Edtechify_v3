package com.RankwellClient.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PortalLaunchResponse {

	private Long id;
	private String contactPersonName;
	private String companyName;
	private String roleInCompany;
	private String address;
	private String phone;
	private String email;
	private String subdomain;
	private String subscription;
	/**
	 * Display plan line aligned with the admin subscription grid (date vs today + trial detection):
	 * {@code Trial}, {@code Trial_expired}, {@code subscription_expired}, or the paid plan name.
	 */
	private String planStatus;
	/** Persisted {@code clients.portal_live_status}: YES / NO (same source as admin Live column). */
	@JsonProperty("portalAccessStatus")
	private String portalAccessStatus;
	private String siteUrl;
	private String adminUrl;

	/** Last calendar day of trial (yyyy-MM-dd, UTC anchor), inclusive of launch day. Null if not trial or unknown. */
	private String trialExpiresOn;

	/** Storage cap for the portal when known (MB). */
	private Integer storageAllocatedMb;

	/** Bytes stored for this portal. */
	private Long storageUsedBytes;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getContactPersonName() {
		return contactPersonName;
	}

	public void setContactPersonName(String contactPersonName) {
		this.contactPersonName = contactPersonName;
	}

	public String getCompanyName() {
		return companyName;
	}

	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}

	public String getRoleInCompany() {
		return roleInCompany;
	}

	public void setRoleInCompany(String roleInCompany) {
		this.roleInCompany = roleInCompany;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getSubdomain() {
		return subdomain;
	}

	public void setSubdomain(String subdomain) {
		this.subdomain = subdomain;
	}

	public String getSubscription() {
		return subscription;
	}

	public void setSubscription(String subscription) {
		this.subscription = subscription;
	}

	public String getPlanStatus() {
		return planStatus;
	}

	public void setPlanStatus(String planStatus) {
		this.planStatus = planStatus;
	}

	public String getPortalAccessStatus() {
		return portalAccessStatus;
	}

	public void setPortalAccessStatus(String portalAccessStatus) {
		this.portalAccessStatus = portalAccessStatus;
	}

	public String getSiteUrl() {
		return siteUrl;
	}

	public void setSiteUrl(String siteUrl) {
		this.siteUrl = siteUrl;
	}

	public String getAdminUrl() {
		return adminUrl;
	}

	public void setAdminUrl(String adminUrl) {
		this.adminUrl = adminUrl;
	}

	public String getTrialExpiresOn() {
		return trialExpiresOn;
	}

	public void setTrialExpiresOn(String trialExpiresOn) {
		this.trialExpiresOn = trialExpiresOn;
	}

	public Integer getStorageAllocatedMb() {
		return storageAllocatedMb;
	}

	public void setStorageAllocatedMb(Integer storageAllocatedMb) {
		this.storageAllocatedMb = storageAllocatedMb;
	}

	public Long getStorageUsedBytes() {
		return storageUsedBytes;
	}

	public void setStorageUsedBytes(Long storageUsedBytes) {
		this.storageUsedBytes = storageUsedBytes;
	}
}
