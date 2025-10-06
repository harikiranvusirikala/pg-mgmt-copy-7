package com.harikiran.pgmgmt.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.MealStats;

/**
 * Repository for accessing meal preference snapshots used in reporting.
 */
public interface MealStatsRepository extends MongoRepository<MealStats, String> {

	/**
	 * Finds an existing snapshot for a given date and meal slot.
	 *
	 * @param statsDate day of the snapshot
	 * @param mealNo    meal slot number (1=breakfast, 2=lunch, 3=dinner)
	 * @return optional containing the snapshot when present
	 */
	Optional<MealStats> findByStatsDateAndMealNo(Date statsDate, int mealNo);

	/**
	 * Returns all snapshots sorted chronologically for charting purposes.
	 *
	 * @return ordered list of meal statistics
	 */
	List<MealStats> findAllByOrderByStatsDateAscMealNoAsc();
}
