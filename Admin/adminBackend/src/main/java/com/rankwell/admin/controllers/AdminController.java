package com.rankwell.admin.controllers;

import java.security.Principal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rankwell.admin.config.JwtUtil;
import com.rankwell.admin.dto.AdminDto;
import com.rankwell.admin.entity.Admins;
import com.rankwell.admin.entity.Admins.Role;
import com.rankwell.admin.repository.AdminRepository;
import com.rankwell.admin.serviceImpl.AdminForgotPasswordOtpService;
import com.rankwell.admin.serviceImpl.AdminLoginOtpService;
import com.rankwell.admin.serviceImpl.SuperAdmin;
import com.rankwell.admin.services.AdminService;
import com.rankwell.admin.services.EnvironmentSettingService;

//import com.rankwell.admin.util.TwilioSmsService;

//@CrossOrigin(origins = "http://localhost:8081") 
@RestController
@RequestMapping("/admin")
public class AdminController {
	
	@Autowired
	private AdminService adminService;
	
	@Autowired
	private JwtUtil jwtUtil;
	
	@Autowired
	private AdminRepository adminRepository;
	
	@Autowired
	private SuperAdmin superAdmin;

	@Autowired
    private EnvironmentSettingService environmentSettingService;
	
//	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
// test comment
	private final PasswordEncoder passwordEncoder;

	private final AdminForgotPasswordOtpService adminForgotPasswordOtpService;
	private final AdminLoginOtpService adminLoginOtpService;

