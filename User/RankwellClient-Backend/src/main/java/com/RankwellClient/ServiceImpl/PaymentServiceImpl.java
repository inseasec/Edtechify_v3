package com.RankwellClient.ServiceImpl;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.RankwellClient.dto.RazorpayResponse;
import com.RankwellClient.entity.Payment;
import com.RankwellClient.entity.Payment.PaymentStatus;
import com.RankwellClient.entity.PaymentGatewayConfig;
import com.RankwellClient.entity.SubscriptionPlan;
import com.RankwellClient.entity.EdukifyClient;
import com.RankwellClient.entity.Users;
import com.RankwellClient.repository.EdukifyClientRepository;
import com.RankwellClient.repository.PaymentRepository;
import com.RankwellClient.repository.SubscriptionPlanRepository;
import com.RankwellClient.services.InvoiceService;
import com.RankwellClient.services.PaymentConfigService;
import com.RankwellClient.services.PaymentService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

@Service
public class PaymentServiceImpl implements PaymentService{

	private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

	@Autowired
	private PaymentRepository paymentRepository;
	
	@Autowired
	private InvoiceService invoiceService;

	@Autowired
	private PaymentConfigService paymentConfigService;

	@Autowired
	private SubscriptionPlanRepository subscriptionPlanRepository;

	@Autowired
	private EdukifyClientRepository edukifyClientRepository;

	@Override
	public String createOrder(Map<String,Object> paymentInfo) {
		String apiKey = null;
		try {
	            // RazorpayClient razorpay = new RazorpayClient("rzp_test_SfJE8AacngfWrb", "7ceL8L7OJ2pu93CL9X6biavN"); // Our old account rankwell previously used one.
	
				// Akshay's account credentials for testing razorpay account.
				// test api key: rzp_test_SRmOa96nhuOlGO
				// test api secret: 4oGHUb2JLlpp4Q2U1eoBFhWP

				PaymentGatewayConfig config = paymentConfigService.getConfig();

				if (config == null) {
					throw new RuntimeException("Razorpay configuration not found. Please configure it from Admin Panel.");
				}

				apiKey = normalizeCredential(config.getRazorpayKey());
				String apiSecret = normalizeCredential(config.getRazorpaySecret());

				RazorpayClient razorpay = new RazorpayClient(apiKey, apiSecret);
				// RazorpayClient razorpay = new RazorpayClient("rzp_test_SRmOa96nhuOlGO", "4oGHUb2JLlpp4Q2U1eoBFhWP"); // Akshay rezerpay test account

	            int amount = Integer.parseInt(paymentInfo.get("amountStr").toString()) * 100; 

	            JSONObject options = new JSONObject();
	            options.put("amount", amount);
	            options.put("currency", "INR");
	            options.put("receipt", "txn_" + System.currentTimeMillis());
	            options.put("payment_capture", 1); 

	            Order order = razorpay.orders.create(options);

	            // Save order and other info in DB 
	            Payment payment = new Payment();
	            payment.setOrderId(order.get("id"));
	            payment.setAmount(Long.valueOf(amount)); // store amount in paise
	            payment.setStatus(PaymentStatus.CREATED);
	            payment.setCreatedOn(LocalDateTime.now());
	            
	            Long userId = Long.valueOf(paymentInfo.get("userId").toString());
	            // Long courseId = Long.valueOf(paymentInfo.get("courseId"));
	            payment.setUser(new Users(userId));
	            // payment.setCourses(new Courses(courseId));

				// Optional: subscription checkout (plan id comes from frontend)
				Object planObj = paymentInfo.get("subscriptionPlanId");
				if (planObj != null) {
					try {
						payment.setSubscriptionPlanId(Long.valueOf(planObj.toString()));
					} catch (Exception ignored) {
						// keep null if invalid
					}
				}




				// // ✅ Step 2: Service Layer Logic
				// String courseIdsStr = paymentInfo.get("courseId"); // Get courseIds from map

				// // Convert JSON string to List<Long>
				// ObjectMapper mapper = new ObjectMapper();
				// List<Long> courseIds = mapper.readValue(courseIdsStr, new TypeReference<List<Long>>() {});

				// // Fetch courses from DB
				// List<Courses> courses = courseRepository.findAllById(courseIds);
				// payment.setCourses(courses); // Set in payment


				Object courseObj = paymentInfo.get("courseId");

				List<Long> courseIds = new ArrayList<>();

				if (courseObj instanceof List<?>) {
					List<?> ids = (List<?>) courseObj;

					for (Object id : ids) {
						courseIds.add(Long.valueOf(id.toString()));
					}
				}
				// 🔥 Then save
//				List<Courses> courses = courseRepository.findAllById(courseIds);
//				payment.setCourses(courses);

	            
	            paymentRepository.save(payment);

	            return order.toString(); 

	        } catch (RazorpayException e) {
	            // Razorpay's REST API rejected the request. The most common cause we see
	            // is wrong key/secret on the dashboard (returns "Authentication failed").
	            // Log the masked key + the verbatim Razorpay message so this is greppable
	            // next time without unwinding a full stack trace.
	            log.error("Razorpay order creation rejected (key={}): {}", maskKey(apiKey), e.getMessage());
	            return "Error: " + e.getMessage();
	        } catch (Exception e) {
	            log.error("Razorpay order creation failed unexpectedly (key={}): {}", maskKey(apiKey), e.getMessage(), e);
	            return "Error: " + e.getMessage();
	        }
	}

