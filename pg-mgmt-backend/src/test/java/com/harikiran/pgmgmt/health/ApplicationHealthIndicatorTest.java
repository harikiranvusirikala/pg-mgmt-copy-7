package com.harikiran.pgmgmt.health;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.boot.context.event.ApplicationReadyEvent;

/**
 * Tests for ApplicationHealthIndicator to ensure uptime tracking works.
 */
class ApplicationHealthIndicatorTest {

    private ApplicationHealthIndicator healthIndicator;

    @BeforeEach
    void setUp() {
        healthIndicator = new ApplicationHealthIndicator();
    }

    @Test
    void health_whenNotReady_returnsOutOfService() {
        Health health = healthIndicator.health();
        
        assertThat(health.getStatus()).isEqualTo(Status.OUT_OF_SERVICE);
        assertThat(health.getDetails()).containsEntry("status", "Application still starting up ⏳");
    }

    @Test
    void health_whenReady_returnsUp() throws InterruptedException {
        // Simulate application ready event
        healthIndicator.onApplicationReady();
        
        // Small delay to ensure uptime > 0
        Thread.sleep(100);
        
        Health health = healthIndicator.health();
        
        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails())
            .containsEntry("status", "Application ready ✅")
            .containsKeys("uptime", "startTime");
    }
}