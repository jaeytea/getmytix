package com.getmytix.service;

import com.getmytix.dto.BookingRequest;
import com.getmytix.dto.BookingResponse;
import com.getmytix.entity.*;
import com.getmytix.repository.BookingRepository;
import com.getmytix.repository.EventRepository;
import com.getmytix.repository.QueueEntryRepository;
import com.getmytix.repository.SeatRepository;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * BookingService – core of the concurrency demo.
 *
 * The key flow is:
 *   1.  Client reads seat map  (each SeatDTO includes the current @Version).
 *   2.  Client selects seats and sends  {seatId, version}  pairs.
 *   3.  We load each seat with an OPTIMISTIC lock.
 *   4.  Hibernate adds  AND version = :sentVersion  to every UPDATE.
 *   5.  If another thread booked the seat between steps 1 and 3,
 *       the version on disk will be higher → UPDATE hits 0 rows →
 *       Hibernate throws OptimisticLockException → we return 409 CONFLICT.
 *
 * This is the "demo moment" for interviews:
 *   "If I refresh the seat map in one tab and book in another,
 *    the second booking is rejected without any database-level lock."
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository    bookingRepository;
    private final SeatRepository       seatRepository;
    private final EventRepository      eventRepository;
    private final QueueEntryRepository queueEntryRepository;

    /**
     * Books seats for a user.
     *
     * @throws OptimisticLockingFailureException if any seat was modified
     *         by another transaction between the read and the write (race condition).
     * @throws IllegalStateException if a seat is already BOOKED or LOCKED.
     */
    @Transactional
    public BookingResponse bookSeats(BookingRequest req) {

        Event event = eventRepository.findById(req.eventId())
                .orElseThrow(() -> new NoSuchElementException("Event not found: " + req.eventId()));

        QueueEntry queueEntry = queueEntryRepository.findById(req.queueEntryId())
                .orElseThrow(() -> new NoSuchElementException("Queue entry not found: " + req.queueEntryId()));

        // ── Create booking shell first ──────────────────────────────────
        Booking booking = Booking.builder()
                .event(event)
                .userName(req.userName())
                .queueEntry(queueEntry)
                .totalSeats(req.seats().size())
                .build();
        booking = bookingRepository.save(booking);

        List<String> seatLabels = new ArrayList<>();

        // ── Lock + validate each seat ───────────────────────────────────
        for (BookingRequest.SeatSelection selection : req.seats()) {

            // Load with OPTIMISTIC lock
            Seat seat = seatRepository.findByIdWithOptimisticLock(selection.seatId())
                    .orElseThrow(() -> new NoSuchElementException("Seat not found: " + selection.seatId()));

            // Explicit version check (belt-and-suspenders on top of @Version)
            if (!seat.getVersion().equals(selection.version())) {
                log.warn("Version mismatch for seat {} – expected {} got {}",
                        seat.getSeatLabel(), selection.version(), seat.getVersion());
                throw new OptimisticLockingFailureException(
                        "Seat " + seat.getSeatLabel() + " was modified – please refresh");
            }

                        // Guard against non-AVAILABLE seats. Allow LOCKED seats only if lockedBy matches requester and lock not expired.
                        if (seat.getStatus() == SeatStatus.AVAILABLE) {
                                // ok
                        } else if (seat.getStatus() == SeatStatus.LOCKED) {
                                if (seat.getLockedBy() == null || !seat.getLockedBy().equals(req.userName())) {
                                        throw new IllegalStateException(
                                                        "Seat " + seat.getSeatLabel() + " is locked by another user");
                                }
                                if (seat.getLockedUntil() != null && seat.getLockedUntil().isBefore(java.time.LocalDateTime.now())) {
                                        throw new IllegalStateException(
                                                        "Lock on seat " + seat.getSeatLabel() + " has expired");
                                }
                        } else {
                                throw new IllegalStateException(
                                                "Seat " + seat.getSeatLabel() + " is no longer available (status=" + seat.getStatus() + ")");
                        }

                        // State transition: AVAILABLE/LOCKED → BOOKED
                        seat.setStatus(SeatStatus.BOOKED);
                        seat.setBooking(booking);
                        seat.setLockedAt(null);
                        seat.setLockedBy(null);
                        seat.setLockedUntil(null);
                        seat.setLockedForCheckout(false);
            seatRepository.save(seat); // @Version incremented here by Hibernate

            seatLabels.add(seat.getSeatLabel());
            log.info("Seat {} booked by {}", seat.getSeatLabel(), req.userName());
        }

        // Update queue status
        queueEntry.setStatus(QueueStatus.ADMITTED);
        queueEntryRepository.save(queueEntry);

        log.info("Booking {} confirmed for {} – seats: {}", booking.getId(), req.userName(), seatLabels);

        return new BookingResponse(
                booking.getId(),
                req.userName(),
                event.getName(),
                event.getVenue(),
                queueEntry.getQueuePosition(),
                seatLabels,
                booking.getBookedAt()
        );
    }
}
