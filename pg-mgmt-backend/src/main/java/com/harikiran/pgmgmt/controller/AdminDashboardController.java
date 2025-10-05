package com.harikiran.pgmgmt.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.harikiran.pgmgmt.dto.DashboardSummaryResponse;
import com.harikiran.pgmgmt.dto.DashboardSummaryResponse.AllocationStatsPoint;
import com.harikiran.pgmgmt.dto.DashboardSummaryResponse.MealStatsPoint;
import com.harikiran.pgmgmt.service.DashboardService;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
/** Serves aggregated stats for the admin dashboard charts. */
public class AdminDashboardController {

	private final DashboardService dashboardService;

	public AdminDashboardController(DashboardService dashboardService) {
		this.dashboardService = dashboardService;
	}

	@GetMapping("/summary")
	public DashboardSummaryResponse getSummary() {
		return dashboardService.loadDashboardSummary();
	}

	@GetMapping("/meal-stats")
	public List<MealStatsPoint> getMealStats() {
		return dashboardService.loadMealStatsTimeline();
	}

	@GetMapping("/allocation-stats")
	public List<AllocationStatsPoint> getAllocationStats() {
		return dashboardService.loadAllocationStatsTimeline();
	}
}
