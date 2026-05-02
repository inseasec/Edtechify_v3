package com.RankwellClient.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Accept Razorpay handler payload (snake_case) or camelCase from our client. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RazorpayResponse {
    private String orderId;

    private String paymentId;

    private String signature;

    public String getOrderId() {
        return orderId;
    }

    @JsonAlias({ "razorpay_order_id", "order_id" })
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getPaymentId() {
        return paymentId;
    }

    @JsonAlias({ "razorpay_payment_id", "payment_id" })
    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getSignature() {
        return signature;
    }

    @JsonAlias({ "razorpay_signature", "signature" })
    public void setSignature(String signature) {
        this.signature = signature;
    }
}
