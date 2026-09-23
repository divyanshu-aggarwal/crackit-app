package com.crackit.payment.dto;

import com.crackit.payment.enums.PlanType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderResponse {

    private String orderId;

    private Integer amount;

    private String currency;

    private String keyId;

    private PlanType plan;

    private String customerName;

    private String customerEmail;

    private String customerPhone;

    private boolean mockMode;
}
