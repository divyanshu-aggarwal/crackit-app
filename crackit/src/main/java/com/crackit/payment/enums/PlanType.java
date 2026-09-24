package com.crackit.payment.enums;

public enum PlanType {
    TRIAL_7_DAYS(9900, "INR", 7),
    MONTHLY(29900, "INR", 30),
    THREE_MONTHS(59900, "INR", 90),
    ANNUAL(199900, "INR", 365);

    private final int amountInPaise;
    private final String currency;
    private final int validityDays;

    PlanType(int amountInPaise, String currency, int validityDays) {
        this.amountInPaise = amountInPaise;
        this.currency = currency;
        this.validityDays = validityDays;
    }

    public int getAmountInPaise() {
        return amountInPaise;
    }

    public String getCurrency() {
        return currency;
    }

    public int getValidityDays() {
        return validityDays;
    }
}
