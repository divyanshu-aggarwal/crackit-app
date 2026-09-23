package com.crackit.payment.repository;

import com.crackit.payment.entity.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, String> {

    Optional<PaymentOrder> findByOrderId(String orderId);

    List<PaymentOrder> findByUserIdOrderByCreatedAtDesc(String userId);
}