	@Override
	public ResponseEntity<?> verifyPayment(RazorpayResponse response) {
	        String orderId = response.getOrderId() != null ? response.getOrderId().trim() : null;
	        String paymentId = response.getPaymentId() != null ? response.getPaymentId().trim() : null;
	        String signature = response.getSignature() != null ? response.getSignature().trim() : null;

	        if (orderId == null || orderId.isEmpty()
	                || paymentId == null || paymentId.isEmpty()
	                || signature == null || signature.isEmpty()) {
	            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing order id, payment id, or signature");
	        }

	        PaymentGatewayConfig config = paymentConfigService.getConfig();
	        if (config == null) {
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                    .body("Razorpay configuration not found. Please configure it from Admin Panel.");
	        }
	        String apiSecret = normalizeCredential(config.getRazorpaySecret());
	        if (apiSecret == null || apiSecret.isEmpty()) {
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Razorpay secret not configured.");
	        }

	        JSONObject attrs = new JSONObject();
	        attrs.put("razorpay_order_id", orderId);
	        attrs.put("razorpay_payment_id", paymentId);
	        attrs.put("razorpay_signature", signature);

	        boolean legitimate;
	        try {
	            legitimate = Utils.verifyPaymentSignature(attrs, apiSecret);
	        } catch (RazorpayException e) {
	            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature verification failed");
	        }

	        if (!legitimate) {
	            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
	        }

	        Payment payment = paymentRepository.findByOrderId(orderId);
	        if (payment != null) {
	            payment.setStatus(PaymentStatus.PAID);
	            payment.setPaymentId(paymentId);
	            payment.setCreatedOn(LocalDateTime.now());
	            paymentRepository.save(payment);
				try {
					invoiceService.generateInvoice(payment);
				} catch (Exception e) {
					// Payment is legitimate; do not fail verification response due to invoice settings issues.
					e.printStackTrace();
					return ResponseEntity.ok("Payment verified, but invoice generation failed: " + e.getMessage());
				}

				// Apply subscription plan limits to the launched portal (clients table).
				// Rule set:
				//   • First paid purchase (still on Trial OR null) → REPLACE the
				//     trial's expiry/storage with this plan's values (no trial
				//     bonus is carried over).
				//   • Active paid subscription (trialExpiresOn in the future) →
				//     EXTEND expiry by plan.durationDays AND ADD plan.storageLimitMb
				//     to the existing allocated storage.
				//   • Expired paid subscription → treat like first paid purchase
				//     (REPLACE), because the user has effectively lapsed and is
				//     starting a fresh active period.
				if (payment.getSubscriptionPlanId() != null && payment.getUser() != null && payment.getUser().getId() != null) {
					SubscriptionPlan plan = subscriptionPlanRepository.findById(payment.getSubscriptionPlanId()).orElse(null);
					if (plan != null) {
						EdukifyClient client = edukifyClientRepository.findByUserId(payment.getUser().getId()).orElse(null);
						if (client != null) {
							int days = plan.getDurationDays() != null && plan.getDurationDays() > 0
									? plan.getDurationDays() : 0;
							int planMb = plan.getStorageLimitMb() != null && plan.getStorageLimitMb() > 0
									? plan.getStorageLimitMb() : 0;
							LocalDate today = LocalDate.now();

							boolean hasActivePaidSubscription =
									client.getSubscription() != null
									&& !"Trial".equalsIgnoreCase(client.getSubscription())
									&& client.getTrialExpiresOn() != null
									&& !client.getTrialExpiresOn().isBefore(today);

							LocalDate newExpiry = null;
							Integer newStorageMb = null;

							if (hasActivePaidSubscription) {
								// Extend expiry by exactly the new plan's days, add storage.
								if (days > 0) {
									newExpiry = client.getTrialExpiresOn().plusDays(days);
								}
								if (planMb > 0) {
									Integer existingMb = client.getTrialLimitStorageMb();
									newStorageMb = (existingMb != null ? existingMb : 0) + planMb;
								}
							} else {
								// First paid purchase OR lapsed plan — wipe trial bonus,
								// set caps strictly to what the new plan grants.
								if (days > 0) {
									newExpiry = today.plusDays(days - 1L);
								}
								if (planMb > 0) {
									newStorageMb = planMb;
								}
							}

							// Show the most recently purchased plan name in the UIs;
							// the running caps live in trialLimitStorageMb / trialExpiresOn.
							client.setSubscription(plan.getName());
							client.setPortalAccessStatus("ACTIVE");
							client.setTrialLimitDays(days > 0 ? days : null);
							if (newStorageMb != null) {
								client.setTrialLimitStorageMb(newStorageMb);
							}
							if (newExpiry != null) {
								client.setTrialExpiresOn(newExpiry);
							}
							edukifyClientRepository.save(client);
						}
					}
				}
	        }

	        return ResponseEntity.ok("Payment verified");
	}
	
	private static String normalizeCredential(String value) {
		return value != null ? value.trim() : null;
	}

	// Razorpay key IDs like `rzp_test_SiwDl2vGkbFqhA` already aren't secret, but
	// we still mask after the mode prefix so logs are safer to share / copy-paste.
	private static String maskKey(String key) {
		if (key == null || key.isEmpty()) return "(unset)";
		if (key.length() <= 12) return key;
		return key.substring(0, 12) + "***";
	}
	
//	@Scheduled(fixedDelay  = 60000) // Every minute
    public void expireOldOrders() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
        List<Payment> oldPayments = paymentRepository.findByStatusAndCreatedOnBefore(PaymentStatus.CREATED, threshold);
        for (Payment p : oldPayments) {
            p.setStatus(PaymentStatus.EXPIRED);
            paymentRepository.save(p);
        }
    }

	

}
