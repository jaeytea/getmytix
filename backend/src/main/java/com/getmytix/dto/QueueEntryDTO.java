package com.getmytix.dto;

import com.getmytix.entity.QueueStatus;

import java.time.LocalDateTime;

public record QueueEntryDTO(
        Long id,
        Long eventId,
        String userName,
        int queuePosition,
        int aheadCount,
        LocalDateTime joinedAt,
        QueueStatus status,
        int estimatedWaitSeconds
) {}
