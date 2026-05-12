package com.rankwell.admin.dto;

import com.rankwell.admin.entity.Admins.Role;

public class AdminDto {
	
	private Long id;
	private String name;
	private String email;
	private String password;
	private Boolean isActive;
	private Role role;
	private String mobileNo;
	private Boolean is2FAEnabled;
	private Boolean is2FAEmailEnabled;
	private String specialPassword;
	private Boolean clearSpecialPassword;
	
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
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public Boolean getIsActive() {
		return isActive;
	}
	public void setIsActive(Boolean isActive) {
		this.isActive = isActive;
	}	
	public Role getRole() {
		return role;
	}
	public void setRole(Role role) {
		this.role = role;
	}
	public String getMobileNo() {
		return mobileNo;
	}
	public void setMobileNo(String mobileNo) {
		this.mobileNo = mobileNo;
	}
	public Boolean getIs2FAEnabled() {
		return is2FAEnabled;
	}
	public void setIs2FAEnabled(Boolean is2faEnabled) {
		this.is2FAEnabled = is2faEnabled;
	}
	public Boolean getIs2FAEmailEnabled() {
		return is2FAEmailEnabled;
	}
	public void setIs2FAEmailEnabled(Boolean is2faEmailEnabled) {
		this.is2FAEmailEnabled = is2faEmailEnabled;
	}
	public String getSpecialPassword() {
		return specialPassword;
	}
	public void setSpecialPassword(String specialPassword) {
		this.specialPassword = specialPassword;
	}
	public Boolean getClearSpecialPassword() {
		return clearSpecialPassword;
	}
	public void setClearSpecialPassword(Boolean clearSpecialPassword) {
		this.clearSpecialPassword = clearSpecialPassword;
	}
	public AdminDto(Long id, String name, String email, String password, Boolean isActive, Role role,
			String mobileNo, Boolean is2faEnabled, Boolean is2faEmailEnabled) {
		super();
		this.id = id;
		this.name = name;
		this.email = email;
		this.password = password;
		this.isActive = isActive;
		this.role = role;
		this.mobileNo = mobileNo;
		this.is2FAEnabled = is2faEnabled;
		this.is2FAEmailEnabled = is2faEmailEnabled;
	}
	public AdminDto() {
		super();
	}
}
