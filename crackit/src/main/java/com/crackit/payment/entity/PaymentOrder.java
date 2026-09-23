package com.crackit.payment.entity;

import com.crackit.auth.entity.User;
import com.crackit.payment.enums.PaymentStatus;
import com.crackit.payment.enums.PlanType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrder {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "order_id", nullable = false, length = 100)
    private String orderId;

    @Column(name = "payment_id", length = 100)
    private String paymentId;

    @Column(name = "signature", length = 255)
    private String signature;

    @Column(nullable = false)
    private Integer amount;

    @Column(length = 10, nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private PlanType plan;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.CREATED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
