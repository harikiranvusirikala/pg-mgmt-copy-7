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

@Component
/** Scheduled tasks that capture breakfast, lunch, and dinner meal stats. */
public class MealStatsScheduler {

	private static final Logger logger = LoggerFactory.getLogger(MealStatsScheduler.class);
	static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

	private final MealStatsService mealStatsService;

	public MealStatsScheduler(MealStatsService mealStatsService) {
		this.mealStatsService = mealStatsService;
	}

	@Scheduled(cron = "0 0 5 * * *", zone = "Asia/Kolkata")
	public void captureBreakfastSnapshot() {
		recordSnapshot(1);
	}

	@Scheduled(cron = "0 0 11 * * *", zone = "Asia/Kolkata")
	public void captureLunchSnapshot() {
		recordSnapshot(2);
	}

	@Scheduled(cron = "0 0 18 * * *", zone = "Asia/Kolkata")
	public void captureDinnerSnapshot() {
		recordSnapshot(3);
	}

	void recordSnapshot(int mealNo) {
		// create a java.util.Date representing today's start-of-day in IST
		ZonedDateTime zdt = LocalDate.now(IST_ZONE).atStartOfDay(IST_ZONE);
		Instant instant = zdt.toInstant();
		Date today = Date.from(instant);
		if (logger.isDebugEnabled()) {
			logger.debug("Capturing meal stats snapshot mealNo={} statsDate={}", mealNo, today);
		}
		mealStatsService.captureSnapshot(mealNo, today);
		if (logger.isInfoEnabled()) {
			logger.info("Recorded meal stats snapshot for meal {} on {}", mealNo, today);
		}
	}
}
