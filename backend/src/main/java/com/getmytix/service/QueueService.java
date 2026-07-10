package com.getmytix.service;

import com.getmytix.dto.JoinQueueRequest;
import com.getmytix.dto.QueueEntryDTO;
import com.getmytix.entity.Event;
import com.getmytix.entity.QueueEntry;
import com.getmytix.entity.QueueStatus;
import com.getmytix.repository.EventRepository;
import com.getmytix.repository.QueueEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class QueueService {

    private static final int  SECONDS_PER_POSITION = 3; // simulated wait
    private static final int  MAX_EXTRA_POSITION   = 50;

    private final QueueEntryRepository queueEntryRepository;
    private final EventRepository      eventRepository;
    private final Random               random = new Random();

    /**
     * Assigns a random queue position to the user.
     *
     * In a real system this would be a fair FIFO queue backed by Redis.
     * Here we simulate "high demand" by randomly placing the user
     * anywhere in a range: current max + 1  to  current max + 50.
     */
    @Transactional
    public QueueEntryDTO joinQueue(JoinQueueRequest req) {
        Event event = eventRepository.findById(req.eventId())
                .orElseThrow(() -> new NoSuchElementException("Event not found: " + req.eventId()));

        int currentMax = queueEntryRepository.maxQueuePosition(req.eventId());
        int position   = currentMax + 1 + random.nextInt(MAX_EXTRA_POSITION);

        QueueEntry entry = QueueEntry.builder()
                .event(event)
                .userName(req.userName())
                .queuePosition(position)
                .status(QueueStatus.WAITING)
                .build();

        entry = queueEntryRepository.save(entry);
        return toDTO(entry);
    }

    @Transactional(readOnly = true)
    public QueueEntryDTO getQueueStatus(Long queueEntryId) {
        QueueEntry entry = queueEntryRepository.findById(queueEntryId)
                .orElseThrow(() -> new NoSuchElementException("Queue entry not found: " + queueEntryId));
        return toDTO(entry);
    }

    /**
     * Admits the user to the seat-selection screen.
     * Sets status = ADMITTED so the frontend knows to redirect.
     */
    @Transactional
    public QueueEntryDTO admitUser(Long queueEntryId) {
        QueueEntry entry = queueEntryRepository.findById(queueEntryId)
                .orElseThrow(() -> new NoSuchElementException("Queue entry not found: " + queueEntryId));
        entry.setStatus(QueueStatus.ADMITTED);
        return toDTO(queueEntryRepository.save(entry));
    }

    // ─── Mapper ───────────────────────────────────────────────────────────

    private QueueEntryDTO toDTO(QueueEntry q) {
        int ahead = queueEntryRepository.countAhead(q.getEvent().getId(), q.getQueuePosition());
        int waitSecs = Math.max(0, ahead) * SECONDS_PER_POSITION;
        return new QueueEntryDTO(
                q.getId(),
                q.getEvent().getId(),
                q.getUserName(),
                q.getQueuePosition(),
                ahead,
                q.getJoinedAt(),
                q.getStatus(),
                waitSecs
        );
    }
}
