package com.getmytix.repository;

import com.getmytix.entity.Seat;
import com.getmytix.entity.SeatStatus;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    /** All seats for a given event (used by seat-map endpoint). */
    List<Seat> findByEventIdOrderByRowLabelAscSeatNumberAsc(Long eventId);

    /** Count available seats for an event (used by Event list). */
    long countByEventIdAndStatus(Long eventId, SeatStatus status);

    /** Random available seats – used by BotScheduler to simulate demand. */
    @Query(value = """
        SELECT * FROM seats
        WHERE event_id = :eventId
          AND status   = 'AVAILABLE'
        ORDER BY RANDOM()
        LIMIT :limit
        """, nativeQuery = true)
    List<Seat> findRandomAvailableSeats(@Param("eventId") Long eventId,
                                        @Param("limit")   int   limit);

    /**
     * Find a seat with OPTIMISTIC locking.
     * Hibernate will add: AND version = :version to every UPDATE,
     * throwing OptimisticLockException if the row was changed by another thread.
     */
    @Lock(LockModeType.OPTIMISTIC)
    @Query("SELECT s FROM Seat s WHERE s.id = :id")
    Optional<Seat> findByIdWithOptimisticLock(@Param("id") Long id);

        /** Expire LOCKED seats older than a given time back to AVAILABLE.
         *  - For checkout locks, use lockedUntil < :now
         *  - For bot locks, use lockedAt < :expiryTime
         */
        @Modifying
        @Query("""
                UPDATE Seat s SET s.status = com.getmytix.entity.SeatStatus.AVAILABLE,
                                                    s.lockedAt = null,
                                                    s.lockedBy = null,
                                                    s.lockedUntil = null,
                                                    s.lockedForCheckout = false
                WHERE s.status = com.getmytix.entity.SeatStatus.LOCKED
                    AND (
                         (s.lockedForCheckout = true AND s.lockedUntil < :now)
                         OR (s.lockedForCheckout = false AND s.lockedAt < :expiryTime)
                    )
                """)
        int releaseStaleLocks(@Param("expiryTime") LocalDateTime expiryTime, @Param("now") LocalDateTime now);

        /** Lock available seats for checkout (atomic update). */
        @Modifying
        @Query("""
                UPDATE Seat s SET s.status = com.getmytix.entity.SeatStatus.LOCKED,
                                            s.lockedAt = :now,
                                            s.lockedBy = :user,
                                            s.lockedUntil = :until,
                                            s.lockedForCheckout = true
                WHERE s.id IN :ids
                    AND s.status = com.getmytix.entity.SeatStatus.AVAILABLE
                """)
        int lockSeatsForCheckout(@Param("ids") List<Long> ids,
                                                         @Param("user") String user,
                                                         @Param("now") LocalDateTime now,
                                                         @Param("until") LocalDateTime until);

        /** Extend checkout locks owned by a user. */
        @Modifying
        @Query("""
                UPDATE Seat s SET s.lockedUntil = :until
                WHERE s.id IN :ids
                    AND s.lockedBy = :user
                    AND s.lockedForCheckout = true
                """)
        int extendCheckoutLocks(@Param("ids") List<Long> ids,
                                                        @Param("user") String user,
                                                        @Param("until") LocalDateTime until);

@Modifying
@Transactional
@Query("""
    UPDATE Seat s SET 
        s.status = com.getmytix.entity.SeatStatus.AVAILABLE,
        s.lockedAt = null,
        s.lockedBy = null,
        s.booking = null
    WHERE s.status != com.getmytix.entity.SeatStatus.AVAILABLE
""")
int resetAllSeats();
}
