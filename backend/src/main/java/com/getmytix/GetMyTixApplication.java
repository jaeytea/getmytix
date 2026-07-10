package com.getmytix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * GetMyTix – MVP entry point.
 *
 * Architecture: modular monolith
 *   controller  →  service  →  repository  →  JPA / PostgreSQL
 *
 * Key demo concepts:
 *   • Optimistic locking via @Version on Seat
 *   • Race-condition simulation via scheduled BotScheduler
 *   • Seat-state machine: AVAILABLE → LOCKED → BOOKED
 */
@SpringBootApplication
@EnableScheduling
public class GetMyTixApplication {

    public static void main(String[] args) {
        SpringApplication.run(GetMyTixApplication.class, args);
    }
}
