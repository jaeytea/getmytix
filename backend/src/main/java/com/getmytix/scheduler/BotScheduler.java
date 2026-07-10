package com.getmytix.scheduler;

import com.getmytix.entity.Seat;
import com.getmytix.entity.SeatStatus;
import com.getmytix.repository.EventRepository;
import com.getmytix.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

/**
 * BotScheduler – simulates high demand and concurrent writes.
 *
 * Every 4 seconds it:
 *   1.  Picks a random event.
 *   2.  Grabs N random AVAILABLE seats.
 *   3.  Attempts to LOCK them (simulating someone eyeing them).
 *   4.  After a short window, some locked seats get BOOKED.

 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BotScheduler {

    private final SeatRepository  seatRepository;
    private final EventRepository eventRepository;
    private final Random          random = new Random();

//    @Override
    @Transactional
    public void onApplicationEvent(ContextRefreshedEvent event) {
        log.info("Resetting all seats to available on startup.");

        List<Seat> resetSeats = seatRepository.findAll().stream().filter(s -> s.getStatus() != SeatStatus.AVAILABLE).toList();

        for (Seat seat : resetSeats){
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setLockedAt(null);
            seat.setLockedBy(null);
            seat.setBooking(null);
        }

        seatRepository.saveAll(resetSeats);
        log.info("Reset {} seats to AVAILABLE", resetSeats.size());
   
    }

    @Value("${app.scheduler.bot-seats-per-tick:2}")
    private int seatsPerTick;

    private static final int LOCK_TTL_SECONDS = 15;

    // Lock random seats every 1s.
    @Scheduled(fixedDelay = 1_000)
    @Transactional
    public void lockRandomSeats() {
        if (seatsPerTick == 0) return;

        var events = eventRepository.findAll();
        if (events.isEmpty()) return;

        var event = events.get(random.nextInt(events.size()));

        List<Seat> candidates = seatRepository.findRandomAvailableSeats(event.getId(), seatsPerTick);
        for (Seat seat : candidates) {
            seat.setStatus(SeatStatus.LOCKED);
            seat.setLockedAt(LocalDateTime.now());
            seat.setLockedBy("bot-" + random.nextInt(1000));
            seatRepository.save(seat);
        }

        if (!candidates.isEmpty()) {
            log.debug("Bot locked {} seats for event '{}'", candidates.size(), event.getName());
        }
    }

    /** Book some locked seats every 7 seconds (completes the race). */
    @Scheduled(fixedDelay = 7_000, initialDelay = 3_000)
    @Transactional
    public void bookLockedSeats() {
        if (seatsPerTick == 0) return;

        var events = eventRepository.findAll();
        if (events.isEmpty()) return;

        var event = events.get(random.nextInt(events.size()));

        // Fetch locked seats for this event (max 1 per tick to not drain too fast)
        List<Seat> locked = seatRepository
                .findByEventIdOrderByRowLabelAscSeatNumberAsc(event.getId())
                .stream()
                .filter(s -> s.getStatus() == SeatStatus.LOCKED)
                .limit(1)
                .toList();

        for (Seat seat : locked) {
            seat.setStatus(SeatStatus.BOOKED);
            seatRepository.save(seat);
            log.debug("Bot booked seat {} for event '{}'", seat.getSeatLabel(), event.getName());
        }
    }

    /** Release stale LOCKED seats (older than TTL) back to AVAILABLE. */
    @Scheduled(fixedDelay = 10_000, initialDelay = 5_000)
    @Transactional
    public void releaseStaleLocks() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.minusSeconds(LOCK_TTL_SECONDS);
        int released = seatRepository.releaseStaleLocks(expiry, now);
        if (released > 0) {
            log.debug("Released {} stale seat locks", released);
        }
    }
}
