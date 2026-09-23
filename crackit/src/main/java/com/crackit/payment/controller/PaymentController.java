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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final UserRepository userRepository;
    private final RazorpayService razorpayService;
    private final SubscriptionService subscriptionService;
    private final PaymentOrderRepository paymentOrderRepository;

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
}
