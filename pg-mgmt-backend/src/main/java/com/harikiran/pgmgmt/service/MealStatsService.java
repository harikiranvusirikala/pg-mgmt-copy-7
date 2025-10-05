package com.harikiran.pgmgmt.service;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.harikiran.pgmgmt.model.MealStats;
import com.harikiran.pgmgmt.model.Tenant;
import com.harikiran.pgmgmt.repository.MealStatsRepository;
import com.harikiran.pgmgmt.repository.TenantRepository;

@Service
/** Calculates and persists meal preference statistics for reporting. */
public class MealStatsService {

	private final TenantRepository tenantRepository;
	private final MealStatsRepository mealStatsRepository;
	private static final Logger logger = LoggerFactory.getLogger(MealStatsService.class);

	public MealStatsService(TenantRepository tenantRepository, MealStatsRepository mealStatsRepository) {
		this.tenantRepository = tenantRepository;
		this.mealStatsRepository = mealStatsRepository;
	}

	public MealSnapshot captureSnapshot(int mealNo, Date statsDate) {
		MealSnapshot snapshot = computeActiveSnapshot();
		MealStats stats = mealStatsRepository.findByStatsDateAndMealNo(statsDate, mealNo)
				.orElseGet(() -> new MealStats(statsDate, mealNo));

		stats.setTotalCount(snapshot.totalCount());
		stats.setVegCount(snapshot.vegCount());
		stats.setNonVegCount(snapshot.nonVegCount());
		stats.setCapturedAt(Instant.now());

		mealStatsRepository.save(stats);
		if (logger.isDebugEnabled()) {
			logger.debug("Captured meal snapshot mealNo={} statsDate={} total={} veg={} nonVeg={} recordId={}", mealNo,
					statsDate, snapshot.totalCount(), snapshot.vegCount(), snapshot.nonVegCount(), stats.getId());
		}
		return snapshot;
	}

	public MealSnapshot computeActiveSnapshot() {
		List<Tenant> activeTenants = tenantRepository.findByIsActiveTrueAndRoomNoNotNull();

		long total = activeTenants.size();
		long veg = activeTenants.stream().filter(this::isVegPreference).count();
		long nonVeg = total - veg;

		if (logger.isDebugEnabled()) {
			logger.debug("Computed active snapshot totals total={} veg={} nonVeg={}", total, veg, nonVeg);
		}

		return new MealSnapshot(total, veg, nonVeg);
	}

	public List<MealStats> loadChronologicalStats() {
		List<MealStats> stats = mealStatsRepository.findAllByOrderByStatsDateAscMealNoAsc();
		if (logger.isDebugEnabled()) {
			logger.debug("Loaded {} meal stats records", stats.size());
		}
		return stats;
	}

	private boolean isVegPreference(Tenant tenant) {
		String preference = tenant.getMealPreference();
		if (preference == null) {
			return false;
		}

		String normalized = preference.toLowerCase(Locale.ROOT).replace(" ", "").replace("-", "");
		return normalized.equals("veg") || normalized.equals("vegetarian");
	}

	public record MealSnapshot(long totalCount, long vegCount, long nonVegCount) {
	}
}
