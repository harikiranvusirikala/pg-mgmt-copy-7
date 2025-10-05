package com.harikiran.pgmgmt.dto;

import java.util.Date;
import java.util.List;

public record DashboardSummaryResponse(DashboardCounts counts, List<TenantSummary> topTenants,
		List<TenantSummary> paymentDueTenants) {

	public record DashboardCounts(long totalActive, long vegCount, long nonVegCount, long totalCapacity,
			long allocatedCapacity, long vacantCapacity) {
	}

	public record TenantSummary(String id, String name, String roomNo, Date renewalDate) {
	}

	public record MealStatsPoint(Date statsDate, int mealNo, long totalCount, long vegCount, long nonVegCount) {
	}

	public record AllocationStatsPoint(Date statsDate, long totalCount, long allocatedCount, long vacantCount) {
	}
}
