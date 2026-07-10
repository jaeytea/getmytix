package com.getmytix.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Payload the client sends to POST /api/bookings
 */
public record BookingRequest(

        @NotNull(message = "eventId is required")
        Long eventId,

        @NotBlank(message = "userName is required")
        String userName,

        @NotNull(message = "queueEntryId is required")
        Long queueEntryId,

        /**
         * List of {seatId, version} pairs.
         * The version is read from the seat map and sent back here
         * so the server can validate optimistic lock integrity.
         */
        @NotEmpty(message = "At least one seat must be selected")
        List<SeatSelection> seats
) {
    public record SeatSelection(
            @NotNull Long seatId,
            @NotNull Long version
    ) {}
}
