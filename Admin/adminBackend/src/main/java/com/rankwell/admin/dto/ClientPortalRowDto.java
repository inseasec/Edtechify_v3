package com.rankwell.admin.dto;

public class ClientPortalRowDto {

	private Long userId;
	private String userName;
	private String email;
	private String mobileNo;
	private boolean frozen;
	private String userImg;

	private String companyName;
	private String subdomain;
	private String portalSiteUrl;
	private String portalAdminUrl;
	private String contactPersonName;
	private String portalPhone;
	private String portalEmail;
	private String subscription;
	private boolean portalLaunched;

	/**
	 * Whole days this portal has been live. Uses portal launch time when recorded; falls back to
	 * account creation for legacy rows. Null if portal not launched.
	 */
	private Integer daysSincePortalLive;

	/** Bytes stored for this portal (clients.storage_used_bytes). */
	private Long storageUsedBytes;

	/**
	 * {@code ACTIVE} | {@code TRIAL_EXPIRED} — persisted on {@code clients.portal_access_status}.
	 */
	private String portalAccessStatus;

	/** DB override; null means “use platform default” in UI. */
	private Integer trialLimitDaysOverride;
	private Integer trialLimitStorageMbOverride;
	/** Resolved caps (override or platform defaults). */
	private Integer effectiveTrialLimitDays;
	private Integer effectiveTrialLimitStorageMb;

	/**
	 * Trial clock anchor as a calendar date ({@code yyyy-MM-dd}) in the server default zone —
	 * same basis as {@link #daysSincePortalLive}: {@code portal_launched_at} or account creation.
	 * Used with {@link #effectiveTrialLimitDays} to show/edit trial end date on the admin grid.
	 */
	private String trialAnchorDate;

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getMobileNo() {
		return mobileNo;
	}

	public void setMobileNo(String mobileNo) {
		this.mobileNo = mobileNo;
	}

	public boolean isFrozen() {
		return frozen;
	}

	public void setFrozen(boolean frozen) {
		this.frozen = frozen;
	}

	public String getUserImg() {
		return userImg;
	}

	public void setUserImg(String userImg) {
		this.userImg = userImg;
	}

	public String getCompanyName() {
		return companyName;
	}

	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}

	public String getSubdomain() {
		return subdomain;
	}

	public void setSubdomain(String subdomain) {
		this.subdomain = subdomain;
	}

	public String getPortalSiteUrl() {
		return portalSiteUrl;
	}

	public void setPortalSiteUrl(String portalSiteUrl) {
		this.portalSiteUrl = portalSiteUrl;
	}

	public String getPortalAdminUrl() {
		return portalAdminUrl;
	}

	public void setPortalAdminUrl(String portalAdminUrl) {
		this.portalAdminUrl = portalAdminUrl;
	}

	public String getContactPersonName() {
		return contactPersonName;
	}

	public void setContactPersonName(String contactPersonName) {
		this.contactPersonName = contactPersonName;
	}

	public String getPortalPhone() {
		return portalPhone;
	}

	public void setPortalPhone(String portalPhone) {
		this.portalPhone = portalPhone;
	}

	public String getPortalEmail() {
		return portalEmail;
	}

	public void setPortalEmail(String portalEmail) {
		this.portalEmail = portalEmail;
	}

	public String getSubscription() {
		return subscription;
	}

	public void setSubscription(String subscription) {
		this.subscription = subscription;
	}

	public boolean isPortalLaunched() {
		return portalLaunched;
	}

	public void setPortalLaunched(boolean portalLaunched) {
		this.portalLaunched = portalLaunched;
	}

	public Integer getDaysSincePortalLive() {
		return daysSincePortalLive;
	}

	public void setDaysSincePortalLive(Integer daysSincePortalLive) {
		this.daysSincePortalLive = daysSincePortalLive;
	}

	public Long getStorageUsedBytes() {
		return storageUsedBytes;
	}

	public void setStorageUsedBytes(Long storageUsedBytes) {
		this.storageUsedBytes = storageUsedBytes;
	}

	public String getPortalAccessStatus() {
		return portalAccessStatus;
	}

	public void setPortalAccessStatus(String portalAccessStatus) {
		this.portalAccessStatus = portalAccessStatus;
	}

	public Integer getTrialLimitDaysOverride() {
		return trialLimitDaysOverride;
	}

	public void setTrialLimitDaysOverride(Integer trialLimitDaysOverride) {
		this.trialLimitDaysOverride = trialLimitDaysOverride;
	}

	public Integer getTrialLimitStorageMbOverride() {
		return trialLimitStorageMbOverride;
	}

	public void setTrialLimitStorageMbOverride(Integer trialLimitStorageMbOverride) {
		this.trialLimitStorageMbOverride = trialLimitStorageMbOverride;
	}

	public Integer getEffectiveTrialLimitDays() {
		return effectiveTrialLimitDays;
	}

	public void setEffectiveTrialLimitDays(Integer effectiveTrialLimitDays) {
		this.effectiveTrialLimitDays = effectiveTrialLimitDays;
	}

	public Integer getEffectiveTrialLimitStorageMb() {
		return effectiveTrialLimitStorageMb;
	}

	public void setEffectiveTrialLimitStorageMb(Integer effectiveTrialLimitStorageMb) {
		this.effectiveTrialLimitStorageMb = effectiveTrialLimitStorageMb;
	}

	public String getTrialAnchorDate() {
		return trialAnchorDate;
	}

	public void setTrialAnchorDate(String trialAnchorDate) {
		this.trialAnchorDate = trialAnchorDate;
	}
}
