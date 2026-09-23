package com.crackit.payment.dto;

import com.crackit.payment.enums.SubscriptionTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionStatusResponse {

    private SubscriptionTier tier;

    private String status;

    private LocalDateTime expiresAt;

    private Integer aiUsageCount;

    private Integer aiUsageLimit;

    private boolean proActive;

    private String message;
}
