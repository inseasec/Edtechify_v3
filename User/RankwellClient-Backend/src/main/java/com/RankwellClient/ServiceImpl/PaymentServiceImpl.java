package com.RankwellClient.ServiceImpl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.RankwellClient.dto.RazorpayResponse;
import com.RankwellClient.entity.Payment;
import com.RankwellClient.entity.Payment.PaymentStatus;
import com.RankwellClient.entity.PaymentGatewayConfig;
import com.RankwellClient.entity.Users;
import com.RankwellClient.repository.PaymentRepository;
import com.RankwellClient.services.InvoiceService;
import com.RankwellClient.services.PaymentConfigService;
import com.RankwellClient.services.PaymentService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

@Service
public class PaymentServiceImpl implements PaymentService{
	
	@Autowired
	private PaymentRepository paymentRepository;
	
	@Autowired
	private InvoiceService invoiceService;

	@Autowired
	private PaymentConfigService paymentConfigService;

	@Override
	public String createOrder(Map<String,Object> paymentInfo) {
		 try {
	            // RazorpayClient razorpay = new RazorpayClient("rzp_test_SfJE8AacngfWrb", "7ceL8L7OJ2pu93CL9X6biavN"); // Our old account rankwell previously used one.
	
				// Akshay's account credentials for testing razorpay account.
				// test api key: rzp_test_SRmOa96nhuOlGO
				// test api secret: 4oGHUb2JLlpp4Q2U1eoBFhWP

				PaymentGatewayConfig config = paymentConfigService.getConfig();

				if (config == null) {
					throw new RuntimeException("Razorpay configuration not found. Please configure it from Admin Panel.");
				}

				String apiKey = normalizeCredential(config.getRazorpayKey());
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

	        } catch (Exception e) {
	            e.printStackTrace();
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
	            invoiceService.generateInvoice(payment);
	        }

	        return ResponseEntity.ok("Payment verified");
	}
	
	private static String normalizeCredential(String value) {
		return value != null ? value.trim() : null;
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
