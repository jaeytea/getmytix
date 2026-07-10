package com.getmytix.dto;

import com.getmytix.entity.SeatStatus;

public record SeatDTO(
        Long id,
        String rowLabel,
        int seatNumber,
        String seatLabel,
        SeatStatus status,
        Long version
) {}
