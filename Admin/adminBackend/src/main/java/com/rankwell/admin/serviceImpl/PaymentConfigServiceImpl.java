package com.rankwell.admin.serviceImpl;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rankwell.admin.repository.PaymentGatewayConfigRepository;
import com.rankwell.admin.services.PaymentConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import com.rankwell.admin.entity.PaymentGatewayConfig;

@Service
public class PaymentConfigServiceImpl implements PaymentConfigService {

    private static final Logger log = LoggerFactory.getLogger(PaymentConfigServiceImpl.class);

    // Lightweight read-only endpoint that requires Basic auth but creates no
    // state. count=1 keeps the payload tiny. Used purely for credential probing.
    private static final URI RAZORPAY_PROBE = URI.create("https://api.razorpay.com/v1/payments?count=1");

    @Autowired
    private PaymentGatewayConfigRepository repository;

    @Override
    public PaymentGatewayConfig saveOrUpdateConfig(PaymentGatewayConfig config) {

        PaymentGatewayConfig existingConfig = repository.findTopByOrderByIdAsc().orElse(null);

        if (existingConfig != null) {
            // Update existing config
            existingConfig.setRazorpayKey(config.getRazorpayKey());
            existingConfig.setRazorpaySecret(config.getRazorpaySecret());
            existingConfig.setIsActive(true);

            return repository.save(existingConfig);
        }

        // Save new config
        config.setIsActive(true);
        return repository.save(config);
    }

    @Override
    public PaymentGatewayConfig getConfig() {
        return repository.findTopByOrderByIdAsc().orElse(null);
    }

    @Override
    public Map<String, Object> testConnection(String razorpayKey, String razorpaySecret) {
        Map<String, Object> result = new LinkedHashMap<>();

        String key = razorpayKey != null ? razorpayKey.trim() : "";
        String secret = razorpaySecret != null ? razorpaySecret.trim() : "";

        if (key.isEmpty() || secret.isEmpty()) {
            result.put("success", false);
            result.put("httpStatus", 0);
            result.put("message", "API Key and API Secret are required to test the connection.");
            return result;
        }

        // Catch obvious mode/format errors before hitting the network so the
        // admin gets immediate feedback rather than a generic 401.
        if (!key.startsWith("rzp_test_") && !key.startsWith("rzp_live_")) {
            result.put("success", false);
            result.put("httpStatus", 0);
            result.put("message", "API Key must start with rzp_test_ or rzp_live_.");
            return result;
        }

        String basicAuth = Base64.getEncoder().encodeToString(
                (key + ":" + secret).getBytes(StandardCharsets.UTF_8));

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(RAZORPAY_PROBE)
                .timeout(Duration.ofSeconds(8))
                .header("Authorization", "Basic " + basicAuth)
                .header("Accept", "application/json")
                .GET()
                .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            String body = response.body() != null ? response.body() : "";

            if (status >= 200 && status < 300) {
                result.put("success", true);
                result.put("httpStatus", status);
                result.put("message", "Razorpay accepted these credentials. You can save the configuration.");
                log.info("Razorpay test connection OK (key={})", maskKey(key));
                return result;
            }

            String razorpayMessage = extractRazorpayMessage(body);
            result.put("success", false);
            result.put("httpStatus", status);
            if (status == 401) {
                result.put("message", "Razorpay rejected these credentials (Authentication failed). " +
                        "Regenerate the Test/Live key pair on the Razorpay Dashboard and paste BOTH values."
                        + (razorpayMessage != null ? " Razorpay said: \"" + razorpayMessage + "\"." : ""));
            } else {
                result.put("message", "Razorpay returned HTTP " + status
                        + (razorpayMessage != null ? ": \"" + razorpayMessage + "\"" : ""));
            }
            log.warn("Razorpay test connection failed (key={}, status={}): {}",
                    maskKey(key), status, razorpayMessage != null ? razorpayMessage : body);
            return result;
        } catch (Exception e) {
            result.put("success", false);
            result.put("httpStatus", 0);
            result.put("message", "Could not reach Razorpay (" + e.getClass().getSimpleName() + "): "
                    + (e.getMessage() != null ? e.getMessage() : "network error"));
            log.error("Razorpay test connection threw exception (key={}): {}", maskKey(key), e.getMessage());
            return result;
        }
    }

    private static final ObjectMapper JSON = new ObjectMapper();

    private static String extractRazorpayMessage(String body) {
        if (body == null || body.isBlank()) return null;
        try {
            JsonNode root = JSON.readTree(body);
            JsonNode err = root.path("error");
            if (err.isObject()) {
                if (err.hasNonNull("description")) return err.get("description").asText(null);
                if (err.hasNonNull("code")) return err.get("code").asText(null);
            }
        } catch (Exception ignored) {
            // Non-JSON body — fall through.
        }
        return null;
    }

    private static String maskKey(String key) {
        if (key == null || key.isEmpty()) return "(unset)";
        if (key.length() <= 12) return key;
        return key.substring(0, 12) + "***";
    }
}