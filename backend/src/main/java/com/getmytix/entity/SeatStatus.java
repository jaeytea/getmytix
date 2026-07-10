package com.getmytix.entity;

/**
 * Seat state machine:
 *
 *   AVAILABLE  ──book()──►  BOOKED
 *       │                      ▲
 *       └──lock()──►  LOCKED ──┘
 *
 * LOCKED is a short-lived transient state used by the
 * BotScheduler to simulate demand.  It auto-expires after
 * a configurable TTL so the UI can show "someone is eyeing this seat".
 */
public enum SeatStatus {
    AVAILABLE,
    LOCKED,
    BOOKED
}
