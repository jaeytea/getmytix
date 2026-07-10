package com.getmytix.controller;

import com.getmytix.dto.SeatDTO;
import com.getmytix.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GET /api/events/{eventId}/seats  – returns full seat map for an event.
 *
 * The client polls this every few seconds to keep the seat map fresh.
 * Each SeatDTO includes the @Version field so the BookingService
 * can perform optimistic lock validation.
 */
@RestController
@RequestMapping("/api/events/{eventId}/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    @GetMapping
    public ResponseEntity<List<SeatDTO>> getSeats(@PathVariable Long eventId) {
        return ResponseEntity.ok(seatService.getSeatsForEvent(eventId));
    }
}
