package com.crackit.resume.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MasterResumeRequest {
    private String summary;
    private String rawResumeText;
}