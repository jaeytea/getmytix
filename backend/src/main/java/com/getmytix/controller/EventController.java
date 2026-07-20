package com.getmytix.controller;

import com.getmytix.dto.CreateEventRequest;
import com.getmytix.dto.EventDTO;
import com.getmytix.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;

import static org.springframework.http.HttpStatus.FORBIDDEN;

/**
 * GET /api/events        – list all events
 * GET /api/events/{id}   – get one event
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventDTO>> listEvents() {
        System.out.println("This is list of events fetched");
        return ResponseEntity.ok(eventService.getAllEvents());

    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEvent(id));
    }

    @PostMapping("/create")
    public ResponseEntity<?> createEvent(@Valid @RequestBody CreateEventRequest req,
                                         @RequestHeader(value = "X-User-Role", required = false) String role) {
        // Simple admin gate: require header X-User-Role: ADMIN. No security framework configured.
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(FORBIDDEN).body("Missing or insufficient role (X-User-Role: ADMIN required)");
        }

        EventDTO dto = new EventDTO(
                null,
                req.getName(),
                req.getVenue(),
                req.getEventDate(),
                req.getDescription(),
                req.getImageUrl(),
                req.getTotalSeats(),
                req.getTotalSeats()
        );

        EventDTO created = eventService.createEvent(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
