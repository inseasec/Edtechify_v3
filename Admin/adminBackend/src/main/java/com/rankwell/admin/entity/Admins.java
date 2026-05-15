package com.rankwell.admin.entity;

import java.time.LocalDateTime;
import java.util.ArrayList; 
import java.util.List;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
@Entity
@Table
//@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Admins { 
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id; 
	
	@Column(nullable = false)
	private String name;
	@Column(unique = true, nullable = false)
	private String email;
	@Column(nullable=false)
	private String password;
	@Column(nullable = false)
	private Boolean isActive;
	
	@Enumerated(EnumType.STRING)
	@Column(nullable=false)
	private Role role;

	@Column(name = "mobile_no", length = 32)
	private String mobileNo;
	
//	@ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
//	@JoinTable(name = "admin_departments", joinColumns = @JoinColumn(name = "admin_id"), inverseJoinColumns = @JoinColumn(name = "dept_id"))
//	@JsonManagedReference
//	private List<Departments> departments = new ArrayList<Departments>();
	
	@Column(name = "otp")
	private String otp;

	@Column(name = "otp_created_at")
	private LocalDateTime otpCreatedAt;

	@Column(name = "otp_expires_at")
	private LocalDateTime otpExpiresAt;
	
	@Column(name = "is_2fa_enabled" ,nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
	private Boolean is2FAEnabled = false;

	@Column(name = "is_2fa_email_enabled", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
	private Boolean is2FAEmailEnabled = false;

	@Column(name = "special_password")
	private String specialPassword;

	public enum Role {
        SUPER_ADMIN, TEAM_ADMIN, SUB_ADMIN, HR
    }
	
	 public void setPassword(String rawPassword) {
	     this.password = new BCryptPasswordEncoder().encode(rawPassword);
	 }
	 
	public String getPassword() {
		return password;
	}

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

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

//	public List<Departments> getDepartments() {
//		return departments;
//	}
//
//	public void setDepartments(List<Departments> departments) {
//		this.departments = departments;
//	}

	public String getOtp() {
		return otp;
	}

	public void setOtp(String otp) {
		this.otp = otp;
	}

	public LocalDateTime getOtpCreatedAt() {
		return otpCreatedAt;
	}

	public void setOtpCreatedAt(LocalDateTime otpCreatedAt) {
		this.otpCreatedAt = otpCreatedAt;
	}

	public LocalDateTime getOtpExpiresAt() {
		return otpExpiresAt;
	}

	public void setOtpExpiresAt(LocalDateTime otpExpiresAt) {
		this.otpExpiresAt = otpExpiresAt;
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

	@JsonIgnore
	public String getSpecialPassword() {
		return specialPassword;
	}

	public void setSpecialPassword(String rawPassword) {
		if (rawPassword == null || rawPassword.isBlank()) {
			return;
		}
		this.specialPassword = new BCryptPasswordEncoder().encode(rawPassword);
	}

	public void clearSpecialPassword() {
		this.specialPassword = null;
	}

	@JsonProperty("hasSpecialPassword")
	public boolean getHasSpecialPassword() {
		return specialPassword != null && !specialPassword.isBlank();
	}

	public Admins(Long id, String name, String email, String password, Boolean isActive, Role role,
			String mobileNo, String otp, LocalDateTime otpCreatedAt, LocalDateTime otpExpiresAt,
			Boolean is2faEnabled, Boolean is2faEmailEnabled) {
		super();
		this.id = id;
		this.name = name;
		this.email = email;
		this.password = password;
		this.isActive = isActive;
		this.role = role;
		this.mobileNo = mobileNo;
		this.otp = otp;
		this.otpCreatedAt = otpCreatedAt;
		this.otpExpiresAt = otpExpiresAt;
		this.is2FAEnabled = is2faEnabled;
		this.is2FAEmailEnabled = is2faEmailEnabled;
	}

	public Admins() {
		super();
		// TODO Auto-generated constructor stub
	}
	
	 
}
