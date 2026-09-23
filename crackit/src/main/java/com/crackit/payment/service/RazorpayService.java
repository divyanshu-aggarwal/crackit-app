package com.crackit.payment.service;

import com.crackit.auth.entity.User;
import com.crackit.payment.dto.CreateOrderResponse;
import com.crackit.payment.entity.PaymentOrder;
import com.crackit.payment.enums.PaymentStatus;
import com.crackit.payment.enums.PlanType;
import com.crackit.payment.repository.PaymentOrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.key.id:}")
    private String keyId;

    @Value("${razorpay.key.secret:}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    @Value("${razorpay.mock-mode:true}")
    private boolean mockMode;

    private static final String RAZORPAY_API_URL = "https://api.razorpay.com/v1/orders";

    public boolean isMockMode() {
        return mockMode || keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank();
    }

    public String getKeyId() {
        return isMockMode() ? "rzp_test_mock_crackit" : keyId;
    }

    @Transactional
    public CreateOrderResponse createOrder(User user, PlanType plan) {
        String orderId;
        boolean currentlyMocking = isMockMode();

        if (currentlyMocking) {
            orderId = "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            log.info("Generating mock Razorpay order {} for user {}", orderId, user.getEmail());
        } else {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                String auth = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
                headers.set("Authorization", "Basic " + auth);

                Map<String, Object> body = new HashMap<>();
                body.put("amount", plan.getAmountInPaise());
                body.put("currency", plan.getCurrency());
                body.put("receipt", "rcpt_" + System.currentTimeMillis());
                body.put("notes", Map.of("userId", user.getId(), "plan", plan.name()));

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(RAZORPAY_API_URL, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    orderId = root.get("id").asText();
                } else {
                    throw new RuntimeException("Failed to create order on Razorpay");
                }
            } catch (Exception e) {
                log.warn("Failed calling live Razorpay API, falling back to mock mode: {}", e.getMessage());
                currentlyMocking = true;
                orderId = "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            }
        }

        PaymentOrder paymentOrder = PaymentOrder.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .orderId(orderId)
                .amount(plan.getAmountInPaise())
                .currency(plan.getCurrency())
                .plan(plan)
                .status(PaymentStatus.CREATED)
                .build();

        paymentOrderRepository.save(paymentOrder);

        return CreateOrderResponse.builder()
                .orderId(orderId)
                .amount(plan.getAmountInPaise())
                .currency(plan.getCurrency())
                .keyId(currentlyMocking ? "rzp_test_mock_crackit" : keyId)
                .plan(plan)
                .customerName(user.getFullName())
                .customerEmail(user.getEmail())
                .customerPhone(user.getPhone() != null ? user.getPhone() : "")
                .mockMode(currentlyMocking)
                .build();
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        if (orderId == null || orderId.startsWith("order_mock_") || isMockMode()) {
            return true;
        }

        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String generatedSignature = HexFormat.of().formatHex(hash);

            return MessageDigest.isEqual(
                    generatedSignature.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    public boolean verifyWebhookSignature(String rawPayload, String signature) {
        if (signature == null || signature.isBlank()) {
            log.warn("Webhook signature header (X-Razorpay-Signature) is missing");
            return false;
        }

        if (isMockMode() && "mock_webhook_signature".equals(signature)) {
            log.info("Mock webhook signature accepted");
            return true;
        }

        String secretToUse = (webhookSecret != null && !webhookSecret.isBlank()) ? webhookSecret : keySecret;
        if (secretToUse == null || secretToUse.isBlank()) {
            log.error("Neither razorpay.webhook-secret nor razorpay.key.secret is configured for webhook verification");
            return false;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretToUse.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            String generatedSignature = HexFormat.of().formatHex(hash);

            boolean matches = MessageDigest.isEqual(
                    generatedSignature.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );

            if (!matches) {
                log.warn("Webhook signature mismatch. Expected: {}, Received: {}", generatedSignature, signature);
            }
            return matches;
        } catch (Exception e) {
            log.error("Webhook signature verification error: {}", e.getMessage());
            return false;
        }
    }
}
