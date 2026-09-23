package com.crackit.common.exception;

import lombok.Getter;

@Getter
public class QuotaExceededException extends RuntimeException {

    private final int limit;
    private final int currentUsage;

    public QuotaExceededException(String message, int limit, int currentUsage) {
        super(message);
        this.limit = limit;
        this.currentUsage = currentUsage;
    }
}
