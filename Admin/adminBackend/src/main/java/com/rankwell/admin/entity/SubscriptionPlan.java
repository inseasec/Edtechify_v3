package com.rankwell.admin.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 160)
	private String name;

	@Column(length = 2000)
	private String description;

	/** Price in rupees (major units). Razorpay order multiplies by 100 for paise. */
	@Column(nullable = false, precision = 14, scale = 2)
	private BigDecimal price;

	@Column(nullable = false, length = 8)
	private String currency = "INR";

	@Column(name = "duration_days", nullable = false)
	private Integer durationDays;

	@Column(name = "storage_limit_mb", nullable = false)
	private Integer storageLimitMb;

	@Column(nullable = false)
	private Boolean active = true;

	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder = 0;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public void setPrice(BigDecimal price) {
		this.price = price;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public Integer getDurationDays() {
		return durationDays;
	}

	public void setDurationDays(Integer durationDays) {
		this.durationDays = durationDays;
	}

	public Integer getStorageLimitMb() {
		return storageLimitMb;
	}

	public void setStorageLimitMb(Integer storageLimitMb) {
		this.storageLimitMb = storageLimitMb;
	}

	public Boolean getActive() {
		return active;
	}

	public void setActive(Boolean active) {
		this.active = active;
	}

	public Integer getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(Integer sortOrder) {
		this.sortOrder = sortOrder;
	}
}
