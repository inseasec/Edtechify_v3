package com.RankwellClient.Controller;

import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.RankwellClient.dto.FacebookAuthRequest;
import com.RankwellClient.dto.GoogleAuthRequest;
import com.RankwellClient.dto.MobileOtpSendRequest;
import com.RankwellClient.dto.MobileOtpVerifyRequest;
import com.RankwellClient.dto.OtpSendRequest;
import com.RankwellClient.dto.OtpVerifyRequest;
import com.RankwellClient.dto.PasswordResetConfirmRequest;
import com.RankwellClient.dto.PasswordResetOtpSendRequest;
import com.RankwellClient.dto.UserDto;
import com.RankwellClient.entity.Users;
import com.RankwellClient.repository.UserRepository;
import com.RankwellClient.services.FacebookAuthService;
import com.RankwellClient.services.GoogleAuthService;
import com.RankwellClient.services.OtpService;
import com.RankwellClient.services.UserService;
import com.RankwellClient.util.MobileNoUtil;

@RestController
@RequestMapping("/users")
public class UserController {
	private static final Logger log = LoggerFactory.getLogger(UserController.class);
	
	private final UserService userService ;
	private final OtpService otpService;
	private final GoogleAuthService googleAuthService;

	private final FacebookAuthService facebookAuthService;

	private final UserRepository userRepository;
	private final BCryptPasswordEncoder passwordEncoder;
	
	public UserController(UserService userService, OtpService otpService,FacebookAuthService facebookAuthService ,GoogleAuthService googleAuthService,UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
		this.userService=userService;
		this.otpService = otpService;
		this.googleAuthService = googleAuthService;
		this.facebookAuthService = facebookAuthService;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}
	
