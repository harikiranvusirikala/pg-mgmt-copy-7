package com.harikiran.pgmgmt.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.MealStats;

public interface MealStatsRepository extends MongoRepository<MealStats, String> {

	Optional<MealStats> findByStatsDateAndMealNo(Date statsDate, int mealNo);

	List<MealStats> findAllByOrderByStatsDateAscMealNoAsc();
}
