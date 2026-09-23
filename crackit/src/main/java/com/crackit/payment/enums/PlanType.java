package com.crackit.payment.enums;

public enum PlanType {
    MONTHLY(29900, "INR", 30),
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
