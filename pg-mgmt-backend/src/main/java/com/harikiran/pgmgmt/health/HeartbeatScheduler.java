package com.harikiran.pgmgmt.health;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class HeartbeatScheduler {
	private static final Logger log = LoggerFactory.getLogger(HeartbeatScheduler.class);

	@Scheduled(fixedRateString = "${app.heartbeat.interval-ms:600000}")
	public void heartbeat() {
		log.info("Render heartbeat at {}", Instant.now());
	}
}