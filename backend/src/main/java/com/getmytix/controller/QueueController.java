package com.getmytix.controller;

import com.getmytix.dto.JoinQueueRequest;
import com.getmytix.dto.QueueEntryDTO;
import com.getmytix.service.QueueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/queue/join          – join the queue for an event
 * GET  /api/queue/{id}/status   – poll queue position & wait time
 * POST /api/queue/{id}/admit    – advance user to seat selection
 */
@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    @PostMapping("/join")
    public ResponseEntity<QueueEntryDTO> joinQueue(@Valid @RequestBody JoinQueueRequest req) {
        return ResponseEntity.ok(queueService.joinQueue(req));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<QueueEntryDTO> getStatus(@PathVariable Long id) {
        return ResponseEntity.ok(queueService.getQueueStatus(id));
    }

    @PostMapping("/{id}/admit")
    public ResponseEntity<QueueEntryDTO> admit(@PathVariable Long id) {
        return ResponseEntity.ok(queueService.admitUser(id));
    }
}
