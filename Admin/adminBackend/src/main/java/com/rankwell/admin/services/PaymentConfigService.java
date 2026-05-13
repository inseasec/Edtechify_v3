package com.rankwell.admin.services;

import java.util.Map;

import com.rankwell.admin.entity.PaymentGatewayConfig;

public interface PaymentConfigService {

    PaymentGatewayConfig saveOrUpdateConfig(PaymentGatewayConfig config);

    PaymentGatewayConfig getConfig();

    /**
     * Validate a Razorpay key/secret pair by hitting Razorpay's API directly.
     * Returns a JSON-friendly map: {success, httpStatus, message}.
     * Never mutates DB; used by the "Test Connection" admin button.
     */
    Map<String, Object> testConnection(String razorpayKey, String razorpaySecret);
}

 
