package com.crackit.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(60000);  // 60 seconds connect timeout to accommodate Render cold-starts
        factory.setReadTimeout(120000);   // 120 seconds read timeout for long LLM generation
        return new RestTemplate(factory);
    }
}