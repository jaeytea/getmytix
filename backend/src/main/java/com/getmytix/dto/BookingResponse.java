package com.getmytix.dto;

import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long bookingId,
        String userName,
        String eventName,
        String venue,
        int queuePosition,
        List<String> seatLabels,
        LocalDateTime bookedAt
) {}
