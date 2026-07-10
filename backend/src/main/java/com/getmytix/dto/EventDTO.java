package com.getmytix.dto;

import java.time.LocalDateTime;

public record EventDTO(
        Long id,
        String name,
        String venue,
        LocalDateTime eventDate,
        String description,
        String imageUrl,
        int totalSeats,
        int availableSeats
) {}
