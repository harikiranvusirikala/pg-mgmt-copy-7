package com.harikiran.pgmgmt.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.harikiran.pgmgmt.dto.DashboardSummaryResponse;
import com.harikiran.pgmgmt.dto.DashboardSummaryResponse.AllocationStatsPoint;
import com.harikiran.pgmgmt.dto.DashboardSummaryResponse.DashboardCounts;
import com.harikiran.pgmgmt.dto.DashboardSummaryResponse.MealStatsPoint;
import com.harikiran.pgmgmt.dto.DashboardSummaryResponse.TenantSummary;
import com.harikiran.pgmgmt.model.AllocationStats;
import com.harikiran.pgmgmt.model.MealStats;
import com.harikiran.pgmgmt.model.Tenant;
import com.harikiran.pgmgmt.repository.TenantRepository;
import com.harikiran.pgmgmt.service.AllocationStatsService.AllocationSnapshot;

@Service
/** Aggregates tenant, meal, and allocation data into dashboard view models. */
public class DashboardService {

	private final TenantRepository tenantRepository;
	private final MealStatsService mealStatsService;
	private final AllocationStatsService allocationStatsService;
	private static final Logger logger = LoggerFactory.getLogger(DashboardService.class);

	public DashboardService(TenantRepository tenantRepository, MealStatsService mealStatsService,
			AllocationStatsService allocationStatsService) {
		this.tenantRepository = tenantRepository;
		this.mealStatsService = mealStatsService;
		this.allocationStatsService = allocationStatsService;
	}

	public DashboardSummaryResponse loadDashboardSummary() {
		MealStatsService.MealSnapshot mealSnapshot = mealStatsService.computeActiveSnapshot();
		AllocationSnapshot allocationSnapshot = allocationStatsService.computeCurrentSnapshot();
		DashboardCounts counts = new DashboardCounts(mealSnapshot.totalCount(), mealSnapshot.vegCount(),
				mealSnapshot.nonVegCount(), allocationSnapshot.totalCapacity(), allocationSnapshot.allocatedCount(),
				allocationSnapshot.vacantCount());

		List<TenantSummary> topTenants = tenantRepository
				.findByContinuousStayFalseAndRoomNoNotNullAndRenewalDateNotNullOrderByRenewalDateAsc().stream()
				.map(this::mapTenantSummary).toList();

		List<TenantSummary> paymentDueTenants = tenantRepository
				.findByContinuousStayTrueAndRoomNoNotNullAndDueTrueOrderByRenewalDateAsc().stream()
				.map(this::mapTenantSummary).toList();

		if (logger.isDebugEnabled()) {
			logger.debug(
					"Dashboard summary counts totalActive={} veg={} nonVeg={} totalCapacity={} allocatedCapacity={} vacantCapacity={} topTenants={} paymentDueTenants={}",
					counts.totalActive(), counts.vegCount(), counts.nonVegCount(), counts.totalCapacity(),
					counts.allocatedCapacity(), counts.vacantCapacity(), topTenants.size(), paymentDueTenants.size());
//			paymentDueTenants.stream().limit(10)
//					.forEach(t -> logger.debug("Payment due tenant id={} name='{}' roomNo={} renewalDate={}", t.id(),
//							t.name(), t.roomNo(), t.renewalDate()));
		}

		return new DashboardSummaryResponse(counts, topTenants, paymentDueTenants);
	}

	private TenantSummary mapTenantSummary(Tenant tenant) {
		return new TenantSummary(tenant.getId(), tenant.getName(), tenant.getRoomNo(), tenant.getRenewalDate());
	}

	public List<MealStatsPoint> loadMealStatsTimeline() {
		List<MealStats> mealStats = mealStatsService.loadChronologicalStats();
		List<MealStatsPoint> points = mealStats.stream().map(this::mapMealStat).toList();
		if (logger.isDebugEnabled()) {
			logger.debug("Loaded {} meal stats points for reporting", points.size());
		}
		return points;
	}

	public List<AllocationStatsPoint> loadAllocationStatsTimeline() {
		List<AllocationStats> allocationStats = allocationStatsService.loadChronologicalStats();
		List<AllocationStatsPoint> points = allocationStats.stream().map(this::mapAllocationStat).toList();
		if (logger.isDebugEnabled()) {
			logger.debug("Loaded {} allocation stats points for reporting", points.size());
		}
		return points;
	}

	private MealStatsPoint mapMealStat(MealStats stats) {
		return new MealStatsPoint(stats.getStatsDate(), stats.getMealNo(), stats.getTotalCount(), stats.getVegCount(),
				stats.getNonVegCount());
	}

	private AllocationStatsPoint mapAllocationStat(AllocationStats stats) {
		return new AllocationStatsPoint(stats.getStatsDate(), stats.getTotalCount(), stats.getAllocatedCount(),
				stats.getVacantCount());
	}
}
