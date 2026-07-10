package com.getmytix.service;

import com.getmytix.dto.SeatDTO;
import com.getmytix.entity.Seat;
import com.getmytix.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;

    @Transactional(readOnly = true)
    public List<SeatDTO> getSeatsForEvent(Long eventId) {
        return seatRepository
                .findByEventIdOrderByRowLabelAscSeatNumberAsc(eventId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // ─── Mapper ───────────────────────────────────────────────────────────

    SeatDTO toDTO(Seat s) {
        return new SeatDTO(
                s.getId(),
                s.getRowLabel(),
                s.getSeatNumber(),
                s.getSeatLabel(),
                s.getStatus(),
                s.getVersion()
        );
    }
}
