package com.getmytix.service;

import com.getmytix.dto.EventDTO;
import com.getmytix.entity.Event;
import com.getmytix.repository.EventRepository;
import com.getmytix.repository.SeatRepository;
import com.getmytix.entity.SeatStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final SeatRepository  seatRepository;

    @Transactional(readOnly = true)
    public List<EventDTO> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDTO getEvent(Long id) {
        return eventRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new NoSuchElementException("Event not found: " + id));
    }

    @Transactional
    public EventDTO createEvent(EventDTO dto) {
        Event e = Event.builder()
                .name(dto.name())
                .venue(dto.venue())
                .eventDate(dto.eventDate())
                .description(dto.description())
                .imageUrl(dto.imageUrl())
                .totalSeats(dto.totalSeats())
                .availableSeats(dto.totalSeats())
                .build();

        Event saved = eventRepository.save(e);

        // Create simple seat layout: rows of 10 seats labeled A..Z
        int total = saved.getTotalSeats();
        final int perRow = 10;
        int rows = (total + perRow - 1) / perRow;

        var seats = new java.util.ArrayList<com.getmytix.entity.Seat>(total);
        for (int r = 0; r < rows; r++) {
            char rowLabel = (char) ('A' + r);
            int seatsInThisRow = Math.min(perRow, total - r * perRow);
            for (int s = 1; s <= seatsInThisRow; s++) {
                com.getmytix.entity.Seat seat = com.getmytix.entity.Seat.builder()
                        .event(saved)
                        .rowLabel(String.valueOf(rowLabel))
                        .seatNumber(s)
                        .status(com.getmytix.entity.SeatStatus.AVAILABLE)
                        .build();
                seats.add(seat);
            }
        }

        seatRepository.saveAll(seats);

        return toDTO(saved);
    }
/*post mapping : POST /api/events/create
Content-Type: application/json
Body:
{
"id": null,
"name": "My New Event",
"venue": "Main Hall",
"eventDate": "2026-11-01T19:00:00",
"description": "Test event",
"imageUrl": "",
"totalSeats": 60,
"availableSeats": 60
}
*/

    private EventDTO toDTO(Event e) {
        long available = seatRepository.countByEventIdAndStatus(e.getId(), SeatStatus.AVAILABLE);
        return new EventDTO(
                e.getId(),
                e.getName(),
                e.getVenue(),
                e.getEventDate(),
                e.getDescription(),
                e.getImageUrl(),
                e.getTotalSeats(),
                (int) available
        );
    }
}
