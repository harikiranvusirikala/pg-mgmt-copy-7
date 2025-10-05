package com.harikiran.pgmgmt.model;

import java.time.Instant;
import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "allocation_stats")
public class AllocationStats {

	@Id
	private String id;
	private Date statsDate;
	private long totalCount;
	private long allocatedCount;
	private long vacantCount;
	private Instant capturedAt;

	public AllocationStats() {
	}

	public AllocationStats(Date statsDate) {
		this.statsDate = statsDate;
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

	public long getTotalCount() {
		return totalCount;
	}

	public void setTotalCount(long totalCount) {
		this.totalCount = totalCount;
	}

	public long getAllocatedCount() {
		return allocatedCount;
	}

	public void setAllocatedCount(long allocatedCount) {
		this.allocatedCount = allocatedCount;
	}

	public long getVacantCount() {
		return vacantCount;
	}

	public void setVacantCount(long vacantCount) {
		this.vacantCount = vacantCount;
	}

	public Instant getCapturedAt() {
		return capturedAt;
	}

	public void setCapturedAt(Instant capturedAt) {
		this.capturedAt = capturedAt;
	}

}
