package com.crackit.tracker.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class JobApplicationRequest {
    private String jobId;
    private String notes;
    private String contactPerson;
    private LocalDate appliedDate;
}