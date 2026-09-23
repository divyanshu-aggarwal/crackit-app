package com.crackit.payment.controller;

import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.util.AuthUtil;
import com.crackit.payment.dto.CreateOrderRequest;
import com.crackit.payment.dto.CreateOrderResponse;
import com.crackit.payment.dto.SubscriptionStatusResponse;
import com.crackit.payment.dto.VerifyPaymentRequest;
import com.crackit.payment.entity.PaymentOrder;
import com.crackit.payment.enums.PaymentStatus;
import com.crackit.payment.repository.PaymentOrderRepository;
import com.crackit.payment.service.RazorpayService;
import com.crackit.payment.service.SubscriptionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final UserRepository userRepository;
    private final RazorpayService razorpayService;
    private final SubscriptionService subscriptionService;
    private final PaymentOrderRepository paymentOrderRepository;
    private final ObjectMapper objectMapper;

    private User getLoggedInUser() {
        String email = AuthUtil.getLoggedInUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        User user = getLoggedInUser();
        CreateOrderResponse response = razorpayService.createOrder(user, request.getPlan());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<SubscriptionStatusResponse> verifyPayment(@Valid @RequestBody VerifyPaymentRequest request) {
        User user = getLoggedInUser();

        boolean verified = razorpayService.verifySignature(
                request.getOrderId(),
                request.getPaymentId(),
                request.getSignature()
        );

        if (!verified) {
            log.warn("Payment verification failed for order {}", request.getOrderId());
            throw new RuntimeException("Payment signature verification failed. Please contact support.");
        }

        PaymentOrder paymentOrder = paymentOrderRepository.findByOrderId(request.getOrderId())
                .orElse(null);

        if (paymentOrder != null) {
            paymentOrder.setPaymentId(request.getPaymentId());
            paymentOrder.setSignature(request.getSignature());
            paymentOrder.setStatus(PaymentStatus.SUCCESS);
            paymentOrderRepository.save(paymentOrder);
        }

        User upgradedUser = subscriptionService.upgradeUser(user, request.getPlan());
        SubscriptionStatusResponse statusResponse = subscriptionService.getStatusResponse(upgradedUser);
        statusResponse.setMessage("Payment verified successfully! Welcome to Crackit Pro.");

        return ResponseEntity.ok(statusResponse);
    }

    @GetMapping("/status")
    public ResponseEntity<SubscriptionStatusResponse> getSubscriptionStatus() {
        User user = getLoggedInUser();
        return ResponseEntity.ok(subscriptionService.getStatusResponse(user));
    }

    @PostMapping("/reset-tier")
    public ResponseEntity<SubscriptionStatusResponse> resetTier() {
        User user = getLoggedInUser();

        boolean isAuthorized = (user.getRole() == com.crackit.auth.enums.Role.ROLE_ADMIN) ||
                "divyanshu5981.iimt@gmail.com".equalsIgnoreCase(user.getEmail());

        if (!isAuthorized) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Unauthorized: Resetting tiers is only accessible by administrators."
            );
        }

        user.setSubscriptionTier(com.crackit.payment.enums.SubscriptionTier.FREE);
        user.setSubscriptionStatus("ACTIVE");
        user.setSubscriptionExpiresAt(null);
        user.setAiUsageCount(0);
        userRepository.save(user);

        SubscriptionStatusResponse statusResponse = subscriptionService.getStatusResponse(user);
        statusResponse.setMessage("Tier reset to Free plan with 0/3 AI credits used.");
        return ResponseEntity.ok(statusResponse);
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleRazorpayWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        log.info("Received Razorpay webhook callback");

        // 1. Verify cryptographic signature
        boolean verified = razorpayService.verifyWebhookSignature(rawBody, signature);
        if (!verified) {
            log.warn("Unauthorized webhook request: invalid or missing X-Razorpay-Signature");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "error", "message", "Invalid signature"));
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = root.path("event").asText("");
            log.info("Processing Razorpay webhook event: {}", event);

            JsonNode payloadNode = root.path("payload");

            String orderId = null;
            String paymentId = null;

            if (payloadNode.has("payment") && payloadNode.path("payment").has("entity")) {
                JsonNode paymentEntity = payloadNode.path("payment").path("entity");
                orderId = paymentEntity.path("order_id").asText(null);
                paymentId = paymentEntity.path("id").asText(null);
            }

            if (orderId == null && payloadNode.has("order") && payloadNode.path("order").has("entity")) {
                JsonNode orderEntity = payloadNode.path("order").path("entity");
                orderId = orderEntity.path("id").asText(null);
            }

            if (orderId == null) {
                log.warn("Webhook event '{}' contains no recognizable order_id. Acknowledging with skip.", event);
                return ResponseEntity.ok(Map.of("status", "ignored", "message", "No order_id found"));
            }

            PaymentOrder paymentOrder = paymentOrderRepository.findByOrderId(orderId).orElse(null);
            if (paymentOrder == null) {
                log.warn("Webhook received for unknown order_id: {}. Skipping.", orderId);
                return ResponseEntity.ok(Map.of("status", "ignored", "message", "Order not found in database"));
            }

            // 2. IDEMPOTENT PROCESSING: If order is already SUCCESS, acknowledge 200 OK without re-processing
            if ("order.paid".equals(event) || "payment.captured".equals(event)) {
                if (paymentOrder.getStatus() == PaymentStatus.SUCCESS) {
                    log.info("Order {} is already marked SUCCESS. Idempotent webhook bypass triggered.", orderId);
                    return ResponseEntity.ok(Map.of("status", "success", "message", "Order already processed"));
                }

                // Update payment order state
                paymentOrder.setStatus(PaymentStatus.SUCCESS);
                if (paymentId != null) {
                    paymentOrder.setPaymentId(paymentId);
                }
                paymentOrderRepository.save(paymentOrder);

                // Upgrade candidate account
                User user = paymentOrder.getUser();
                subscriptionService.upgradeUser(user, paymentOrder.getPlan());
                log.info("Successfully processed webhook for order {}. User {} upgraded to Pro.", orderId, user.getEmail());

                return ResponseEntity.ok(Map.of("status", "success", "message", "Payment processed and user upgraded"));
            } else if ("payment.failed".equals(event)) {
                if (paymentOrder.getStatus() != PaymentStatus.SUCCESS) {
                    paymentOrder.setStatus(PaymentStatus.FAILED);
                    if (paymentId != null) {
                        paymentOrder.setPaymentId(paymentId);
                    }
                    paymentOrderRepository.save(paymentOrder);
                    log.info("Payment failure recorded for order {}", orderId);
                }
                return ResponseEntity.ok(Map.of("status", "success", "message", "Failure recorded"));
            }

            log.info("Unhandled webhook event '{}' acknowledged", event);
            return ResponseEntity.ok(Map.of("status", "ignored", "message", "Unhandled event type"));

        } catch (Exception e) {
            log.error("Error processing webhook payload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Internal error processing webhook"));
        }
    }
}
