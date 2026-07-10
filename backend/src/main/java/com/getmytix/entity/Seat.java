package com.getmytix.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * The @Version field is the heart of the concurrency demo.
 *
 * How it works:
 *   1.  Thread A reads seat (version=3, status=AVAILABLE).
 *   2.  Thread B also reads the same seat  (version=3, status=AVAILABLE).
 *   3.  Thread A writes:  UPDATE seats SET status='BOOKED', version=4 WHERE id=? AND version=3  → succeeds.
 *   4.  Thread B writes:  UPDATE seats SET status='BOOKED', version=4 WHERE id=? AND version=3  → 0 rows affected.
 *   5.  Hibernate detects 0 rows → throws OptimisticLockException.
 *   6.  Service layer catches this and returns a 409 CONFLICT to the client.
 *
 * This prevents double-booking without pessimistic row-level locks.
 */
@Entity
@Table(
    name = "seats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "row_label", "seat_number"})
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "row_label", nullable = false, length = 4)
    private String rowLabel;

    @Column(name = "seat_number", nullable = false)
    private int seatNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SeatStatus status = SeatStatus.AVAILABLE;

    /**
     * Optimistic locking version.
     * Hibernate automatically increments this on every UPDATE
     * and adds  AND version = :expected  to the WHERE clause.
     */
    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "locked_by")
    private String lockedBy;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "locked_for_checkout")
    private Boolean lockedForCheckout;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    // ─── Helpers ──────────────────────────────────────────────────────────

    public String getSeatLabel() {
        return rowLabel + seatNumber;
    }

    public boolean isAvailable() {
        return status == SeatStatus.AVAILABLE;
    }
}
