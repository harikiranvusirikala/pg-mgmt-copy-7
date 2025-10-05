package com.harikiran.pgmgmt.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Triggers daily allocation statistics snapshots to keep occupancy metrics
 * up-to-date for reporting dashboards.
 */
@Component
public class AllocationStatsScheduler {

	static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
	private static final Logger logger = LoggerFactory.getLogger(AllocationStatsScheduler.class);

	private final AllocationStatsService allocationStatsService;

	public AllocationStatsScheduler(AllocationStatsService allocationStatsService) {
		this.allocationStatsService = allocationStatsService;
	}

	/**
	 * Runs every morning at 4 AM IST to persist the previous day's allocation
	 * summary for historical tracking.
	 */
	@Scheduled(cron = "0 0 4 * * *", zone = "Asia/Kolkata")
	public void captureDailySnapshot() {
		ZonedDateTime startOfDay = LocalDate.now(IST_ZONE).atStartOfDay(IST_ZONE);
		Instant instant = startOfDay.toInstant();
		Date statsDate = Date.from(instant);

		if (logger.isDebugEnabled()) {
			logger.debug("Capturing allocation stats snapshot for date={}", statsDate);
		}

		allocationStatsService.captureSnapshot(statsDate);
	}
}
