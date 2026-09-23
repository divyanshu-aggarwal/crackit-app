package com.crackit.payment.dto;

import com.crackit.payment.enums.PlanType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotNull(message = "Plan type is required (MONTHLY or ANNUAL)")
    private PlanType plan;
}
