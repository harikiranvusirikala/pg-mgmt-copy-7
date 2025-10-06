package com.harikiran.pgmgmt.service;

import java.time.Instant;
import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.harikiran.pgmgmt.model.AllocationStats;
import com.harikiran.pgmgmt.model.Room;
import com.harikiran.pgmgmt.repository.AllocationStatsRepository;
import com.harikiran.pgmgmt.repository.RoomRepository;

/**
 * Tracks room capacity allocation metrics and persists daily snapshots for the
 * admin dashboard.
 */
@Service
public class AllocationStatsService {

	private static final Logger logger = LoggerFactory.getLogger(AllocationStatsService.class);

	private final RoomRepository roomRepository;
	private final AllocationStatsRepository allocationStatsRepository;

	/**
	 * Creates a new service that aggregates room allocation metrics.
	 *
	 * @param roomRepository             repository providing room details
	 * @param allocationStatsRepository  repository for persisting allocation snapshots
	 */
	public AllocationStatsService(RoomRepository roomRepository, AllocationStatsRepository allocationStatsRepository) {
		this.roomRepository = roomRepository;
		this.allocationStatsRepository = allocationStatsRepository;
	}

	/**
	 * Calculates the current allocation totals across all rooms.
	 *
	 * @return snapshot containing total, allocated and vacant bed counts
	 */
	public AllocationSnapshot computeCurrentSnapshot() {
		List<Room> rooms = roomRepository.findAll();

		long totalCapacity = rooms.stream().mapToLong(Room::getCapacity).sum();
		long allocated = rooms.stream().mapToLong(Room::getAllocatedCount).sum();
		long vacant = Math.max(totalCapacity - allocated, 0);

		if (logger.isDebugEnabled()) {
			logger.debug("Computed allocation snapshot totals total={} allocated={} vacant={}", totalCapacity,
					allocated, vacant);
		}

		return new AllocationSnapshot(totalCapacity, allocated, vacant);
	}

	/**
	 * Computes the allocation snapshot for the supplied date and persists it, updating
	 * the existing record when one already exists.
	 *
	 * @param statsDate date for which the snapshot should be captured
	 * @return persisted allocation statistics
	 */
	public AllocationStats captureSnapshot(Date statsDate) {
		AllocationSnapshot snapshot = computeCurrentSnapshot();

		AllocationStats stats = allocationStatsRepository.findByStatsDate(statsDate)
				.orElseGet(() -> new AllocationStats(statsDate));

		stats.setTotalCount(snapshot.totalCapacity());
		stats.setAllocatedCount(snapshot.allocatedCount());
		stats.setVacantCount(snapshot.vacantCount());
		stats.setCapturedAt(Instant.now());

		AllocationStats saved = allocationStatsRepository.save(stats);

		if (logger.isInfoEnabled()) {
			logger.info("Persisted allocation stats for date={} total={} allocated={} vacant={}", statsDate,
					snapshot.totalCapacity(), snapshot.allocatedCount(), snapshot.vacantCount());
		}

		return saved;
	}

	/**
	 * Loads all allocation snapshots sorted chronologically for dashboard charts.
	 *
	 * @return ordered allocation statistics
	 */
	public List<AllocationStats> loadChronologicalStats() {
		List<AllocationStats> stats = allocationStatsRepository.findAllByOrderByStatsDateAsc();

		if (logger.isDebugEnabled()) {
			logger.debug("Loaded {} allocation stats records", stats.size());
		}

		return stats;
	}

	/**
	 * Immutable projection of total capacity, allocated count and vacancies.
	 */
	public record AllocationSnapshot(long totalCapacity, long allocatedCount, long vacantCount) {
	}
}
