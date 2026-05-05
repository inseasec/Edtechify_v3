package com.rankwell.admin.entity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "clients")
public class EdukifyClient {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false, unique = true)
	private Long userId;

	@Column(name = "contact_person_name", nullable = false, length = 255)
	private String contactPersonName;

	@Column(name = "company_name", nullable = false, length = 255)
	private String companyName;

	@Column(length = 2048)
	private String address;

	@Column(length = 64)
	private String phone;

	@Column(length = 255)
	private String email;

	@Column(nullable = false, unique = true, length = 63)
	private String subdomain;

	@Column(nullable = false, length = 64)
	private String subscription = "Trial";

	@Column(name = "storage_used_bytes")
	private Long storageUsedBytes = 0L;

	@Column(name = "portal_launched_at")
	private Instant portalLaunchedAt;

	/** Persisted live status: {@code YES} (live) / {@code NO} (not live). */
	@Column(name = "portal_live_status", length = 32)
	private String portalAccessStatus;

	/** Nullable: when set, replaces platform default trial length for this portal. */
	@Column(name = "trial_limit_days")
	private Integer trialLimitDays;

	/** Nullable: when set, replaces platform default storage cap (megabytes). */
	@Column(name = "trial_limit_storage_mb")
	private Integer trialLimitStorageMb;

	/**
	 * Last calendar day included in the trial (inclusive). Aligned with admin “Expires” date;
	 * persisted so the user portal shows the same date without timezone drift.
	 */
	@Column(name = "trial_expires_on")
	private LocalDate trialExpiresOn;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
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

	public Long getStorageUsedBytes() {
		return storageUsedBytes;
	}

	public void setStorageUsedBytes(Long storageUsedBytes) {
		this.storageUsedBytes = storageUsedBytes;
	}

	public Instant getPortalLaunchedAt() {
		return portalLaunchedAt;
	}

	public void setPortalLaunchedAt(Instant portalLaunchedAt) {
		this.portalLaunchedAt = portalLaunchedAt;
	}

	public String getPortalAccessStatus() {
		return portalAccessStatus;
	}

	public void setPortalAccessStatus(String portalAccessStatus) {
		this.portalAccessStatus = portalAccessStatus;
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

	public LocalDate getTrialExpiresOn() {
		return trialExpiresOn;
	}

	public void setTrialExpiresOn(LocalDate trialExpiresOn) {
		this.trialExpiresOn = trialExpiresOn;
	}
}