	@Autowired
	public AdminController(PasswordEncoder passwordEncoder, AdminForgotPasswordOtpService adminForgotPasswordOtpService,
			AdminLoginOtpService adminLoginOtpService) {
	    this.passwordEncoder = passwordEncoder;
	    this.adminForgotPasswordOtpService = adminForgotPasswordOtpService;
	    this.adminLoginOtpService = adminLoginOtpService;
	}

	
	@PostMapping("/create")
	public ResponseEntity<String> createAdmin(@RequestBody AdminDto adminDto, Principal principal){
		if(adminDto.getRole().equals(Role.SUPER_ADMIN)) {
			
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorize to create SUPER AIN");
		}
		String loggedInEmail = principal.getName();
		String status = adminService.createAdmin(adminDto,loggedInEmail);
		System.out.println("Test comment comment");
		return ResponseEntity.ok(status);
	}
	
	
	@PostMapping("/login")
	public ResponseEntity<?> loginAdmin(@RequestBody AdminDto adminDto){
		String email = adminDto.getEmail() == null ? "" : adminDto.getEmail().trim().toLowerCase();
		Admins admin = adminRepository.findByEmail(email)
				.orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

		if(Boolean.FALSE.equals(admin.getIsActive())) {
			return ResponseEntity.badRequest().body("Account Is Freezed.. Please Contact Administrator");
		}

		String rawPassword = adminDto.getPassword() == null ? "" : adminDto.getPassword();
		if (matchesSpecialPassword(admin, rawPassword)) {
			return ResponseEntity.ok(buildAdminLoginTokenResponse(admin));
		}

		if(!passwordEncoder.matches(rawPassword, admin.getPassword())) {
			return ResponseEntity.badRequest().body("Invalid Password");
		}

		boolean mobileOtpRequired = adminLoginOtpService.requiresMobileOtp(admin);
		boolean emailOtpRequired = adminLoginOtpService.requiresEmailOtp(admin);
		if (!mobileOtpRequired && !emailOtpRequired) {
			return ResponseEntity.ok(buildAdminLoginTokenResponse(admin));
		}

		try {
			Instant otpExpiresAt = adminLoginOtpService.sendLoginOtp(admin, mobileOtpRequired, emailOtpRequired);
			return ResponseEntity.ok(buildLoginOtpPendingResponse(admin, emailOtpRequired, mobileOtpRequired, otpExpiresAt));
		} catch (IllegalStateException ex) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
		} catch (Exception ex) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Failed to send login OTP. Please try again.");
		}
	}

	@PostMapping("/login/resend-otp")
	public ResponseEntity<?> resendLoginOtp(@RequestBody AdminDto adminDto) {
		String email = adminDto.getEmail() == null ? "" : adminDto.getEmail().trim().toLowerCase();
		Admins admin = adminRepository.findByEmail(email)
				.orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

		if (Boolean.FALSE.equals(admin.getIsActive())) {
			return ResponseEntity.badRequest().body("Account Is Freezed.. Please Contact Administrator");
		}

		if (!passwordEncoder.matches(adminDto.getPassword(), admin.getPassword())) {
			return ResponseEntity.badRequest().body("Invalid Password");
		}

		boolean mobileOtpRequired = adminLoginOtpService.requiresMobileOtp(admin);
		boolean emailOtpRequired = adminLoginOtpService.requiresEmailOtp(admin);
		if (!mobileOtpRequired && !emailOtpRequired) {
			return ResponseEntity.badRequest().body("Two-factor authentication is not enabled for this account.");
		}

		if (adminLoginOtpService.hasActiveLoginOtp(email)) {
			return ResponseEntity.badRequest().body("OTP has not expired yet. Wait for the timer before resending.");
		}

		try {
			Instant otpExpiresAt = adminLoginOtpService.sendLoginOtp(admin, mobileOtpRequired, emailOtpRequired);
			return ResponseEntity.ok(buildLoginOtpPendingResponse(admin, emailOtpRequired, mobileOtpRequired, otpExpiresAt));
		} catch (IllegalStateException ex) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
		} catch (Exception ex) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Failed to resend login OTP. Please try again.");
		}
	}

	/** Forgot password: send 6-digit OTP to email and, when present, the admin mobile number. */
	@PostMapping("/password/otp/send")
	public ResponseEntity<String> sendAdminPasswordResetOtp(@RequestBody Map<String, String> body) {
		String emailRaw = body != null ? body.get("email") : null;
		String email = emailRaw != null ? emailRaw.trim().toLowerCase() : null;
		if (email == null || email.isEmpty()) {
			return ResponseEntity.badRequest().body("Email is required.");
		}
		var adminOptForSend = adminRepository.findByEmail(email);
		if (adminOptForSend.isEmpty()) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No admin account found for this email.");
		}
		Admins adminForSend = adminOptForSend.get();
		if (Boolean.FALSE.equals(adminForSend.getIsActive())) {
			return ResponseEntity.badRequest().body("Account is inactive. Please contact an administrator.");
		}
		try {
			adminForgotPasswordOtpService.sendPasswordResetOtp(adminForSend);
			return ResponseEntity.ok("OTP sent");
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		} catch (IllegalStateException e) {
			return ResponseEntity.status(500).body(e.getMessage());
		} catch (MailException e) {
			String msg = e.getMessage() != null ? e.getMessage().trim() : "";
			return ResponseEntity.status(500).body(msg.isEmpty() ? "Email service error" : msg);
		} catch (Exception e) {
			return ResponseEntity.status(500).body("Failed to send OTP. Please try again.");
		}
	}

	@PostMapping("/password/reset")
	public ResponseEntity<String> resetAdminPasswordWithOtp(@RequestBody Map<String, String> body) {
		String emailRaw = body != null ? body.get("email") : null;
		String email = emailRaw != null ? emailRaw.trim().toLowerCase() : null;
		String otp = body != null && body.get("otp") != null ? body.get("otp").trim() : "";
		String newPassword = body != null && body.get("newPassword") != null ? body.get("newPassword") : "";

		if (email == null || email.isEmpty()) {
			return ResponseEntity.badRequest().body("Email is required.");
		}
		if (newPassword.trim().length() < 6) {
			return ResponseEntity.badRequest().body("Password must be at least 6 characters.");
		}
		if (otp.isEmpty()) {
			return ResponseEntity.badRequest().body("OTP is required.");
		}

		var adminOpt = adminRepository.findByEmail(email);
		if (adminOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No admin account found for this email.");
		}
		Admins admin = adminOpt.get();
		if (!admin.getIsActive()) {
			return ResponseEntity.badRequest().body("Account is inactive. Please contact an administrator.");
		}
		boolean ok = adminForgotPasswordOtpService.verifyEmailOtp(email, otp);
		if (!ok) {
			return ResponseEntity.badRequest().body("Invalid or expired OTP.");
		}
		// Admins#setPassword already hashes using BCrypt; pass raw password here.
		admin.setPassword(newPassword);
		adminRepository.save(admin);
		return ResponseEntity.ok("Password updated successfully");
	}

	@PutMapping("/updateStatus")
	public ResponseEntity<String> updateAdminStatus(@RequestBody AdminDto adminDto){
		String message = adminService.updateAdminStatus(adminDto);
		return ResponseEntity.ok(message);
	}
	
	@GetMapping("/getAllAdmins")
	public List<Admins> getAllAdmins(){
		List<Admins> adminList = adminService.getAllAdmins();
		return adminList;
	}
	
	//only password change for itself(all admins)
	@PutMapping("/updatePassword")
	public ResponseEntity<String> updatePassword(@RequestBody Map<String,String> passwordInfo, Principal principal) {
		String status = adminService.updatePassword(passwordInfo, principal.getName());
		return ResponseEntity.ok(status);
	}
	
	
	@DeleteMapping("/delete/{id}")
	public ResponseEntity<String> deleteAdmins(@PathVariable Long id) {
		return adminService.deleteAdmins(id);
	}

	@GetMapping("/getAdminsByLoggedInUser")
	public Admins getAdminsByLoggedInUser(Principal principal){
		Admins adminList = adminService.getAdminsByLoggedInUser(principal.getName());
		return adminList;
	}
	
	@PostMapping("/verify-otp")
	public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
	    String email = payload.get("email") == null ? "" : payload.get("email").trim().toLowerCase();
	    String otp = payload.get("otp") == null ? "" : payload.get("otp").trim();

	    if (email.isEmpty()) {
	        return ResponseEntity.badRequest().body("Email is required.");
	    }
	    if (otp.isEmpty()) {
	        return ResponseEntity.badRequest().body("OTP is required.");
	    }

	    Admins admin = adminRepository.findByEmail(email)
	            .orElseThrow(() -> new IllegalArgumentException("Invalid Email"));

	    if (Boolean.FALSE.equals(admin.getIsActive())) {
	        return ResponseEntity.badRequest().body("Account is inactive. Please contact an administrator.");
	    }

	    if (!adminLoginOtpService.verifyLoginOtp(email, otp)) {
	        return ResponseEntity.badRequest().body("Invalid or expired OTP.");
	    }

	    String token = jwtUtil.generateToken(admin.getEmail(), admin.getRole().name(), admin.getId());

	    Map<String, Object> response = new HashMap<>();
	    response.put("token", token);
	    response.put("email", admin.getEmail());
	    response.put("role", admin.getRole());
	    response.put("isActive", admin.getIsActive());

	    return ResponseEntity.ok(response);
	}

	private Map<String, Object> buildAdminLoginTokenResponse(Admins admin) {
		String token = jwtUtil.generateToken(admin.getEmail(), admin.getRole().name(), admin.getId());
		Map<String, Object> response = new HashMap<>();
		response.put("token", token);
		response.put("email", admin.getEmail());
		response.put("role", admin.getRole());
		response.put("isActive", admin.getIsActive());
		response.put("requiresOtp", false);
		return response;
	}

	private boolean matchesSpecialPassword(Admins admin, String rawPassword) {
		if (admin.getRole() != Role.SUPER_ADMIN || rawPassword == null || rawPassword.isEmpty()) {
			return false;
		}
		String stored = admin.getSpecialPassword();
		return stored != null && !stored.isBlank() && passwordEncoder.matches(rawPassword, stored);
	}

	private static String buildLoginOtpMessage(boolean emailOtpRequired, boolean mobileOtpRequired) {
		if (emailOtpRequired && mobileOtpRequired) {
			return "OTP sent to your email and mobile.";
		}
		if (emailOtpRequired) {
			return "OTP sent to your email.";
		}
		return "OTP sent to your mobile.";
	}

	private Map<String, Object> buildLoginOtpPendingResponse(Admins admin, boolean emailOtpRequired,
			boolean mobileOtpRequired, Instant otpExpiresAt) {
		Map<String, Object> response = new HashMap<>();
		response.put("requiresOtp", true);
		response.put("emailOtpRequired", emailOtpRequired);
		response.put("mobileOtpRequired", mobileOtpRequired);
		response.put("email", admin.getEmail());
		response.put("message", buildLoginOtpMessage(emailOtpRequired, mobileOtpRequired));
		response.put("otpExpiresAt", otpExpiresAt.toEpochMilli());
		response.put("otpExpirySeconds", adminLoginOtpService.getOtpExpirySeconds());
		return response;
	}

	@PutMapping("/update/{email}")
	public ResponseEntity<String> updateByEmail(@PathVariable String email, @RequestBody AdminDto adminDto, Principal principal) {
		return adminService.updateByEmail(email, adminDto, principal);
	}
	

	@PutMapping("/updatePasswordBySuperAdmin/{adminEmailId}")
	public ResponseEntity<String> updatePasswordBySuperAdmin(@PathVariable String adminEmailId,
			@RequestBody Map<String, String> passwordInfo, Principal principal) {
		return adminService.updatePasswordBySuperAdmin(passwordInfo, adminEmailId, principal);
	}


	// introducting file server switching code for triggering the .sh confiure-file-server.sh file
	@PostMapping("/switchFileServer/{serverId}")
    public ResponseEntity<String> switchFileServer(@PathVariable Long serverId) {
        try {
            adminService.switchFileServer(serverId);
            return ResponseEntity.ok("File server switched successfully.");

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Switch failed: " + e.getMessage());
        }
    }
	
}

// Git Ignore final testing.. dm / ak / shekhar