	@PostMapping("/signup")
	public ResponseEntity<?> registerUser(@RequestBody UserDto userDTO){
		String email = userDTO.getEmail() != null ? userDTO.getEmail().trim().toLowerCase() : null;
		String mobileNo = userDTO.getMobileNo() != null ? userDTO.getMobileNo().trim() : null;
		if (mobileNo != null && !mobileNo.isEmpty()) {
			try {
				mobileNo = MobileNoUtil.normalizeCompact(mobileNo, "+91");
			} catch (IllegalArgumentException e) {
				return ResponseEntity.badRequest().body(e.getMessage());
			}
		}

		if (email != null && !email.isEmpty() && userRepository.findByEmail(email).isPresent()) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Email not available for use.");
		}
		if (mobileNo != null && !mobileNo.isEmpty() && mobileExists(mobileNo)) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Mobile number not available for use.");
		}

		userDTO.setEmail(email);
		userDTO.setMobileNo(mobileNo);

		return ResponseEntity.ok(userService.registerUser(userDTO));	
	  }

	@GetMapping("/availability")
	public ResponseEntity<Map<String, Object>> availability(
			@RequestParam(required = false) String email,
			@RequestParam(required = false) String mobileNo,
			@RequestParam(required = false) Long excludeUserId) {
		String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
		String normalizedMobile = mobileNo != null ? mobileNo.trim() : "";
		boolean emailProvided = normalizedEmail != null && !normalizedEmail.isEmpty();
		boolean mobileProvided = normalizedMobile != null && !normalizedMobile.isEmpty();

		if (mobileProvided) {
			try {
				normalizedMobile = MobileNoUtil.normalizeCompact(normalizedMobile, "+91");
			} catch (IllegalArgumentException e) {
				return ResponseEntity.badRequest().body(Map.of(
						"available", false,
						"reason", "INVALID_MOBILE",
						"message", e.getMessage()
				));
			}
		}

		if (!emailProvided && !mobileProvided) {
			return ResponseEntity.badRequest().body(Map.of(
					"available", false,
					"reason", "MISSING_IDENTIFIER",
					"message", "email or mobileNo is required"
			));
		}

		if (emailProvided && emailInUseByOther(normalizedEmail, excludeUserId)) {
			return ResponseEntity.ok(Map.of(
					"available", false,
					"reason", "EMAIL_EXISTS",
					"message", "Email not available for use."
			));
		}
		if (mobileProvided && mobileInUseByOther(normalizedMobile, excludeUserId)) {
			return ResponseEntity.ok(Map.of(
					"available", false,
					"reason", "MOBILE_EXISTS",
					"message", "Mobile number not available for use."
			));
		}
		return ResponseEntity.ok(Map.of("available", true));
	}

	@PostMapping("/password/otp/send")
	public ResponseEntity<String> sendPasswordResetOtp(@RequestBody PasswordResetOtpSendRequest req) {
		String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null;
		String mobileNo = req.getMobileNo() != null ? req.getMobileNo().trim() : null;

		if (email != null && !email.isEmpty()) {
			if (userRepository.findByEmail(email).isEmpty()) {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Account not found for this email.");
			}
			try {
				otpService.sendEmailOtp(email);
				return ResponseEntity.ok("OTP sent");
			} catch (IllegalArgumentException e) {
				return ResponseEntity.badRequest().body(e.getMessage());
			} catch (IllegalStateException e) {
				return ResponseEntity.status(500).body(e.getMessage());
			} catch (MailException e) {
				log.error("Failed to send email OTP (password reset) to {}", email, e);
				String msg = e.getMessage() != null ? e.getMessage().trim() : "";
				return ResponseEntity.status(500).body(msg.isEmpty() ? "Email service error" : msg);
			} catch (Exception e) {
				return ResponseEntity.status(500).body("Failed to send OTP. Please try again.");
			}
		}

		if (mobileNo != null && !mobileNo.isEmpty()) {
			var userOpt = findUserByMobile(mobileNo);
			if (userOpt.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Account not found for this phone number.");
			}
			try {
				otpService.sendMobileOtp(mobileNo);
				return ResponseEntity.ok("OTP sent");
			} catch (IllegalArgumentException e) {
				return ResponseEntity.badRequest().body(e.getMessage());
			} catch (IllegalStateException e) {
				return ResponseEntity.status(500).body(e.getMessage());
			} catch (Exception e) {
				return ResponseEntity.status(500).body("Failed to send OTP. Please try again.");
			}
		}

		return ResponseEntity.badRequest().body("Email or phone number is required.");
	}

	@PostMapping("/password/reset")
	public ResponseEntity<String> resetPassword(@RequestBody PasswordResetConfirmRequest req) {
		String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null;
		String mobileNo = req.getMobileNo() != null ? req.getMobileNo().trim() : null;
		String otp = req.getOtp() != null ? req.getOtp().trim() : "";
		String newPassword = req.getNewPassword() != null ? req.getNewPassword() : "";

		if (newPassword.trim().length() < 6) {
			return ResponseEntity.badRequest().body("Password must be at least 6 characters.");
		}
		if (otp.isEmpty()) {
			return ResponseEntity.badRequest().body("OTP is required.");
		}

		if (email != null && !email.isEmpty()) {
			var userOpt = userRepository.findByEmail(email);
			if (userOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Account not found for this email.");
			boolean ok = otpService.verifyEmailOtp(email, otp);
			if (!ok) return ResponseEntity.badRequest().body("Invalid or expired OTP");
			Users user = userOpt.get();
			user.setPassword(passwordEncoder.encode(newPassword));
			userRepository.save(user);
			return ResponseEntity.ok("Password updated successfully");
		}

		if (mobileNo != null && !mobileNo.isEmpty()) {
			var userOpt = findUserByMobile(mobileNo);
			if (userOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Account not found for this phone number.");
			boolean ok = otpService.verifyMobileOtp(mobileNo, otp);
			if (!ok) return ResponseEntity.badRequest().body("Invalid or expired OTP");
			Users user = userOpt.get();
			user.setPassword(passwordEncoder.encode(newPassword));
			userRepository.save(user);
			return ResponseEntity.ok("Password updated successfully");
		}

		return ResponseEntity.badRequest().body("Email or phone number is required.");
	}

	@PostMapping("/otp/send")
	public ResponseEntity<String> sendEmailOtp(@RequestBody OtpSendRequest req) {
		try {
			String email = req.getEmail() == null ? null : req.getEmail().trim().toLowerCase();
			Long userId = resolveAuthenticatedUserId();
			if (userId != null && emailInUseByOther(email, userId)) {
				return ResponseEntity.status(HttpStatus.CONFLICT).body("Email not available for use.");
			}
			otpService.sendEmailOtp(req.getEmail());
			return ResponseEntity.ok("OTP sent");
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		} catch (IllegalStateException e) {
			return ResponseEntity.status(500).body(e.getMessage());
		} catch (MailException e) {
			log.error("Failed to send email OTP to {}", req != null ? req.getEmail() : null, e);
			String msg = e.getMessage() != null ? e.getMessage().trim() : "";
			return ResponseEntity.status(500).body(msg.isEmpty() ? "Email service error" : msg);
		} catch (Exception e) {
			return ResponseEntity.status(500).body("Failed to send OTP. Please try again.");
		}
	}

	@PostMapping("/otp/verify")
	public ResponseEntity<String> verifyEmailOtp(@RequestBody OtpVerifyRequest req) {
		try {
			String email = req.getEmail() == null ? null : req.getEmail().trim().toLowerCase();
			boolean ok = otpService.verifyEmailOtp(email, req.getOtp());
			if (!ok) return ResponseEntity.badRequest().body("Invalid or expired OTP");
			return ResponseEntity.ok("OTP verified");
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

	@PostMapping("/otp/mobile/send")
	public ResponseEntity<String> sendMobileOtp(@RequestBody MobileOtpSendRequest req) {
		try {
			Long userId = resolveAuthenticatedUserId();
			if (userId != null && mobileInUseByOther(req.getMobileNo(), userId)) {
				return ResponseEntity.status(HttpStatus.CONFLICT).body("Mobile number not available for use.");
			}
			otpService.sendMobileOtp(req.getMobileNo());
			return ResponseEntity.ok("OTP sent");
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		} catch (IllegalStateException e) {
			return ResponseEntity.status(500).body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(500).body("Failed to send OTP. Please try again.");
		}
	}

	@PostMapping("/otp/mobile/verify")
	public ResponseEntity<String> verifyMobileOtp(@RequestBody MobileOtpVerifyRequest req) {
		boolean ok = otpService.verifyMobileOtp(req.getMobileNo(), req.getOtp());
		if (!ok) return ResponseEntity.badRequest().body("Invalid or expired OTP");
		return ResponseEntity.ok("OTP verified");
	}
	
	@PostMapping("/signin")
	public ResponseEntity<String> loginUser(@RequestBody UserDto userDTO) {
	
	    String loginIdentifier = (userDTO.getEmail() != null && !userDTO.getEmail().isEmpty()) 
                ? userDTO.getEmail() 
                : (userDTO.getMobileNo() != null && !userDTO.getMobileNo().isEmpty())  
                      ? userDTO.getMobileNo() 
                      : null;

	    System.out.println("Login Identifier: " + loginIdentifier);
	    if (loginIdentifier == null || loginIdentifier.trim().isEmpty()) {
	    	return ResponseEntity.badRequest().body("Email or phone number is required.");
	    }

	    try {
	    	String jwtToken = userService.loginUser(loginIdentifier.trim(), userDTO.getPassword()); 
	    	return ResponseEntity.ok(jwtToken);
	    } catch (RuntimeException ex) {
	    	String msg = ex.getMessage() != null ? ex.getMessage().trim() : "";
	    	if ("Invalid password".equalsIgnoreCase(msg)) {
	    		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Wrong password");
	    	}
	    	if ("User not found".equalsIgnoreCase(msg)) {
	    		return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
	    	}
	    	if ("Account is frozen. Contact admin.".equalsIgnoreCase(msg) || msg.toLowerCase().contains("frozen")) {
	    		return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account is frozen. Contact admin.");
	    	}
	    	return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(msg.isEmpty() ? "Login failed" : msg);
	    }
	}

	@GetMapping("/oauth/google/client-id")
	public ResponseEntity<Map<String, String>> getGoogleClientId() {
		String clientId = googleAuthService.getClientId();
		if (clientId == null || clientId.isBlank()) {
			return ResponseEntity.status(404).body(Map.of("clientId", ""));
		}
		return ResponseEntity.ok(Map.of("clientId", clientId));
	}

	@PostMapping("/auth/google")
	public ResponseEntity<String> googleAuth(@RequestBody GoogleAuthRequest request) {
		String token = googleAuthService.authenticateWithIdToken(request.getIdToken());
		return ResponseEntity.ok(token);
	}

	@GetMapping("/oauth/facebook/app-id")
	public ResponseEntity<Map<String, String>> getFacebookAppId() {
		String appId = facebookAuthService.getAppId();
		if (appId == null || appId.isBlank()) {
			return ResponseEntity.status(404).body(Map.of("appId", ""));
		}
		return ResponseEntity.ok(Map.of("appId", appId));
	}

	@PostMapping("/auth/facebook")
	public ResponseEntity<String> facebookAuth(@RequestBody FacebookAuthRequest request) {
		String token = facebookAuthService.authenticateWithAccessToken(request.getAccessToken());
		return ResponseEntity.ok(token);
	}
	
	@PutMapping("/uploadImage/{userId}")
	public ResponseEntity<String> uploadUserImage(@PathVariable Long userId, @RequestParam("file") MultipartFile file){ 
		return userService.uploadUserImage(userId, file);
	  } 
	
	@GetMapping("/getUser/{userId}")
	public Users getUser(@PathVariable Long userId) {    
		return userService.getUser(userId);
	}
	
	@PutMapping("updateUserInfo/{userId}") 
	public String updateUserInfo(@PathVariable Long userId, @RequestBody UserDto userDto) {
		return userService.updateUserInfo(userId,userDto);
	}

	@PutMapping("/contact-verification/{userId}")
	public ResponseEntity<String> updateContactVerification(@PathVariable Long userId, @RequestBody UserDto userDto) {
		Long authenticatedUserId = resolveAuthenticatedUserId();
		if (authenticatedUserId == null || !authenticatedUserId.equals(userId)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not allowed to update this account.");
		}
		return mapContactVerificationStatus(userService.updateContactVerification(userId, userDto));
	}

	private Long resolveAuthenticatedUserId() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !authentication.isAuthenticated()) {
			return null;
		}
		Object principal = authentication.getPrincipal();
		if (principal instanceof User user) {
			try {
				return Long.parseLong(user.getUsername());
			} catch (NumberFormatException ignored) {
				return null;
			}
		}
		return null;
	}

	private ResponseEntity<String> mapContactVerificationStatus(String status) {
		if ("User not found".equals(status)) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(status);
		}
		if (status != null && status.contains("not available for use")) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(status);
		}
		return ResponseEntity.ok(status == null || status.isBlank() ? "Contact verification updated" : status);
	}
	
	@PutMapping("updateUserAddress/{userId}")
	public String updateUserAddress(@PathVariable Long userId, @RequestBody UserDto userDto) {
		return userService.updateUserAddress(userId, userDto);
	}
	
	@PutMapping("/updatePassword/{userId}")  
	public ResponseEntity<String> updatePassword(@PathVariable Long userId ,@RequestBody Map<String,String> passwordInfo){
		String status =  userService.updatePassword(userId, passwordInfo);
		return ResponseEntity.ok(status); 
	}

	@GetMapping("/timezones")
    public List<String> getAllTimezones() {
        return ZoneId.getAvailableZoneIds()
                .stream()
                .sorted()
                .toList();
      }

	  @GetMapping("/countries")
      public List<String> getAllCountries() {
        return Arrays.stream(Locale.getISOCountries())
                .map(code -> new Locale("", code).getDisplayCountry())
                .sorted()
                .collect(Collectors.toList());
    }

	private boolean mobileExists(String mobileNo) {
		return mobileInUseByOther(mobileNo, null);
	}

	private boolean emailInUseByOther(String email, Long excludeUserId) {
		if (email == null || email.isBlank()) {
			return false;
		}
		Optional<Users> existing = userRepository.findByEmail(email.trim().toLowerCase());
		return existing.isPresent() && (excludeUserId == null || !existing.get().getId().equals(excludeUserId));
	}

	private boolean mobileInUseByOther(String mobileNo, Long excludeUserId) {
		if (mobileNo == null || mobileNo.isBlank()) {
			return false;
		}
		for (String variant : MobileNoUtil.lookupVariants(mobileNo, "+91")) {
			Optional<Users> user = userRepository.findByMobileNo(variant);
			if (user.isPresent() && (excludeUserId == null || !user.get().getId().equals(excludeUserId))) {
				return true;
			}
		}
		return false;
	}

	private Optional<Users> findUserByMobile(String mobileNo) {
		for (String variant : MobileNoUtil.lookupVariants(mobileNo, "+91")) {
			Optional<Users> user = userRepository.findByMobileNo(variant);
			if (user.isPresent()) {
				return user;
			}
		}
		return Optional.empty();
	}

}
