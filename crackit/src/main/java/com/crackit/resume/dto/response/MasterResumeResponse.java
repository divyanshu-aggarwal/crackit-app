package com.crackit.resume.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MasterResumeResponse {

    private String id;

    private String summary;

    private String rawResumeText;
}