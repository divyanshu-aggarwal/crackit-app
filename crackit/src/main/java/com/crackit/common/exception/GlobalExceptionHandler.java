package com.crackit.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(QuotaExceededException.class)
    public ResponseEntity<?> handleQuotaExceededException(QuotaExceededException ex) {

        return ResponseEntity
                .status(HttpStatus.PAYMENT_REQUIRED)
                .body(Map.of(
                        "timestamp", LocalDateTime.now(),
                        "error", "QUOTA_EXCEEDED",
                        "message", ex.getMessage(),
                        "limit", ex.getLimit(),
                        "currentUsage", ex.getCurrentUsage(),
                        "upgradeRequired", true
                ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "timestamp", LocalDateTime.now(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception ex) {

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "timestamp", LocalDateTime.now(),
                        "message", "Something went wrong"
                ));
    }
}