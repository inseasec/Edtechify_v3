package com.RankwellClient.dto;

public class BillingDetailsDto {
	private boolean sameAsCompany = true;
	private String billingName;
	private String billingEmail;
	private String billingPhone;
	private String billingAddress;
	private String billingGstNo; // optional

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

