package com.harikiran.pgmgmt.health;

import java.time.Duration;
import java.time.Instant;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Custom health indicator for application-specific checks. Tracks uptime and
 * application readiness.
 */
@Component
public class ApplicationHealthIndicator implements HealthIndicator {

	private Instant startTime;
	private boolean ready = false;

	@EventListener(ApplicationReadyEvent.class)
	public void onApplicationReady() {
		this.startTime = Instant.now();
		this.ready = true;
	}

	@Override
	public Health health() {
		if (!ready) {
			return Health.outOfService().withDetail("status", "Application still starting up ⏳").build();
		}

		Duration uptime = Duration.between(startTime, Instant.now());

		return Health.up().withDetail("status", "Application ready ✅").withDetail("uptime", formatDuration(uptime))
				.withDetail("startTime", startTime.toString()).build();
	}

	private String formatDuration(Duration duration) {
		long days = duration.toDays();
		long hours = duration.toHoursPart();
		long minutes = duration.toMinutesPart();
		long seconds = duration.toSecondsPart();

		return String.format("%dd %dh %dm %ds", days, hours, minutes, seconds);
	}
}