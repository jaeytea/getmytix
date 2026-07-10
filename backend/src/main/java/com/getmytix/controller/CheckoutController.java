package com.getmytix.controller;

import com.getmytix.dto.SeatDTO;
import com.getmytix.entity.Seat;
import com.getmytix.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
@Slf4j
public class CheckoutController {

    private final SeatRepository seatRepository;

    public static record LockRequest(List<Long> seatIds, String userName) {}

    public static record LockResponse(List<Long> lockedIds, List<Long> failedIds, List<SeatDTO> seats) {}

    @PostMapping("/lock-seats")
    @Transactional
    public ResponseEntity<LockResponse> lockSeats(@RequestBody LockRequest req) {
        if (req.seatIds() == null || req.seatIds().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime until = now.plusSeconds(90); // 90s TTL

        int updated = seatRepository.lockSeatsForCheckout(req.seatIds(), req.userName(), now, until);
        log.info("Requested lock of {} seats for {} — updated {} rows", req.seatIds().size(), req.userName(), updated);

        List<Seat> seats = seatRepository.findAllById(req.seatIds());
        List<SeatDTO> dtos = seats.stream()
                .map(s -> new SeatDTO(s.getId(), s.getRowLabel(), s.getSeatNumber(), s.getSeatLabel(), s.getStatus(), s.getVersion()))
                .collect(Collectors.toList());

        List<Long> lockedIds = seats.stream().filter(s -> Boolean.TRUE.equals(s.getLockedForCheckout())).map(Seat::getId).collect(Collectors.toList());
        List<Long> failedIds = req.seatIds().stream().filter(id -> !lockedIds.contains(id)).collect(Collectors.toList());

        return ResponseEntity.ok(new LockResponse(lockedIds, failedIds, dtos));
    }

    @PatchMapping("/extend-locks")
    @Transactional
    public ResponseEntity<Void> extendLocks(@RequestBody LockRequest req) {
        if (req.seatIds() == null || req.seatIds().isEmpty()) return ResponseEntity.badRequest().build();
        LocalDateTime until = LocalDateTime.now().plusSeconds(90);
        seatRepository.extendCheckoutLocks(req.seatIds(), req.userName(), until);
        return ResponseEntity.ok().build();
    }
}
