package com.getmytix.controller;

import com.getmytix.dto.BookingRequest;
import com.getmytix.dto.BookingResponse;
import com.getmytix.repository.SeatRepository;
import com.getmytix.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/bookings  – attempt to book selected seats.
 *
 * Returns:
 *   200 OK       – booking confirmed, includes BookingResponse
 *   409 CONFLICT – optimistic lock failure (another user grabbed a seat)
 *   400 BAD REQUEST – seat no longer available (status check)
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> book(@Valid @RequestBody BookingRequest req) {
        BookingResponse response = bookingService.bookSeats(req);
        return ResponseEntity.ok(response);
    }

}

