package com.getmytix.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record JoinQueueRequest(
        @NotNull(message = "eventId is required")
        Long eventId,

        @NotBlank(message = "userName is required")
        String userName
) {}
