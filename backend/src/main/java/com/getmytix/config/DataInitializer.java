package com.getmytix.config;

import com.getmytix.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationListener<ContextRefreshedEvent> {

    private final SeatRepository seatRepository;

    @Override
    @Transactional
    public void onApplicationEvent(ContextRefreshedEvent event) {
        log.info("=== Application Started: Resetting all seats to AVAILABLE ===");
        int count = seatRepository.resetAllSeats();
        log.info("Reset {} seats to AVAILABLE", count);
    }
}
