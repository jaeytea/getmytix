package com.getmytix.controller;

import com.getmytix.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final SeatRepository seatRepository;

    /**
     * Reset all seats to AVAILABLE state.
     * Called on app startup and when user clicks "Try Again".
     */
    @PostMapping("/reset-seats")
    public ResponseEntity<String> resetSeats() {
        int count = seatRepository.resetAllSeats();
        log.info("Reset {} seats to AVAILABLE", count);
        return ResponseEntity.ok("Reset " + count + " seats to AVAILABLE");
    }
}
