package com.RankwellClient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "billing_details")
public class BillingDetails {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private Users user;

	@Column(name = "same_as_company", nullable = false)
	private boolean sameAsCompany = true;

	@Column(name = "billing_name", length = 255)
	private String billingName;

	@Column(name = "billing_email", length = 255)
	private String billingEmail;

	@Column(name = "billing_phone", length = 64)
	private String billingPhone;

	@Column(name = "billing_address", length = 2000)
	private String billingAddress;

	@Column(name = "billing_gst_no", length = 64)
	private String billingGstNo;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Users getUser() {
		return user;
	}

	public void setUser(Users user) {
		this.user = user;
	}

	public boolean isSameAsCompany() {
		return sameAsCompany;
	}

	public void setSameAsCompany(boolean sameAsCompany) {
		this.sameAsCompany = sameAsCompany;
	}

	public String getBillingName() {
		return billingName;
	}

	public void setBillingName(String billingName) {
		this.billingName = billingName;
	}

	public String getBillingEmail() {
		return billingEmail;
	}

	public void setBillingEmail(String billingEmail) {
		this.billingEmail = billingEmail;
	}

	public String getBillingPhone() {
		return billingPhone;
	}

	public void setBillingPhone(String billingPhone) {
		this.billingPhone = billingPhone;
	}

	public String getBillingAddress() {
		return billingAddress;
	}

	public void setBillingAddress(String billingAddress) {
		this.billingAddress = billingAddress;
	}

	public String getBillingGstNo() {
		return billingGstNo;
	}

	public void setBillingGstNo(String billingGstNo) {
		this.billingGstNo = billingGstNo;
	}
}

