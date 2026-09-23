package com.crackit.tracker.dto;

import com.crackit.tracker.enums.ApplicationStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateStatusRequest {
    private ApplicationStatus status;
    private String notes;
    private String contactPerson;
    private LocalDate appliedDate;
}