package com.getmytix.repository;

import com.getmytix.entity.QueueEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {

    /** How many people are ahead in the queue for an event. */
    @Query("SELECT COUNT(q) FROM QueueEntry q WHERE q.event.id = :eventId AND q.queuePosition < :position")
    int countAhead(@Param("eventId") Long eventId, @Param("position") int position);

    /** Highest position in the queue so far (to compute next position). */
    @Query("SELECT COALESCE(MAX(q.queuePosition), 0) FROM QueueEntry q WHERE q.event.id = :eventId")
    int maxQueuePosition(@Param("eventId") Long eventId);
}
