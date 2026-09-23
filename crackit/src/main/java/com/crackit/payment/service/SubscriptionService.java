package com.crackit.payment.service;

import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.exception.QuotaExceededException;
import com.crackit.payment.dto.SubscriptionStatusResponse;
import com.crackit.payment.enums.PlanType;
import com.crackit.payment.enums.SubscriptionTier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    public static final int FREE_AI_LIMIT = 3;

    private final UserRepository userRepository;

    public boolean isProActive(User user) {
        if (user == null || user.getSubscriptionTier() != SubscriptionTier.PRO) {
            return false;
        }

        if (user.getSubscriptionExpiresAt() != null && user.getSubscriptionExpiresAt().isBefore(LocalDateTime.now())) {
            user.setSubscriptionTier(SubscriptionTier.FREE);
            user.setSubscriptionStatus("EXPIRED");
            userRepository.save(user);
            return false;
        }

        return true;
    }

    @Transactional
    public void checkAndIncrementAiQuota(User user) {
        if (isProActive(user)) {
            return; // Unlimited usage for active Pro subscribers
        }

        int currentUsage = user.getAiUsageCount() != null ? user.getAiUsageCount() : 0;
        if (currentUsage >= FREE_AI_LIMIT) {
            throw new QuotaExceededException(
                    "You have reached your limit of " + FREE_AI_LIMIT + " free AI generations. Upgrade to Pro for unlimited AI features.",
                    FREE_AI_LIMIT,
                    currentUsage
            );
        }

        user.setAiUsageCount(currentUsage + 1);
        userRepository.save(user);
    }

    @Transactional
    public User upgradeUser(User user, PlanType plan) {
        user.setSubscriptionTier(SubscriptionTier.PRO);
        user.setSubscriptionStatus("ACTIVE");

        LocalDateTime currentExpiry = user.getSubscriptionExpiresAt();
        LocalDateTime baseTime = (currentExpiry != null && currentExpiry.isAfter(LocalDateTime.now()))
                ? currentExpiry
                : LocalDateTime.now();

        user.setSubscriptionExpiresAt(baseTime.plusDays(plan.getValidityDays()));
        return userRepository.save(user);
    }

    public SubscriptionStatusResponse getStatusResponse(User user) {
        boolean proActive = isProActive(user);
        int currentUsage = user.getAiUsageCount() != null ? user.getAiUsageCount() : 0;

        return SubscriptionStatusResponse.builder()
                .tier(user.getSubscriptionTier())
                .status(user.getSubscriptionStatus())
                .expiresAt(user.getSubscriptionExpiresAt())
                .aiUsageCount(currentUsage)
                .aiUsageLimit(proActive ? -1 : FREE_AI_LIMIT)
                .proActive(proActive)
                .message(proActive ? "Pro membership is active." : "Free tier active (" + currentUsage + "/" + FREE_AI_LIMIT + " AI credits used).")
                .build();
    }
}
