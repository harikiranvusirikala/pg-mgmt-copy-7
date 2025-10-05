package com.harikiran.pgmgmt.model;

import java.time.Instant;
import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "meal_stats")
@CompoundIndex(name = "stats_date_meal_idx", def = "{ 'statsDate': 1, 'mealNo': 1 }", unique = true)
public class MealStats {

	@Id
	private String id;
	private Date statsDate;
	private int mealNo;
	private long totalCount;
	private long vegCount;
	private long nonVegCount;
	private Instant capturedAt;

	public MealStats() {
	}

	public MealStats(Date statsDate, int mealNo) {
		this.statsDate = statsDate;
		this.mealNo = mealNo;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public Date getStatsDate() {
		return statsDate;
	}

	public void setStatsDate(Date statsDate) {
		this.statsDate = statsDate;
	}

	public int getMealNo() {
		return mealNo;
	}

	public void setMealNo(int mealNo) {
		this.mealNo = mealNo;
	}

	public long getTotalCount() {
		return totalCount;
	}

	public void setTotalCount(long totalCount) {
		this.totalCount = totalCount;
	}

	public long getVegCount() {
		return vegCount;
	}

	public void setVegCount(long vegCount) {
		this.vegCount = vegCount;
	}

	public long getNonVegCount() {
		return nonVegCount;
	}

	public void setNonVegCount(long nonVegCount) {
		this.nonVegCount = nonVegCount;
	}

	public Instant getCapturedAt() {
		return capturedAt;
	}

	public void setCapturedAt(Instant capturedAt) {
		this.capturedAt = capturedAt;
	}

}
