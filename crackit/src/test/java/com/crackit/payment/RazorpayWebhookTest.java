package com.crackit.payment;

import com.crackit.auth.entity.User;
import com.crackit.payment.controller.PaymentController;
import com.crackit.payment.entity.PaymentOrder;
import com.crackit.payment.enums.PaymentStatus;
import com.crackit.payment.enums.PlanType;
import com.crackit.payment.repository.PaymentOrderRepository;
import com.crackit.payment.service.RazorpayService;
import com.crackit.payment.service.SubscriptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RazorpayWebhookTest {

    @Mock
    private PaymentOrderRepository paymentOrderRepository;

    @Mock
    private SubscriptionService subscriptionService;

    private RazorpayService razorpayService;

    private PaymentController paymentController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String testWebhookSecret = "test_webhook_secret_xyz123";

    @BeforeEach
    void setUp() {
        razorpayService = new RazorpayService(paymentOrderRepository, null, objectMapper);
        ReflectionTestUtils.setField(razorpayService, "webhookSecret", testWebhookSecret);
        ReflectionTestUtils.setField(razorpayService, "mockMode", false);

        paymentController = new PaymentController(
                null,
                razorpayService,
                subscriptionService,
                paymentOrderRepository,
                objectMapper
        );
    }

    private String calculateHmac(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("Should successfully verify a valid HMAC-SHA256 webhook signature")
    void testValidWebhookSignature() throws Exception {
        String payload = "{\"event\":\"order.paid\",\"payload\":{\"order\":{\"entity\":{\"id\":\"order_123\"}}}}";
        String validSignature = calculateHmac(payload, testWebhookSecret);

        boolean verified = razorpayService.verifyWebhookSignature(payload, validSignature);
        assertTrue(verified, "Signature should be valid when HMAC matches");
    }

    @Test
    @DisplayName("Should reject tampered webhook payload or incorrect signature")
    void testTamperedWebhookSignature() throws Exception {
        String payload = "{\"event\":\"order.paid\",\"payload\":{\"order\":{\"entity\":{\"id\":\"order_123\"}}}}";
        String fakeSignature = "deadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678";

        boolean verified = razorpayService.verifyWebhookSignature(payload, fakeSignature);
        assertFalse(verified, "Signature must be rejected when payload/key does not match");
    }

    @Test
    @DisplayName("Should reject webhook request when signature is missing")
    void testMissingWebhookSignature() {
        String payload = "{\"event\":\"order.paid\"}";
        boolean verified = razorpayService.verifyWebhookSignature(payload, null);
        assertFalse(verified, "Null signature must be rejected");
    }

    @Test
    @DisplayName("Should process order.paid webhook, update order to SUCCESS, and upgrade user")
    void testSuccessfulOrderPaidProcessing() throws Exception {
        String orderId = "order_test_abc123";
        String paymentId = "pay_test_xyz789";

        String payload = String.format("""
                {
                  "event": "order.paid",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "%s",
                        "order_id": "%s",
                        "status": "captured"
                      }
                    }
                  }
                }
                """, paymentId, orderId);

        String signature = calculateHmac(payload, testWebhookSecret);

        User mockUser = User.builder().id("user-1").email("candidate@example.com").build();
        PaymentOrder order = PaymentOrder.builder()
                .id("po-1")
                .orderId(orderId)
                .status(PaymentStatus.CREATED)
                .plan(PlanType.MONTHLY)
                .user(mockUser)
                .build();

        when(paymentOrderRepository.findByOrderId(orderId)).thenReturn(Optional.of(order));

        ResponseEntity<Map<String, Object>> response = paymentController.handleRazorpayWebhook(payload, signature);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("success", response.getBody().get("status"));
        assertEquals(PaymentStatus.SUCCESS, order.getStatus());
        assertEquals(paymentId, order.getPaymentId());

        verify(paymentOrderRepository, times(1)).save(order);
        verify(subscriptionService, times(1)).upgradeUser(mockUser, PlanType.MONTHLY);
    }

    @Test
    @DisplayName("Should handle duplicate webhooks idempotently without double upgrading")
    void testIdempotentDuplicateWebhook() throws Exception {
        String orderId = "order_already_processed_999";
        String payload = String.format("""
                {
                  "event": "order.paid",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "pay_999",
                        "order_id": "%s"
                      }
                    }
                  }
                }
                """, orderId);

        String signature = calculateHmac(payload, testWebhookSecret);

        User mockUser = User.builder().id("user-1").email("candidate@example.com").build();
        PaymentOrder existingSuccessfulOrder = PaymentOrder.builder()
                .id("po-999")
                .orderId(orderId)
                .status(PaymentStatus.SUCCESS) // Already success!
                .plan(PlanType.MONTHLY)
                .user(mockUser)
                .build();

        when(paymentOrderRepository.findByOrderId(orderId)).thenReturn(Optional.of(existingSuccessfulOrder));

        ResponseEntity<Map<String, Object>> response = paymentController.handleRazorpayWebhook(payload, signature);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Order already processed", response.getBody().get("message"));

        // Crucial Idempotency Assertions: save() and upgradeUser() should NOT be called again!
        verify(paymentOrderRepository, never()).save(any(PaymentOrder.class));
        verify(subscriptionService, never()).upgradeUser(any(), any());
    }

    @Test
    @DisplayName("Should reject webhook with 400 Bad Request if signature verification fails")
    void testControllerRejectsBadSignature() {
        String payload = "{\"event\":\"order.paid\"}";
        String badSignature = "invalid_signature";

        ResponseEntity<Map<String, Object>> response = paymentController.handleRazorpayWebhook(payload, badSignature);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("error", response.getBody().get("status"));
        verifyNoInteractions(paymentOrderRepository);
        verifyNoInteractions(subscriptionService);
    }
}
